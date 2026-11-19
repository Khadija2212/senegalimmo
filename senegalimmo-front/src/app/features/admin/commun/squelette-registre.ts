import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TEXTES_ADMIN } from '../textes';

/** Squelette d'un registre pendant le chargement, comme celui de l'espace client. */
@Component({
  selector: 'si-squelette-registre',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="animate-pulse" aria-busy="true" [attr.aria-label]="textes.chargement">
      @for (i of lignes; track i) {
        <div
          class="border-border grid grid-cols-[64px_1fr] gap-4 border-b py-4 sm:grid-cols-[96px_1fr]"
        >
          <div class="bg-brume h-16 rounded-champ sm:h-[72px]"></div>
          <div>
            <div class="bg-brume h-4 w-2/3 rounded"></div>
            <div class="bg-brume mt-3 h-4 w-1/2 rounded"></div>
          </div>
        </div>
      }
    </div>
  `,
  host: { class: 'block mt-3.5' },
})
export class SqueletteRegistre {
  protected readonly textes = TEXTES_ADMIN;
  protected readonly lignes = [1, 2, 3];
}
