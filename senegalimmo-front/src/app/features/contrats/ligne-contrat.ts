import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { NatureContrat } from '../../core/modeles/contrats';
import { NomIcone } from '../../shared/icones/icones';
import { LigneContrat as Ligne } from './contrats-vue';
import { COULEUR_TON } from './etat';
import { TEXTES_CONTRATS } from './textes';

const ICONES: Readonly<Record<NatureContrat, NomIcone>> = {
  bail: 'siCle',
  promesse_vente: 'siSceau',
  mandat: 'siContrat',
};

/** Un contrat en registre : nature, bien, autre partie, état en mot coloré, action. */
@Component({
  selector: 'si-ligne-contrat',
  imports: [RouterLink, NgIcon, HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../shared/espace/lien-texte.css',
  host: {
    class:
      'grid grid-cols-1 items-start gap-3 border-b border-border py-[18px] sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-[18px]',
  },
  template: `
    @let l = ligne();
    <div class="min-w-0">
      <span
        class="text-encre-3 flex items-center gap-2 text-[0.78rem] font-semibold tracking-[0.06em] uppercase"
      >
        <ng-icon [name]="icone()" size="18" class="text-bleu" />{{ l.natureLibelle }}
      </span>
      <h3 class="mt-1 text-[1.02rem] leading-snug font-semibold">
        <a [routerLink]="l.lien" class="hover:underline hover:underline-offset-[3px]">{{
          l.bien
        }}</a>
      </h3>
      <p class="text-encre-2 mt-1 text-[0.9rem] tabular-nums">
        <b class="text-foreground font-semibold">{{ l.detail }}</b>
      </p>
      <p class="text-encre-3 mt-0.5 text-[0.85rem]">
        {{ l.reference }}
        @if (l.autre) {
          <span class="text-encre-2">, {{ l.autre }}</span>
        }
      </p>
      <p class="mt-2 text-[0.88rem]">
        <b class="font-semibold" [class]="couleur()">{{ l.etat.libelle }}</b>
        @if (l.etat.explication) {
          <span class="text-encre-2 ml-1.5">{{ l.etat.explication }}</span>
        }
      </p>
    </div>
    <div class="flex flex-col items-start gap-2 sm:items-end">
      @if (l.aSigner && principale()) {
        <a hlmBtn class="h-[42px] px-4 text-[0.9rem]" [routerLink]="l.lien">{{ textes.signer }}</a>
      } @else if (l.aSigner) {
        <a class="lien-texte" [routerLink]="l.lien">{{ textes.signer }}</a>
      } @else {
        <a class="lien-texte" [routerLink]="l.lien">{{ textes.voirContrat }}</a>
      }
    </div>
  `,
})
export class LigneContrat {
  readonly ligne = input.required<Ligne>();
  /** Seul le premier contrat à signer est un bouton plein. */
  readonly principale = input(false);

  protected readonly textes = TEXTES_CONTRATS;
  protected readonly icone = computed(() => ICONES[this.ligne().nature]);
  protected readonly couleur = computed(() => COULEUR_TON[this.ligne().etat.ton]);
}
