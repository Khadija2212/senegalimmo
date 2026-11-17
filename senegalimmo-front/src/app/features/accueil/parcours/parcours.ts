import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TEXTES_PARCOURS } from '../textes';

/** Le parcours du locataire en six étapes, de la visite à la quittance. */
@Component({
  selector: 'si-parcours',
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mt-24 border-t border-border pt-7" aria-labelledby="t-parcours">
      <div class="grid gap-3 lg:grid-cols-[5fr_7fr] lg:gap-8">
        <h2
          id="t-parcours"
          class="font-display text-[clamp(2rem,3.6vw,2.9rem)] leading-[1.05] font-semibold"
        >
          {{ textes.titre }}
        </h2>
        <p class="text-encre-2 max-w-[58ch] pt-1.5">{{ textes.texte }}</p>
      </div>
      <ol class="mt-10 grid border-t border-border sm:grid-cols-3 lg:grid-cols-6">
        @for (e of textes.etapes; track e.titre) {
          <li
            class="etape grid grid-cols-[40px_1fr] gap-x-3 border-t border-border py-[18px] sm:block sm:border-t-0 sm:border-r sm:pt-6 sm:pr-[18px] sm:pb-2"
          >
            <ng-icon [name]="e.icone" size="32" class="text-bleu row-span-3" />
            <h3 class="font-bold leading-tight sm:mt-4">{{ e.titre }}</h3>
            <p class="text-encre-2 mt-1.5 text-[0.88rem]">{{ e.texte }}</p>
            <p class="text-encre-3 mt-2.5 text-[0.78rem]">{{ e.qui }}</p>
          </li>
        }
      </ol>
    </section>
  `,
  styles: `
    @media (min-width: 640px) {
      .etape {
        margin-right: 18px;
      }
      .etape:last-child {
        border-right: 0;
        margin-right: 0;
      }
    }
    @media (min-width: 640px) and (max-width: 1023px) {
      .etape:nth-child(3n) {
        border-right: 0;
        margin-right: 0;
      }
      .etape:nth-child(n + 4) {
        border-top: 1px solid var(--border);
      }
    }
  `,
})
export class Parcours {
  protected readonly textes = TEXTES_PARCOURS;
}
