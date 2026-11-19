import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { GARANTIES, TEXTES_CONNEXION } from './textes';

const PHOTO = '/images/connexion.jpg';

/** Colonne bleu nuit : une photo et trois faits vrais du projet. */
@Component({
  selector: 'si-promesse-connexion',
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="relative hidden min-h-[260px] flex-1 overflow-hidden lg:block">
      <img [src]="photo" alt="" class="absolute inset-0 size-full object-cover" />
      <figcaption
        class="bg-marine text-ciel absolute bottom-0 left-0 py-2 pr-3.5 pl-10 text-[0.8rem]"
      >
        {{ textes.promessePhoto }}
      </figcaption>
    </figure>
    <div class="px-4 pt-7 pb-9 sm:px-7 lg:px-10 lg:pt-9 lg:pb-10">
      <h2
        class="font-display max-w-[18ch] text-[clamp(1.7rem,2.6vw,2.3rem)] leading-[1.1] font-semibold text-balance"
      >
        {{ textes.promesseTitre }}
      </h2>
      <ul class="border-ciel/30 mt-6 border-t">
        @for (g of garanties; track g.titre) {
          <li
            class="border-ciel/30 text-ciel grid grid-cols-[24px_1fr] gap-3.5 border-b py-3.5 text-[0.92rem]"
          >
            <ng-icon [name]="g.icone" size="24" class="text-aqua" />
            <span
              ><b class="block font-semibold text-white">{{ g.titre }}</b
              >{{ g.texte }}</span
            >
          </li>
        }
      </ul>
    </div>
  `,
  host: {
    class: 'bg-marine order-2 flex flex-col text-white lg:sticky lg:top-0 lg:order-none lg:h-svh',
    role: 'complementary',
    '[attr.aria-label]': 'textes.pourquoi',
  },
})
export class PromesseConnexion {
  protected readonly textes = TEXTES_CONNEXION;
  protected readonly garanties = GARANTIES;
  protected readonly photo = PHOTO;
}
