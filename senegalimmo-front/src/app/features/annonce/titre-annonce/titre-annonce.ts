import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { nombre } from '../../../core/format/fcfa';
import { Annonce } from '../../../core/modeles/annonce';
import { TEXTES_ANNONCE } from '../textes';

/** Lieu, titre, sceau de vérification, date de publication, référence et consultations. */
@Component({
  selector: 'si-titre-annonce',
  imports: [NgIcon, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="text-encre-2 flex items-center gap-1.5 text-[0.95rem]">
      <ng-icon name="siBorne" size="18" />{{ annonce().bien.quartier }}, {{ annonce().bien.ville }}
    </span>
    <h1
      class="font-display mt-2 max-w-[22ch] text-[clamp(2rem,3.6vw,3rem)] leading-[1.08] font-semibold text-balance"
    >
      {{ annonce().bien.titre }}
    </h1>
    <div class="text-encre-2 mt-4 flex flex-wrap items-center gap-x-[22px] gap-y-2 text-[0.88rem]">
      @if (annonce().badge_verifie) {
        <span class="text-foreground inline-flex items-center gap-1.5"
          ><ng-icon name="siSceau" size="18" class="text-bleu-vif" />{{
            textes.annonceVerifiee
          }}</span
        >
      }
      @if (annonce().publiee_le; as d) {
        <span>{{ textes.publieeLe }} {{ d | date: 'd MMM y' }}</span>
      }
      <span class="text-encre-3 font-mono text-xs tracking-[0.02em]">{{
        annonce().reference
      }}</span>
      <span>{{ vues() }} {{ textes.consultations }}</span>
    </div>
  `,
})
export class TitreAnnonce {
  readonly annonce = input.required<Annonce>();
  protected readonly textes = TEXTES_ANNONCE;
  protected readonly vues = computed(() => nombre(this.annonce().nombre_vues));
}
