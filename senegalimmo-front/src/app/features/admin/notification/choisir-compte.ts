import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { debounceTime, distinctUntilChanged, map, of } from 'rxjs';
import { CompteAdmin } from '../../../core/modeles/admin';
import { AdminService } from '../../../core/services/admin';
import { TEXTES_NOTIFICATION } from './textes';
import { lire } from '../../../core/ressources/lire';

const DELAI_RECHERCHE_MS = 300;
const RESULTATS_MAX = 6;
const LONGUEUR_MIN = 2;
const PREMIERE_PAGE = 1;

/** Recherche d'un compte destinataire par nom ou e-mail. */
@Component({
  selector: 'si-choisir-compte',
  imports: [HlmInput, HlmLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/espace/lien-texte.css',
  template: `
    <label
      hlmLabel
      for="f-compte-dest"
      class="text-encre-2 mb-2 block text-[0.8rem] font-semibold"
      >{{ textes.chercherCompte }}</label
    >
    <input
      hlmInput
      id="f-compte-dest"
      type="search"
      class="h-11 w-full bg-white sm:max-w-md"
      [placeholder]="textes.placeholderCompte"
      [value]="saisie()"
      (input)="saisie.set($any($event.target).value)"
    />
    @if (lire(resultats); as r) {
      @if (r.length) {
        <ul class="mt-2 flex flex-col gap-2" [attr.aria-label]="textes.resultats">
          @for (c of r; track c.id) {
            <li>
              <button
                type="button"
                class="lien-texte text-left break-all"
                (click)="choisir.emit(c)"
              >
                {{ textes.choisir(c.prenom + ' ' + c.nom, c.email) }}
              </button>
            </li>
          }
        </ul>
      } @else if (recherche().length >= longueurMin) {
        <p class="text-encre-3 mt-2 text-[0.85rem]">{{ textes.aucunCompte }}</p>
      }
    }
  `,
  host: { class: 'block' },
})
export class ChoisirCompte {
  protected readonly lire = lire;
  readonly choisir = output<CompteAdmin>();
  protected readonly textes = TEXTES_NOTIFICATION;
  protected readonly longueurMin = LONGUEUR_MIN;
  private readonly service = inject(AdminService);

  protected readonly saisie = signal('');
  protected readonly recherche = toSignal(
    toObservable(this.saisie).pipe(
      debounceTime(DELAI_RECHERCHE_MS),
      map((q) => q.trim()),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );
  protected readonly resultats = rxResource({
    params: () => ({ q: this.recherche() }),
    stream: ({ params }) =>
      params.q.length < LONGUEUR_MIN
        ? of<CompteAdmin[]>([])
        : this.service
            .comptes({ q: params.q, page: PREMIERE_PAGE })
            .pipe(map((p) => p.data.slice(0, RESULTATS_MAX))),
  });
}
