import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { fcfa } from '../../../core/format/fcfa';
import { FcfaPipe } from '../../../core/format/fcfa.pipe';
import { StatutPaiement } from '../../../core/modeles/admin';
import { AdminService } from '../../../core/services/admin';
import { ChoixBascules } from '../commun/choix-bascules';
import { dateCourte } from '../commun/dates';
import { ErreurChargement } from '../commun/erreur-chargement';
import { Pagination } from '../commun/pagination';
import { SqueletteRegistre } from '../commun/squelette-registre';
import { TEXTES_TRANSACTIONS } from './textes';
import { lire } from '../../../core/ressources/lire';

const PREMIERE_PAGE = 1;
const COULEURS: Readonly<Record<StatutPaiement, string>> = {
  reussi: 'text-succes',
  en_attente: 'text-bleu-vif',
  echoue: 'text-refus',
  rembourse: 'text-encre-3',
};

/** Rubrique « Transactions » : registre des paiements, total encaissé et commissions sur la période. */
@Component({
  selector: 'si-transactions',
  imports: [
    NgIcon,
    HlmInput,
    HlmLabel,
    FcfaPipe,
    ChoixBascules,
    ErreurChargement,
    Pagination,
    SqueletteRegistre,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../../../shared/espace/rubriques.css', '../../../shared/espace/lien-texte.css'],
  template: `
    <section aria-labelledby="t-transactions">
      <h2 id="t-transactions" class="font-display text-[1.55rem] leading-tight font-semibold">
        {{ textes.titre }}
      </h2>
      <p class="text-encre-2 mt-1.5 text-[0.92rem]">{{ textes.intro }}</p>

      <div class="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label hlmLabel for="f-du" class="text-encre-2 mb-2 block text-[0.8rem] font-semibold">{{
            textes.du
          }}</label>
          <input
            hlmInput
            id="f-du"
            type="date"
            class="h-10 bg-white"
            [value]="du()"
            [max]="au() || null"
            (change)="du.set($any($event.target).value)"
          />
        </div>
        <div>
          <label hlmLabel for="f-au" class="text-encre-2 mb-2 block text-[0.8rem] font-semibold">{{
            textes.au
          }}</label>
          <input
            hlmInput
            id="f-au"
            type="date"
            class="h-10 bg-white"
            [value]="au()"
            [min]="du() || null"
            (change)="au.set($any($event.target).value)"
          />
        </div>
        @if (du() || au()) {
          <button type="button" class="lien-texte mb-2.5" (click)="du.set(''); au.set('')">
            {{ textes.effacerDates }}
          </button>
        }
      </div>
      <si-choix-bascules
        class="mt-4"
        [choix]="textes.filtres"
        [valeur]="statut()"
        [libelle]="textes.filtre"
        (choisir)="statut.set($any($event))"
      />

      @if (donnees.isLoading() && !donnees.hasValue()) {
        <si-squelette-registre />
      } @else if (donnees.error()) {
        <si-erreur-chargement (reessayer)="donnees.reload()" />
      } @else if (lire(donnees); as d) {
        <dl
          class="border-border mt-5 flex w-full rounded-cadre border sm:w-auto sm:max-w-md"
          [attr.aria-label]="textes.sommes"
        >
          <div
            class="border-border flex min-w-0 flex-1 flex-col-reverse border-r px-3 py-2.5 sm:px-[18px] sm:py-3"
          >
            <dt class="text-encre-3 text-[0.8rem]">{{ textes.totalEncaisse }}</dt>
            <dd class="text-[1.25rem] leading-none font-bold tabular-nums">{{ d.total | fcfa }}</dd>
          </div>
          <div class="flex min-w-0 flex-1 flex-col-reverse px-3 py-2.5 sm:px-[18px] sm:py-3">
            <dt class="text-encre-3 text-[0.8rem]">{{ textes.commissions }}</dt>
            <dd class="text-[1.25rem] leading-none font-bold tabular-nums">
              {{ d.commissions | fcfa }}
            </dd>
          </div>
        </dl>
        <p class="text-encre-3 mt-1.5 text-[0.8rem]">{{ textes.noteSommes }}</p>

        @if (d.paiements.data.length) {
          <ul class="border-border mt-3.5 border-t">
            @for (p of d.paiements.data; track p.id) {
              <li
                class="border-border grid grid-cols-1 gap-1 border-b py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-[18px]"
              >
                <div class="min-w-0">
                  <h3 class="text-[1rem] font-semibold">{{ p.libelle || textes.types[p.type] }}</h3>
                  <p class="text-encre-2 mt-0.5 text-[0.88rem] break-words">
                    {{ textes.detail(p.reference, textes.methodes[p.methode], date(p.created_at)) }}
                  </p>
                  <p class="mt-1.5 text-[0.88rem]">
                    <b class="font-semibold" [class]="couleurs[p.statut]">{{
                      textes.statuts[p.statut]
                    }}</b>
                  </p>
                </div>
                <div class="tabular-nums sm:text-right">
                  <b class="font-semibold">{{ p.montant | fcfa }}</b>
                  @if (p.commission) {
                    <p class="text-encre-2 text-[0.82rem]">
                      {{ textes.commission(fcfa(p.commission)) }}
                    </p>
                  }
                </div>
              </li>
            }
          </ul>
          <si-pagination
            [page]="d.paiements.current_page"
            [derniere]="d.paiements.last_page"
            (changer)="page.set($event)"
          />
        } @else {
          <div class="vide">
            <ng-icon name="siListe" size="32" class="text-bleu" />
            <div>
              <h3 class="font-display text-[1.4rem] leading-tight font-semibold">
                {{ textes.videTitre }}
              </h3>
              <p class="text-encre-2 mt-1.5 max-w-[52ch]">{{ textes.videTexte }}</p>
            </div>
          </div>
        }
      }
    </section>
  `,
  host: { class: 'block' },
})
export class Transactions {
  protected readonly lire = lire;
  protected readonly textes = TEXTES_TRANSACTIONS;
  protected readonly couleurs = COULEURS;
  protected readonly date = dateCourte;
  private readonly service = inject(AdminService);
  protected readonly fcfa = fcfa;

  protected readonly statut = signal<StatutPaiement | ''>('');
  protected readonly du = signal('');
  protected readonly au = signal('');
  private readonly filtres = computed(() => ({
    statut: this.statut() || undefined,
    du: this.du() || undefined,
    au: this.au() || undefined,
  }));
  protected readonly page = linkedSignal({
    source: this.filtres,
    computation: () => PREMIERE_PAGE,
  });
  protected readonly donnees = rxResource({
    params: () => ({ ...this.filtres(), page: this.page() }),
    stream: ({ params }) => this.service.transactions(params),
  });
}
