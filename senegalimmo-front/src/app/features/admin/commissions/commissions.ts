import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HlmButton } from '@spartan-ng/helm/button';
import { fcfa } from '../../../core/format/fcfa';
import { NouvelleRegle, RegleCommission } from '../../../core/modeles/admin';
import { AdminService } from '../../../core/services/admin';
import { aujourdhuiIso, dateCourte } from '../commun/dates';
import { ErreurChargement } from '../commun/erreur-chargement';
import { SqueletteRegistre } from '../commun/squelette-registre';
import { SuiviActions } from '../commun/suivi-actions';
import { TEXTES_ADMIN } from '../textes';
import { classerRegles, tauxLisible } from './commissions-vue';
import { FormulaireRegle } from './formulaire-regle';
import { TEXTES_COMMISSIONS } from './textes';

const CLE_AJOUT = 'ajout';

/** Rubrique « Commissions » : règle en vigueur par type de transaction, ajout d'une règle. */
@Component({
  selector: 'si-commissions',
  imports: [HlmButton, ErreurChargement, SqueletteRegistre, FormulaireRegle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/espace/lien-texte.css',
  template: `
    <section aria-labelledby="t-commissions">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="t-commissions" class="font-display text-[1.55rem] leading-tight font-semibold">
          {{ textes.titre }}
        </h2>
        @if (!formulaire()) {
          <button hlmBtn size="grand" class="h-11" (click)="formulaire.set(true)">
            {{ textes.ajouter }}
          </button>
        }
      </div>
      <p class="text-encre-2 mt-1.5 max-w-[70ch] text-[0.92rem]">{{ textes.intro }}</p>
      @if (formulaire()) {
        <si-formulaire-regle
          class="mt-4"
          [enCours]="actions.enCours() === cleAjout"
          [erreur]="actions.erreur(cleAjout)"
          (ajouter)="ajouter($event)"
          (fermer)="formulaire.set(false)"
        />
      }

      @if (liste.isLoading() && !liste.value()) {
        <si-squelette-registre />
      } @else if (liste.error()) {
        <si-erreur-chargement (reessayer)="liste.reload()" />
      } @else {
        @for (g of groupes(); track g.type) {
          <div class="border-border mt-6 border-t pt-4">
            <h3 class="text-encre-3 text-[0.78rem] font-semibold tracking-[0.06em] uppercase">
              {{ textes.types[g.type] }}
            </h3>
            @if (g.active; as r) {
              <p class="mt-1.5 text-[1.02rem]">
                <b class="text-[1.3rem] font-bold tabular-nums">{{ taux(r) }}</b
                ><span class="text-encre-2">{{ minimum(r) }}</span>
              </p>
              <p class="mt-1 text-[0.88rem]">
                <b class="text-succes font-semibold">{{ textes.active }}</b>
                <span class="text-encre-2 ml-1.5"
                  >{{ textes.depuis(date(r.actif_depuis)) }}{{ par(r) }}</span
                >
              </p>
            } @else {
              <p class="text-refus mt-1.5 font-semibold">{{ textes.aucuneActive }}</p>
              <p class="text-encre-2 mt-1 text-[0.88rem]">{{ textes.aucuneActiveTexte }}</p>
            }
            @for (r of g.aVenir; track r.id) {
              <p class="mt-2 text-[0.88rem]">
                <b class="text-bleu-vif font-semibold">{{ textes.aVenir }}</b>
                <span class="text-encre-2 ml-1.5 tabular-nums"
                  >{{ taux(r) }}{{ minimum(r) }}, {{ textes.aPartirDu(date(r.actif_depuis)) }}</span
                >
              </p>
            }
            @if (g.remplacees.length) {
              <details class="group mt-2">
                <summary class="text-encre-2 cursor-pointer text-[0.85rem] font-semibold">
                  {{ textes.historique }} ({{ g.remplacees.length }})
                </summary>
                <ul class="text-encre-3 mt-1.5 text-[0.85rem] tabular-nums">
                  @for (r of g.remplacees; track r.id) {
                    <li>
                      {{ taux(r) }}{{ minimum(r) }}, {{ textes.depuis(date(r.actif_depuis)) }}
                    </li>
                  }
                </ul>
              </details>
            }
          </div>
        }
      }
    </section>
  `,
  host: { class: 'block' },
})
export class Commissions {
  protected readonly textes = TEXTES_COMMISSIONS;
  protected readonly cleAjout = CLE_AJOUT;
  protected readonly date = dateCourte;
  private readonly service = inject(AdminService);
  protected readonly actions = new SuiviActions(TEXTES_ADMIN.erreurAction);

  protected readonly formulaire = signal(false);
  protected readonly liste = rxResource({ stream: () => this.service.reglesCommission() });
  protected readonly groupes = computed(() =>
    classerRegles(this.liste.value() ?? [], aujourdhuiIso()),
  );

  protected taux(r: RegleCommission): string {
    return this.textes.taux(tauxLisible(r.taux));
  }

  protected minimum(r: RegleCommission): string {
    return r.montant_minimum ? this.textes.minimum(fcfa(r.montant_minimum)) : '';
  }

  protected par(r: RegleCommission): string {
    const a = r.administrateur;
    return a ? this.textes.par(`${a.prenom} ${a.nom}`) : '';
  }

  protected ajouter(r: NouvelleRegle): void {
    this.actions.lancer(CLE_AJOUT, this.service.ajouterRegle(r), () => {
      this.formulaire.set(false);
      this.liste.reload();
    });
  }
}
