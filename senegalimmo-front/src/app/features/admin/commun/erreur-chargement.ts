import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { TEXTES_ADMIN } from '../textes';

/** Erreur de chargement d'une rubrique, avec « Réessayer ». */
@Component({
  selector: 'si-erreur-chargement',
  imports: [HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="border-input mt-3.5 rounded-cadre border border-dashed px-6 py-8" role="alert">
      <h3 class="font-display text-[1.4rem] font-semibold">{{ titre() }}</h3>
      <p class="text-encre-2 mt-1.5">{{ textes.erreurTexte }}</p>
      <button hlmBtn size="grand" class="mt-4 h-[46px]" (click)="reessayer.emit()">
        {{ textes.reessayer }}
      </button>
    </div>
  `,
  host: { class: 'block' },
})
export class ErreurChargement {
  readonly titre = input<string>(TEXTES_ADMIN.erreurTitre);
  readonly reessayer = output<void>();
  protected readonly textes = TEXTES_ADMIN;
}
