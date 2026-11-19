import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { FcfaPipe } from '../../core/format/fcfa.pipe';
import { Annonce } from '../../core/modeles/annonce';
import { SelectionService } from '../../core/services/selection';
import { premierePhoto } from './demarches-vue';
import { TEXTES_ESPACE } from './textes';

const CHEMIN_ANNONCE = '/annonces';

/** Cas « Sauvegarder en favoris » et « Comparer des biens », vus depuis l'espace client. */
@Component({
  selector: 'si-liste-favoris',
  imports: [RouterLink, NgIcon, FcfaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../shared/espace/lien-texte.css',
  template: `
    @for (a of favoris(); track a.id) {
      <div
        class="border-border grid grid-cols-[96px_minmax(0,1fr)] items-start gap-4 border-b py-[18px] sm:grid-cols-[160px_minmax(0,1fr)_auto] sm:gap-5"
      >
        @if (photo(a); as p) {
          <img [src]="p" alt="" class="h-20 w-24 rounded-media object-cover sm:h-28 sm:w-40" />
        } @else {
          <span class="bg-brume h-20 w-24 rounded-media sm:h-28 sm:w-40"></span>
        }
        <div class="min-w-0">
          <h3 class="text-[1.02rem] leading-snug font-semibold">
            <a
              [routerLink]="[cheminAnnonce, a.id]"
              class="hover:underline hover:underline-offset-[3px]"
              >{{ a.bien.titre }}</a
            >
          </h3>
          <p
            class="mt-2.5 text-[1.2rem] leading-none font-bold tabular-nums [font-variation-settings:'wdth'_85]"
          >
            {{ a.prix + a.charges | fcfa }}
            @if (a.type_transaction === 'location') {
              <small class="text-encre-3 ml-1 text-[0.85rem] font-normal">{{
                textes.parMois
              }}</small>
            }
          </p>
          @if (indisponible(a); as raison) {
            <p class="text-refus mt-2 text-[0.88rem] font-semibold">{{ raison }}</p>
          } @else if (a.badge_verifie) {
            <span class="text-encre-2 mt-2 inline-flex items-center gap-1.5 text-[0.85rem]">
              <ng-icon name="siSceau" size="18" class="text-bleu" />{{ textes.annonceVerifiee }}
            </span>
          }
        </div>
        <div class="col-start-2 flex gap-4 sm:col-start-auto sm:flex-col sm:items-end sm:gap-2">
          @if (!indisponible(a)) {
            <button
              type="button"
              class="lien-texte"
              [attr.aria-pressed]="selection.estComparee(a.id)"
              (click)="selection.basculerComparaison(a.id)"
            >
              {{ selection.estComparee(a.id) ? textes.dansComparaison : textes.comparer }}
            </button>
          }
          <button type="button" class="lien-texte danger" (click)="retirer.emit(a.id)">
            {{ textes.retirer }}
          </button>
        </div>
      </div>
    }
  `,
  host: { class: 'block border-t border-border mt-3.5' },
})
export class ListeFavoris {
  readonly favoris = input.required<readonly Annonce[]>();
  readonly retirer = output<string>();
  protected readonly textes = TEXTES_ESPACE;
  protected readonly selection = inject(SelectionService);
  protected readonly cheminAnnonce = CHEMIN_ANNONCE;
  protected readonly photo = premierePhoto;

  protected indisponible(a: Annonce): string | null {
    const statut = a.bien.statut;
    if (statut === 'sous_offre') return this.textes.sousOffre;
    return statut && statut !== 'disponible' ? this.textes.plusDisponible : null;
  }
}
