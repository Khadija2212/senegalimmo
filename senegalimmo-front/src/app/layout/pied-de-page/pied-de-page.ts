import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Marque } from '../marque/marque';
import { LIENS, TEXTES_LAYOUT } from '../textes';

@Component({
  selector: 'si-pied-de-page',
  imports: [RouterLink, Marque],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mx-auto grid max-w-[1240px] gap-8 px-4 py-10 sm:px-7 md:grid-cols-[5fr_3fr_4fr] lg:px-10"
    >
      <div>
        <si-marque />
        <p class="text-ciel mt-3 max-w-[40ch] text-sm">{{ textes.presentation }}</p>
      </div>
      <div>
        <h2 class="mb-2 text-sm font-semibold text-white">{{ textes.chercher }}</h2>
        <a class="lien" [routerLink]="liens.louer.chemin" [queryParams]="liens.louer.parametres">{{
          textes.louer
        }}</a>
        <a
          class="lien"
          [routerLink]="liens.acheter.chemin"
          [queryParams]="liens.acheter.parametres"
          >{{ textes.acheter }}</a
        >
        <a class="lien" [routerLink]="liens.comparer">{{ textes.comparer }}</a>
      </div>
      <div>
        <h2 class="mb-2 text-sm font-semibold text-white">{{ textes.proposer }}</h2>
        <a class="lien" [routerLink]="liens.publier">{{ textes.publier }}</a>
        <a class="lien" [routerLink]="liens.inscription">{{ textes.devenirAgent }}</a>
      </div>
    </div>
  `,
  styles: `
    .lien {
      display: block;
      padding: 4px 0;
      color: var(--color-ciel);
      font-size: 0.9rem;
      text-decoration: none;
    }
    .lien:hover {
      color: #ffffff;
      text-decoration: underline;
    }
  `,
  host: { class: 'mt-24 block bg-marine' },
})
export class PiedDePage {
  protected readonly textes = TEXTES_LAYOUT;
  protected readonly liens = LIENS;
}
