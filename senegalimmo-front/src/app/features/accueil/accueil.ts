import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { TypeTransaction } from '../../core/modeles/annonce';
import { SelectionService } from '../../core/services/selection';
import { BarreComparer } from './barre-comparer/barre-comparer';
import { BlocPublier } from './bloc-publier/bloc-publier';
import { Parcours } from './parcours/parcours';
import { RechercheAccueil, criteresInitiaux } from './recherche-accueil';
import { RecherchePhrase } from './recherche-phrase/recherche-phrase';
import { Resultats } from './resultats/resultats';
import { TEXTES_ACCUEIL } from './textes';

/** Accueil : cas « Rechercher un bien » du visiteur, avec ses extensions. */
@Component({
  selector: 'si-accueil',
  imports: [RecherchePhrase, Resultats, Parcours, BlocPublier, BarreComparer],
  providers: [RechercheAccueil],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-[1240px] px-4 sm:px-7 lg:px-10">
      <section class="pt-8 pb-2 sm:pt-16 sm:pb-10">
        <div class="grid items-center gap-8 lg:grid-cols-[7fr_4fr] lg:gap-12">
          <div>
            <h1
              class="font-display max-w-[17ch] text-[clamp(2.5rem,5.4vw,4.6rem)] leading-[1.1] font-semibold tracking-[-0.005em] text-balance"
            >
              {{ textes.titreDebut }}<em class="text-bleu not-italic">{{ textes.titreAccent }}</em
              >{{ textes.titreFin }}
            </h1>
            <p class="text-encre-2 mt-5 max-w-[54ch] text-[1.08rem]">{{ textes.chapeau }}</p>
          </div>
          <img
            src="/images/accueil.jpg"
            [alt]="textes.photoOuverture"
            width="1350"
            height="1800"
            class="aspect-[3/4] w-full rounded-cadre object-cover max-lg:aspect-video"
            fetchpriority="high"
          />
        </div>
        <si-recherche-phrase (voir)="allerAuxResultats()" />
      </section>
      <si-resultats />
      <si-parcours />
      <si-bloc-publier />
    </main>
    <si-barre-comparer />
  `,
})
export class Accueil {
  protected readonly textes = TEXTES_ACCUEIL;
  private readonly recherche = inject(RechercheAccueil);

  constructor() {
    inject(SelectionService).chargerFavoris();
    inject(ActivatedRoute)
      .queryParamMap.pipe(
        map((p) => (p.get('transaction') === 'vente' ? 'vente' : 'location') as TypeTransaction),
        takeUntilDestroyed(),
      )
      .subscribe((t) => {
        if (t !== this.recherche.criteres().type_transaction)
          this.recherche.criteres.set(criteresInitiaux(t));
      });
  }

  protected allerAuxResultats(): void {
    document.getElementById('resultats')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
