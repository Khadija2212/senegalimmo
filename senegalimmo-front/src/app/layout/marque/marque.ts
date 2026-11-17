import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TEXTES_LAYOUT } from '../textes';

/** Logo : quatre claustras à coins coupés sur un carré aqua. */
@Component({
  selector: 'si-marque',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      routerLink="/"
      class="flex items-center gap-3 text-white no-underline"
      [attr.aria-label]="textes.accueil"
    >
      <svg viewBox="0 0 30 30" aria-hidden="true" class="size-[30px]">
        <rect width="30" height="30" rx="7" fill="#48fffa" />
        <path
          d="M5 5h6l2 2v6l-2 2H5zM17 5h6l2 2v6l-2 2h-6zM5 17h6l2 2v6H5zM17 17h8v6l-2 2h-6z"
          fill="#00185e"
        />
      </svg>
      <b
        class="text-[1.2rem] leading-none font-bold tracking-[-0.01em] [font-variation-settings:'wdth'_118]"
      >
        {{ textes.marque }}
      </b>
    </a>
  `,
})
export class Marque {
  protected readonly textes = TEXTES_LAYOUT;
}
