import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HlmButton } from '@spartan-ng/helm/button';
import { Bail, EtatDesLieux, TypeEtatDesLieux } from '../../core/modeles/contrats';
import { ContratsService } from '../../core/services/contrats';
import { messageErreur } from '../../core/services/demarches';
import { Role } from '../../core/session/session';
import { jour } from './etat';
import { FormEtatDesLieux } from './form-etat-des-lieux';
import { TEXTES_CONTRATS } from './textes';
import { lire } from '../../core/ressources/lire';

const TYPES: readonly TypeEtatDesLieux[] = ['entree', 'sortie'];

/** États des lieux d'un bail signé : le propriétaire les réalise, le locataire les valide. */
@Component({
  selector: 'si-etats-des-lieux',
  imports: [HlmButton, FormEtatDesLieux],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './etats-des-lieux.html',
  styleUrl: '../../shared/espace/lien-texte.css',
  host: { class: 'block' },
})
export class EtatsDesLieux {
  protected readonly lire = lire;
  readonly bail = input.required<Bail>();
  readonly role = input.required<Role | null>();

  protected readonly textes = TEXTES_CONTRATS;
  protected readonly jour = jour;
  private readonly service = inject(ContratsService);

  protected readonly etats = rxResource({
    params: () => this.bail().id,
    stream: ({ params }) => this.service.etatsDesLieux(params),
  });
  /** Types encore à réaliser, proposés au propriétaire tant que le bail est signé. */
  protected readonly manquants = computed(() => {
    if (this.role() !== 'proprietaire' || this.bail().statut !== 'signe') return [];
    const faits = (lire(this.etats) ?? []).map((e) => e.type);
    return TYPES.filter((t) => !faits.includes(t));
  });
  /** Seul le premier état des lieux à valider est un bouton plein. */
  protected readonly premierAValider = computed(
    () =>
      (this.role() === 'client' ? lire(this.etats)?.find((e) => !e.valide_le)?.id : null) ?? null,
  );
  protected readonly formulaire = signal(false);
  protected readonly enCours = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);

  protected titre(e: EtatDesLieux | TypeEtatDesLieux): string {
    const type = typeof e === 'string' ? e : e.type;
    return type === 'entree' ? this.textes.etatEntree : this.textes.etatSortie;
  }

  protected valider(e: EtatDesLieux): void {
    this.enCours.set(e.id);
    this.erreur.set(null);
    this.service.validerEtatDesLieux(e.id).subscribe({
      next: () => {
        this.enCours.set(null);
        this.etats.reload();
      },
      error: (err: unknown) => {
        this.enCours.set(null);
        this.erreur.set(messageErreur(err, this.textes.erreurAction));
      },
    });
  }

  protected cree(): void {
    this.formulaire.set(false);
    this.etats.reload();
  }
}
