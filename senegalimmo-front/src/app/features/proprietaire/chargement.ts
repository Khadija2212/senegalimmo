import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { TEXTES_PROPRIETAIRE } from './textes';

const LIGNES_SQUELETTE = [1, 2, 3] as const;

/** Squelette d'une rubrique en registre, ou message d'erreur avec « Réessayer ». */
@Component({
  selector: 'si-chargement-rubrique',
  imports: [HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (erreur()) {
      <div class="border-input rounded-cadre border border-dashed px-6 py-8" role="alert">
        <h2 class="font-display text-[1.4rem] font-semibold">{{ textes.erreurTitre }}</h2>
        <p class="text-encre-2 mt-1.5">{{ textes.erreurTexte }}</p>
        <button hlmBtn size="grand" class="mt-4 h-[46px]" (click)="reessayer.emit()">
          {{ textes.reessayer }}
        </button>
      </div>
    } @else {
      <div class="animate-pulse" aria-busy="true" [attr.aria-label]="textes.chargement">
        <div class="bg-brume h-7 w-40 rounded-md"></div>
        @for (i of lignes; track i) {
          <div class="border-border mt-4 grid grid-cols-[96px_1fr] gap-4 border-b pb-4">
            <div class="bg-brume h-[72px] rounded-champ"></div>
            <div>
              <div class="bg-brume h-4 w-2/3 rounded"></div>
              <div class="bg-brume mt-3 h-4 w-1/2 rounded"></div>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class ChargementRubrique {
  readonly erreur = input(false);
  readonly reessayer = output<void>();
  protected readonly textes = TEXTES_PROPRIETAIRE;
  protected readonly lignes = LIGNES_SQUELETTE;
}
