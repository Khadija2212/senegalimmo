import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { SelectionService } from '../../../core/services/selection';
import { LIENS } from '../../../layout/textes';
import { TEXTES_ACCUEIL } from '../textes';

const COMPARAISON_MIN = 2;

/** Barre fixe du cas « Comparer des biens », visible dès deux annonces choisies. */
@Component({
  selector: 'si-barre-comparer',
  imports: [RouterLink, HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div
        class="fixed bottom-4 left-4 right-4 z-20 flex items-center justify-between gap-5 rounded-cadre bg-marine py-2.5 pl-5 pr-2.5 text-white shadow-[0_12px_32px_rgb(0_24_94/0.35)] sm:right-auto sm:left-1/2 sm:bottom-5 sm:-translate-x-1/2"
        role="status"
      >
        <span
          ><b class="tabular-nums">{{ selection.nombreComparees() }}</b>
          {{ textes.biensAComparer }}</span
        >
        <a
          hlmBtn
          size="lg"
          class="bg-aqua text-marine hover:bg-white px-4 font-semibold"
          [routerLink]="liens.comparer"
          [queryParams]="{ ids: selection.comparees().join(',') }"
          >{{ textes.comparer }}</a
        >
      </div>
    }
  `,
})
export class BarreComparer {
  protected readonly selection = inject(SelectionService);
  protected readonly textes = TEXTES_ACCUEIL;
  protected readonly liens = LIENS;
  protected readonly visible = computed(() => this.selection.nombreComparees() >= COMPARAISON_MIN);
}
