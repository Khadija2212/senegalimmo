import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { Bien } from '../../../core/modeles/annonce';
import { NomIcone } from '../../../shared/icones/icones';
import { TEXTES_ANNONCE } from '../textes';

interface Fait {
  icone: NomIcone;
  valeur: string;
  libelle: string;
}

/** Surface, pièces, chambres et ameublement, rangés dans une grille à filets. */
@Component({
  selector: 'si-faits-bien',
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-8 grid grid-cols-2 border-y border-border lg:grid-cols-4">
      @for (f of faits(); track f.libelle) {
        <div class="fait flex flex-col py-[18px] pr-4">
          <ng-icon [name]="f.icone" size="24" class="text-bleu" />
          <b
            class="mt-2.5 block text-[1.25rem] leading-tight font-bold tabular-nums [font-variation-settings:'wdth'_88]"
            >{{ f.valeur }}</b
          >
          <span class="text-encre-3 text-[0.85rem]">{{ f.libelle }}</span>
        </div>
      }
    </div>
  `,
  styles: `
    .fait:nth-child(odd) {
      border-right: 1px solid var(--border);
      margin-right: 16px;
    }
    .fait:nth-child(n + 3) {
      border-top: 1px solid var(--border);
    }
    @media (min-width: 1024px) {
      .fait {
        border-right: 1px solid var(--border);
        margin-right: 16px;
      }
      .fait:last-child {
        border-right: 0;
        margin-right: 0;
      }
      .fait:nth-child(n + 3) {
        border-top: 0;
      }
    }
  `,
})
export class FaitsBien {
  readonly bien = input.required<Bien>();
  protected readonly textes = TEXTES_ANNONCE;

  protected readonly faits = computed<Fait[]>(() => {
    const b = this.bien();
    const t = this.textes;
    return [
      { icone: 'siSurface', valeur: `${b.surface} m²`, libelle: t.surface },
      {
        icone: 'siPieces',
        valeur: `${b.nombre_pieces} ${b.nombre_pieces > 1 ? t.pieces : t.piece}`,
        libelle: t.types[b.type],
      },
      {
        icone: 'siChambre',
        valeur: `${b.nombre_chambres} ${b.nombre_chambres > 1 ? t.chambres : t.chambre}`,
        libelle: t.dont,
      },
      { icone: 'siImmeuble', valeur: b.meuble ? t.meuble : t.vide, libelle: t.ameublement },
    ];
  });
}
