import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { LIENS } from '../../../layout/textes';
import { TEXTES_PUBLIER } from '../textes';

/** Invitation des propriétaires et des agents, avec le motif de claustras. */
@Component({
  selector: 'si-bloc-publier',
  imports: [RouterLink, NgIcon, HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="bg-brume mt-24 grid overflow-hidden rounded-cadre border border-ciel lg:grid-cols-2"
      aria-labelledby="t-pub"
    >
      <div class="px-5 py-7 sm:px-10 sm:py-11">
        <h2
          id="t-pub"
          class="font-display max-w-[18ch] text-[clamp(1.9rem,3.2vw,2.6rem)] leading-[1.05] font-semibold"
        >
          {{ textes.titre }}
        </h2>
        <ul class="mt-6 flex flex-col gap-3.5">
          @for (p of textes.points; track p.fort) {
            <li class="text-encre-2 grid grid-cols-[24px_1fr] gap-3">
              <ng-icon [name]="p.icone" size="24" class="text-bleu" />
              <span
                ><b class="text-foreground font-semibold">{{ p.fort }}</b> {{ p.texte }}</span
              >
            </li>
          }
        </ul>
        <div class="mt-8 flex flex-wrap items-center gap-3.5">
          <a hlmBtn size="grand" [routerLink]="liens.publier">{{ textes.publier }}</a>
          <a
            class="decoration-input hover:text-bleu-vif font-semibold underline underline-offset-4"
            [routerLink]="liens.inscription"
            >{{ textes.agent }}</a
          >
        </div>
      </div>
      <div class="relative min-h-40 bg-marine lg:min-h-80 max-lg:order-first" aria-hidden="true">
        <svg
          class="absolute inset-0 size-full"
          viewBox="0 0 240 240"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="claustra" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M6 6h10l4 4v10l-4 4H6l-4-4V10z M24 6h10l4 4v10l-4 4H24l-4-4V10z M6 24h10l4 4v10H2V28z M24 24h14v10l-4 4H24l-4-4V28z"
                fill="#48fffa"
                opacity=".55"
                transform="translate(0 -2)"
              />
            </pattern>
          </defs>
          <rect width="240" height="240" fill="url(#claustra)" />
        </svg>
      </div>
    </section>
  `,
})
export class BlocPublier {
  protected readonly textes = TEXTES_PUBLIER;
  protected readonly liens = LIENS;
}
