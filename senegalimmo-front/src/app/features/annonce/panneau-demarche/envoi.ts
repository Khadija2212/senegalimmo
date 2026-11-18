import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AnnonceDetaillee } from '../../../core/modeles/annonce';
import { messageErreur } from '../../../core/services/demarches';
import { CHEMIN_CONNEXION, versConnexion } from '../../../core/session/contexte-connexion';
import { SessionService } from '../../../core/session/session';
import { TEXTES_DEMARCHE } from '../textes';
import { Brouillon, OngletDemarche, garderBrouillon, reprendreBrouillon } from './brouillon';

export interface Confirmation {
  titre: string;
  texte: string;
  lien: string;
  libelleLien: string;
}

export type Blocage = 'connexion' | 'role' | null;

/** Envoi d'une démarche : vérifie le compte, envoie, garde l'erreur ou la confirmation. */
@Injectable()
export class EnvoiDemarche {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly enCours = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly blocage = signal<Blocage>(null);
  readonly confirmation = signal<Confirmation | null>(null);
  /** Saisie retrouvée après la connexion. */
  readonly repris = signal<Brouillon | null>(null);

  private annonce: AnnonceDetaillee | null = null;
  private enAttente: Brouillon | null = null;

  lier(annonce: AnnonceDetaillee): void {
    this.annonce = annonce;
    this.repris.set(reprendreBrouillon(annonce.id));
  }

  /** Valeurs reprises pour un onglet, ou rien s'il n'y a pas de brouillon pour lui. */
  valeursReprises(onglet: OngletDemarche): Brouillon['valeurs'] | null {
    const b = this.repris();
    return b?.onglet === onglet ? b.valeurs : null;
  }

  envoyer(
    requete: () => Observable<unknown>,
    confirmation: Confirmation,
    brouillon: Brouillon | null = null,
  ): void {
    this.erreur.set(null);
    this.enAttente = brouillon;
    this.blocage.set(
      this.session.connecte() ? (this.session.estClient() ? null : 'role') : 'connexion',
    );
    if (this.blocage()) return;
    this.enCours.set(true);
    requete().subscribe({
      next: () => {
        this.enCours.set(false);
        this.confirmation.set(confirmation);
      },
      error: (e: unknown) => {
        this.enCours.set(false);
        this.erreur.set(messageErreur(e, TEXTES_DEMARCHE.erreurEnvoi));
      },
    });
  }

  seConnecter(): void {
    const annonce = this.annonce ?? undefined;
    if (annonce && this.enAttente) garderBrouillon(annonce.id, this.enAttente);
    const { queryParams, state } = versConnexion(
      this.router.url,
      annonce,
      this.enAttente
        ? TEXTES_DEMARCHE.actionConnexion[this.actionDe(this.enAttente.onglet)]
        : undefined,
    );
    this.router.navigate([CHEMIN_CONNEXION], { queryParams, state });
  }

  private actionDe(onglet: OngletDemarche): 'visite' | 'location' | 'offre' {
    if (onglet === 'visite') return 'visite';
    return this.annonce?.type_transaction === 'vente' ? 'offre' : 'location';
  }
}
