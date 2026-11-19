import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { fcfa } from '../../core/format/fcfa';
import { PromesseVente } from '../../core/modeles/contrats';
import { PaiementsService } from '../../core/services/paiements';
import { Role } from '../../core/session/session';
import { jour } from './etat';
import { LIENS_CONTRATS, TEXTES_CONTRATS } from './textes';
import { lire } from '../../core/ressources/lire';

/** Conditions de la promesse de vente et paiement de l'indemnité par l'acheteur. */
@Component({
  selector: 'si-bloc-promesse',
  imports: [RouterLink, HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h2 class="font-display text-[1.55rem] leading-tight font-semibold">
      {{ textes.promesseConditions }}
    </h2>
    <dl class="border-border mt-3.5 border-t">
      @for (c of conditions(); track c[0]) {
        <div class="border-border flex flex-wrap justify-between gap-x-4 gap-y-1 border-b py-3">
          <dt class="text-encre-2">{{ c[0] }}</dt>
          <dd class="text-right font-semibold tabular-nums">{{ c[1] }}</dd>
        </div>
      }
    </dl>
    @if (acheteurSigne()) {
      @if (paiements.isLoading()) {
        <div class="bg-brume mt-4 h-[46px] w-48 animate-pulse rounded-[10px]"></div>
      } @else if (indemnitePayee()) {
        <p class="mt-4 text-[0.92rem]">
          <b class="text-succes font-semibold">{{ textes.indemnitePayee }}</b>
        </p>
      } @else if (promesse().indemnite_immobilisation > 0) {
        <a
          hlmBtn
          size="grand"
          class="mt-4 h-[46px]"
          [routerLink]="cheminPaiements"
          [queryParams]="{ type: 'indemnite', promesse: promesse().id }"
          >{{ textes.payerIndemnite }}</a
        >
      }
    }
  `,
})
export class BlocPromesse {
  readonly promesse = input.required<PromesseVente>();
  readonly role = input.required<Role | null>();

  protected readonly textes = TEXTES_CONTRATS;
  protected readonly cheminPaiements = LIENS_CONTRATS.paiements;
  private readonly service = inject(PaiementsService);

  /** Seul l'acheteur paie l'indemnité, une fois la promesse signée par les deux parties. */
  protected readonly acheteurSigne = computed(
    () => this.role() === 'client' && this.promesse().statut === 'signe',
  );
  protected readonly paiements = rxResource({
    params: () => (this.acheteurSigne() ? this.promesse().id : undefined),
    stream: () => this.service.lister(),
  });
  protected readonly indemnitePayee = computed(() =>
    (lire(this.paiements) ?? []).some(
      (p) =>
        p.type === 'indemnite' && p.promesse_id === this.promesse().id && p.statut === 'reussi',
    ),
  );
  protected readonly conditions = computed((): readonly (readonly [string, string])[] => {
    const p = this.promesse();
    return [
      [this.textes.prixDeVente, fcfa(p.prix_vente)],
      [this.textes.indemnite, fcfa(p.indemnite_immobilisation)],
      [this.textes.dateLimite, jour(p.date_limite_acte)],
      [this.textes.conditionsSuspensives, p.conditions_suspensives || this.textes.aucune],
    ];
  });
}
