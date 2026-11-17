import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { Bien } from '../../../core/modeles/annonce';
import { CarteMapbox, Repere } from '../../../shared/carte/carte-mapbox';
import { TEXTES_ANNONCE } from '../textes';

const ZOOM_BIEN = 13.6;

/** « Où se trouve le bien » : le plan du quartier (Mapbox) et l'adresse. */
@Component({
  selector: 'si-lieu-bien',
  imports: [NgIcon, CarteMapbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (centre(); as c) {
      <section class="mt-9 sm:mt-11" aria-labelledby="t-lieu">
        <h2 id="t-lieu" class="font-display mb-3.5 text-[1.6rem] leading-[1.1] font-semibold">
          {{ textes.ouSeTrouve }}
        </h2>
        <si-carte-mapbox
          class="bg-brume aspect-[4/3] rounded-cadre sm:aspect-[16/7]"
          [attr.aria-label]="textes.planQuartier"
          [centre]="c"
          [zoom]="zoom"
          [reperes]="reperes()"
        />
        <p class="text-encre-2 mt-3.5 flex items-start gap-2.5 text-[0.95rem]">
          <ng-icon name="siBorne" size="18" class="mt-0.5" />
          <span
            ><b class="text-foreground font-semibold"
              >{{ bien().adresse }}, {{ bien().quartier }}, {{ bien().ville }}</b
            ><br />{{ textes.positionVerifiee }}</span
          >
        </p>
      </section>
    }
  `,
})
export class LieuBien {
  readonly bien = input.required<Bien>();
  protected readonly textes = TEXTES_ANNONCE;
  protected readonly zoom = ZOOM_BIEN;

  protected readonly centre = computed<[number, number] | null>(() => {
    const { longitude, latitude } = this.bien();
    return longitude !== null && latitude !== null ? [longitude, latitude] : null;
  });

  protected readonly reperes = computed<Repere[]>(() => {
    const c = this.centre();
    return c ? [{ id: this.bien().id, lng: c[0], lat: c[1] }] : [];
  });
}
