import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { fcfa } from '../../core/format/fcfa';
import { Paiement } from '../../core/modeles/paiements';
import { ouvrirDocument } from '../../core/services/contrats';
import { messageErreur } from '../../core/services/demarches';
import { PaiementsService } from '../../core/services/paiements';
import { Role } from '../../core/session/session';
import { COULEUR_TON } from '../contrats/etat';
import {
  etatPaiement,
  libelleDocument,
  libelleMethode,
  lienContrat,
  peutTelecharger,
} from './paiements-vue';
import { TEXTES_PAIEMENTS } from './textes';

/** Un paiement en registre : ce qu'il règle, le bien, le montant, l'état et le reçu. */
@Component({
  selector: 'si-ligne-paiement',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../shared/espace/lien-texte.css',
  host: {
    class:
      'grid grid-cols-1 items-start gap-2 border-b border-border py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-[18px]',
  },
  template: `
    @let p = paiement();
    <div class="min-w-0">
      <h3 class="text-[1rem] leading-snug font-semibold">{{ p.libelle }}</h3>
      @if (p.bien) {
        <p class="text-encre-2 mt-0.5 text-[0.9rem]">
          @if (lien(); as l) {
            <a [routerLink]="l" class="hover:underline hover:underline-offset-[3px]">{{
              p.bien.titre
            }}</a>
          } @else {
            {{ p.bien.titre }}
          }
        </p>
      }
      @if (precisions()) {
        <p class="text-encre-3 mt-0.5 text-[0.85rem]">{{ precisions() }}</p>
      }
    </div>
    <div class="flex flex-col items-start gap-1 sm:items-end sm:text-right">
      <b class="text-[1.05rem] font-semibold tabular-nums">{{ montant() }}</b>
      @if (net(); as n) {
        <span class="text-encre-3 text-[0.82rem] tabular-nums">{{ n }}</span>
      }
      <p class="text-[0.88rem]">
        <b class="font-semibold" [class]="couleur()">{{ etat().libelle }}</b>
        @if (etat().explication) {
          <span class="text-encre-2 ml-1.5">{{ etat().explication }}</span>
        }
      </p>
      @if (telechargeable()) {
        <button
          type="button"
          class="lien-texte mt-1"
          [disabled]="ouverture()"
          (click)="telecharger()"
        >
          {{ ouverture() ? textes.ouvertureDocument : document() }}
        </button>
      }
      @if (erreur(); as e) {
        <p class="text-destructive text-[0.85rem]" role="alert">{{ e }}</p>
      }
    </div>
  `,
})
export class LignePaiement {
  readonly paiement = input.required<Paiement>();
  readonly role = input.required<Role | null>();

  protected readonly textes = TEXTES_PAIEMENTS;
  private readonly service = inject(PaiementsService);

  protected readonly etat = computed(() => etatPaiement(this.paiement()));
  protected readonly couleur = computed(() => COULEUR_TON[this.etat().ton]);
  protected readonly montant = computed(() => fcfa(this.paiement().montant));
  protected readonly lien = computed(() => lienContrat(this.paiement()));
  protected readonly document = computed(() => libelleDocument(this.paiement()));
  protected readonly telechargeable = computed(() => peutTelecharger(this.paiement()));
  /** Le client voit à qui il a versé, le propriétaire qui l'a payé ; puis le moyen de paiement. */
  protected readonly precisions = computed(() => {
    const p = this.paiement();
    const client = this.role() === 'client';
    const autre = client ? p.beneficiaire : p.payeur;
    const nom = autre ? `${autre.prenom} ${autre.nom}` : null;
    const partie = nom ? (client ? this.textes.verseA(nom) : this.textes.verseePar(nom)) : '';
    return [partie, libelleMethode(p.methode)].filter(Boolean).join(', ');
  });
  /** Ce que le propriétaire touche vraiment, quand la plateforme a retenu une commission. */
  protected readonly net = computed(() => {
    const p = this.paiement();
    return this.role() !== 'client' && p.statut === 'reussi' && p.commission > 0
      ? this.textes.netRecu(fcfa(p.montant_net))
      : null;
  });

  protected readonly ouverture = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected telecharger(): void {
    this.ouverture.set(true);
    this.erreur.set(null);
    ouvrirDocument(this.service.quittance(this.paiement().id)).subscribe({
      next: () => this.ouverture.set(false),
      error: (e: unknown) => {
        this.ouverture.set(false);
        this.erreur.set(messageErreur(e, this.textes.erreurAction));
      },
    });
  }
}
