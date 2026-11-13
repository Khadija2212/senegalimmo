<?php

namespace App\Providers;

use App\Models\Annonce;
use App\Models\Commission;
use App\Models\Contrat;
use App\Models\DemandeLocation;
use App\Models\EtatDesLieux;
use App\Models\Mandat;
use App\Models\Notation;
use App\Models\OffreAchat;
use App\Models\Paiement;
use App\Models\PromesseVente;
use App\Models\User;
use App\Models\Visite;
use App\Services\Notifier;
use Illuminate\Support\ServiceProvider;

class AlerteServiceProvider extends ServiceProvider
{
    public function register(): void
    {
    }

    private static function acteur(): ?int
    {
        return request()->user()?->id;
    }

    private static function fcfa($n): string
    {
        return number_format((float) $n, 0, ',', ' ') . ' FCFA';
    }

    private static function nom(?User $u): string
    {
        return $u ? trim($u->prenom . ' ' . $u->nom) : 'Un utilisateur';
    }

    public function boot(): void
    {
        $this->visites();
        $this->location();
        $this->ventes();
        $this->mandats();
        $this->divers();
    }

    private function visites(): void
    {
        Visite::created(function (Visite $v) {
            $texte = self::nom($v->demandeur) . ' souhaite visiter « ' . $v->bien?->titre
                . ' » le ' . $v->date_visite->format('d/m/Y à H\hi') . '.';

            Notifier::envoyer($v->proprietaire_id, 'Nouvelle demande de visite', $texte, '/visites');

            // L'agent assigné (ou l'agence) est prévenu aussi
            $mandat = Mandat::where('bien_id', $v->bien_id)->where('statut', 'actif')->first();
            $gestionnaire = $mandat?->agent_id ?? $mandat?->agence_id;

            if ($gestionnaire && $gestionnaire !== $v->proprietaire_id) {
                Notifier::envoyer($gestionnaire, 'Nouvelle demande de visite', $texte, '/visites');
            }
        });

        Visite::updated(function (Visite $v) {
            if (!$v->wasChanged('statut')) {
                return;
            }

            $labels = ['confirme' => 'confirmée', 'annule' => 'annulée', 'effectue' => 'effectuée'];
            $label = $labels[$v->statut] ?? $v->statut;
            $dest = self::acteur() === $v->demandeur_id ? $v->proprietaire_id : $v->demandeur_id;

            Notifier::envoyer($dest, 'Visite ' . $label, 'La visite de « ' . $v->bien?->titre . ' » est ' . $label . '.', '/visites');
        });
    }

    private function location(): void
    {
        DemandeLocation::created(fn (DemandeLocation $d) => Notifier::envoyer(
            $d->proprietaire_id,
            'Nouvelle demande de location',
            self::nom($d->locataire) . ' souhaite louer « ' . $d->bien?->titre . ' ».',
            '/demandes'
        ));

        DemandeLocation::updated(function (DemandeLocation $d) {
            if (!$d->wasChanged('statut')) {
                return;
            }

            $titre = $d->bien?->titre;

            match ($d->statut) {
                'acceptee' => Notifier::envoyer($d->locataire_id, 'Demande acceptée',
                    "Votre demande pour « $titre » est acceptée : le bail va être établi.", '/demandes'),
                'refusee' => Notifier::envoyer($d->locataire_id, 'Demande refusée',
                    "Votre demande pour « $titre » est refusée" . ($d->motif_refus ? ' : ' . $d->motif_refus : '.'), '/demandes'),
                'annulee' => Notifier::envoyer($d->proprietaire_id, 'Demande annulée',
                    self::nom($d->locataire) . " a annulé sa demande pour « $titre ».", '/demandes'),
                default => null,
            };
        });

        Contrat::created(fn (Contrat $c) => Notifier::envoyer(
            $c->locataire_id,
            'Bail à signer',
            'Le bail de « ' . $c->bien?->titre . ' » est prêt : consultez-le et signez-le.',
            '/contrats'
        ));

        Contrat::updated(function (Contrat $c) {
            $titre = $c->bien?->titre;

            if ($c->wasChanged('signe_proprietaire') && $c->signe_proprietaire) {
                Notifier::envoyer($c->locataire_id, 'Bail signé par le propriétaire',
                    "Le propriétaire a signé le bail de « $titre ».", '/contrats');
            }

            if ($c->wasChanged('signe_locataire') && $c->signe_locataire) {
                Notifier::envoyer($c->proprietaire_id, 'Bail signé par le locataire',
                    self::nom($c->locataire) . " a signé le bail de « $titre ».", '/contrats');
            }

            if ($c->wasChanged('statut') && $c->statut === 'signe') {
                Notifier::envoyer($c->locataire_id, 'Bail conclu',
                    "Le bail de « $titre » est signé : vous pouvez payer la caution.", '/contrats');
                Notifier::envoyer($c->proprietaire_id, 'Bail conclu',
                    "Le bail de « $titre » est signé : vous pouvez établir l'état des lieux d'entrée.", '/contrats');
            }
        });

        EtatDesLieux::created(function (EtatDesLieux $e) {
            Notifier::envoyer(
                $e->contrat?->locataire_id,
                'État des lieux à valider',
                'Un état des lieux (' . $e->type . ') a été établi : vérifiez-le et validez-le.',
                '/contrats/' . $e->contrat_id . '/etats-des-lieux'
            );
        });

        EtatDesLieux::updated(function (EtatDesLieux $e) {
            if ($e->wasChanged('valide_locataire') && $e->valide_locataire) {
                Notifier::envoyer(
                    $e->contrat?->proprietaire_id,
                    'État des lieux validé',
                    'Le locataire a validé l\'état des lieux (' . $e->type . ').',
                    '/contrats/' . $e->contrat_id . '/etats-des-lieux'
                );
            }
        });
    }

    private function ventes(): void
    {
        OffreAchat::created(fn (OffreAchat $o) => Notifier::envoyer(
            $o->proprietaire_id,
            'Nouvelle offre d\'achat',
            self::nom($o->acheteur) . ' propose ' . self::fcfa($o->montant_offre) . ' pour « ' . $o->bien?->titre . ' ».',
            '/offres'
        ));

        OffreAchat::updated(function (OffreAchat $o) {
            if (!$o->wasChanged('statut')) {
                return;
            }

            $titre = $o->bien?->titre;

            match ($o->statut) {
                'contre_proposee' => Notifier::envoyer($o->acheteur_id, 'Contre-proposition',
                    'Le propriétaire propose ' . self::fcfa($o->montant_contre) . " pour « $titre ».", '/offres'),
                'acceptee' => Notifier::envoyer(
                    self::acteur() === $o->acheteur_id ? $o->proprietaire_id : $o->acheteur_id,
                    'Offre acceptée',
                    "L'offre pour « $titre » est acceptée à " . self::fcfa($o->montant_final) . '.',
                    '/offres'
                ),
                'refusee' => Notifier::envoyer($o->acheteur_id, 'Offre refusée',
                    "Votre offre pour « $titre » est refusée" . ($o->motif_refus ? ' : ' . $o->motif_refus : '.'), '/offres'),
                'annulee' => Notifier::envoyer($o->proprietaire_id, 'Offre annulée',
                    self::nom($o->acheteur) . " a retiré son offre pour « $titre ».", '/offres'),
                'en_attente' => Notifier::envoyer($o->proprietaire_id, 'Nouvelle offre',
                    self::nom($o->acheteur) . ' propose ' . self::fcfa($o->montant_offre) . " pour « $titre ».", '/offres'),
                default => null,
            };
        });

        PromesseVente::created(fn (PromesseVente $p) => Notifier::envoyer(
            $p->acheteur_id,
            'Promesse de vente à signer',
            'La promesse de vente de « ' . $p->bien?->titre . ' » est prête : consultez-la et signez-la.',
            '/promesses'
        ));

        PromesseVente::updated(function (PromesseVente $p) {
            $titre = $p->bien?->titre;

            if ($p->wasChanged('signe_vendeur') && $p->signe_vendeur) {
                Notifier::envoyer($p->acheteur_id, 'Promesse signée par le vendeur',
                    "Le vendeur a signé la promesse de « $titre ».", '/promesses');
            }

            if ($p->wasChanged('signe_acheteur') && $p->signe_acheteur) {
                Notifier::envoyer($p->vendeur_id, 'Promesse signée par l\'acquéreur',
                    "L'acquéreur a signé la promesse de « $titre ».", '/promesses');
            }

            if ($p->wasChanged('statut') && $p->statut === 'signee') {
                Notifier::envoyer($p->vendeur_id, 'Vente conclue', "La promesse de « $titre » est signée par les deux parties.", '/promesses');
                Notifier::envoyer($p->acheteur_id, 'Vente conclue', "La promesse de « $titre » est signée par les deux parties.", '/promesses');
            }
        });
    }

    private function mandats(): void
    {
        Mandat::created(fn (Mandat $m) => Notifier::envoyer(
            $m->agence_id,
            'Nouveau mandat proposé',
            self::nom($m->proprietaire) . ' vous confie « ' . $m->bien?->titre . ' » (commission ' . $m->commission_pct . ' %).',
            '/mandats'
        ));

        Mandat::updated(function (Mandat $m) {
            $titre = $m->bien?->titre;

            if ($m->wasChanged('statut')) {
                match ($m->statut) {
                    'actif' => Notifier::envoyer($m->proprietaire_id, 'Mandat accepté',
                        self::nom($m->agence) . " a accepté le mandat sur « $titre ».", '/mandats'),
                    'refuse' => Notifier::envoyer($m->proprietaire_id, 'Mandat refusé',
                        self::nom($m->agence) . " a refusé le mandat sur « $titre »" . ($m->motif_refus ? ' : ' . $m->motif_refus : '.'), '/mandats'),
                    'resilie' => Notifier::envoyer(
                        self::acteur() === $m->proprietaire_id ? $m->agence_id : $m->proprietaire_id,
                        'Mandat résilié', "Le mandat sur « $titre » est résilié.", '/mandats'
                    ),
                    'annule' => Notifier::envoyer($m->agence_id, 'Proposition annulée',
                        "Le propriétaire a annulé sa proposition de mandat sur « $titre ».", '/mandats'),
                    default => null,
                };
            }

            if ($m->wasChanged('agent_id') && $m->agent_id) {
                Notifier::envoyer($m->agent_id, 'Un bien vous est assigné', "Le bien « $titre » vous est confié.", '/biens-geres');
            }
        });
    }

    private function divers(): void
    {
        Annonce::created(fn (Annonce $a) => Notifier::admins(
            'Annonce à modérer',
            'L\'annonce « ' . $a->titre . ' » attend votre validation.',
            '/admin/annonces'
        ));

        Annonce::updated(function (Annonce $a) {
            if (!$a->wasChanged('statut')) {
                return;
            }

            $lien = $a->auteur?->role === 'proprietaire' ? '/proprietaire/biens' : '/biens-geres';

            if ($a->statut === 'publiee') {
                Notifier::envoyer($a->auteur_id, 'Annonce publiée', "Votre annonce « {$a->titre} » est en ligne.", $lien);

                $proprietaire = $a->bien?->proprietaire_id;
                if ($proprietaire && $proprietaire !== $a->auteur_id) {
                    Notifier::envoyer($proprietaire, 'Annonce publiée', "L'annonce « {$a->titre} » est en ligne.", '/proprietaire/biens');
                }
            } elseif ($a->statut === 'rejetee') {
                Notifier::envoyer($a->auteur_id, 'Annonce rejetée',
                    "Votre annonce « {$a->titre} » est rejetée" . ($a->motif_rejet ? ' : ' . $a->motif_rejet : '.'), $lien);
            }
        });

        Paiement::updated(function (Paiement $p) {
            if ($p->wasChanged('statut') && $p->statut === 'confirme') {
                Notifier::envoyer($p->beneficiaire_id, 'Paiement reçu', 'Vous avez reçu ' . self::fcfa($p->montant) . '.', '/paiements');
                Notifier::envoyer($p->payeur_id, 'Paiement confirmé', 'Votre paiement de ' . self::fcfa($p->montant) . ' est confirmé.', '/paiements');
            }
        });

        Notation::created(fn (Notation $n) => Notifier::envoyer(
            $n->note_id,
            'Nouvel avis reçu',
            'Vous avez reçu une note de ' . $n->note . '/5.',
            '/avis/' . $n->note_id
        ));

        Commission::created(function (Commission $c) {
            $texte = 'Commission de ' . self::fcfa($c->montant) . ' générée sur « ' . $c->bien?->titre . ' ».';

            foreach (array_unique(array_filter([$c->agence_id, $c->agent_id])) as $destId) {
                Notifier::envoyer($destId, 'Commission générée', $texte, '/commissions');
            }
            Notifier::envoyer($c->proprietaire_id, 'Commission due à l\'agent immobilier', $texte, '/commissions');
        });

        User::created(function (User $u) {
            if ($u->role === 'administrateur') {
                return;
            }

            Notifier::admins('Nouvelle inscription', self::nom($u) . ' (' . $u->role . ') vient de s\'inscrire.', '/admin/utilisateurs');
        });

        User::updated(function (User $u) {
            if (!$u->wasChanged('verification')) {
                return;
            }

            match ($u->verification) {
                'en_attente' => Notifier::admins('Document à vérifier',
                    self::nom($u) . ' a envoyé un document d\'identité.', '/admin/utilisateurs'),
                'verifie' => Notifier::envoyer($u->id, 'Compte vérifié', 'Votre identité a été vérifiée. Merci !', '/profil'),
                'refuse' => Notifier::envoyer($u->id, 'Vérification refusée',
                    'Votre document a été refusé' . ($u->verification_motif ? ' : ' . $u->verification_motif : '.')
                    . ' Vous pouvez en envoyer un autre.', '/profil'),
                default => null,
            };
        });
    }
}