import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { CompteAdmin } from '../../../core/modeles/admin';
import { AdminService } from '../../../core/services/admin';
import { Role } from '../../../core/session/session';
import { ChoixBascules } from '../commun/choix-bascules';
import { ErreurChargement } from '../commun/erreur-chargement';
import { Pagination } from '../commun/pagination';
import { SqueletteRegistre } from '../commun/squelette-registre';
import { SuiviActions } from '../commun/suivi-actions';
import { TEXTES_ADMIN } from '../textes';
import { LigneCompte } from './ligne-compte';
import { TEXTES_COMPTES } from './textes';

const PREMIERE_PAGE = 1;
const DELAI_RECHERCHE_MS = 300;

/** Rubrique « Comptes » : chercher, suspendre, réactiver, valider les agents, vérifier les identités. */
@Component({
  selector: 'si-comptes',
  imports: [
    NgIcon,
    HlmInput,
    HlmLabel,
    ChoixBascules,
    ErreurChargement,
    Pagination,
    SqueletteRegistre,
    LigneCompte,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../../../shared/espace/rubriques.css', '../../../shared/espace/lien-texte.css'],
  template: `
    <section aria-labelledby="t-comptes">
      <h2
        id="t-comptes"
        class="font-display flex items-baseline gap-3 text-[1.55rem] leading-tight font-semibold"
      >
        {{ textes.titre }}
        @if (liste.value(); as l) {
          <small class="text-encre-3 font-sans text-[0.85rem] font-medium">{{ l.total }}</small>
        }
      </h2>
      <p class="text-encre-2 mt-1.5 text-[0.92rem]">{{ textes.intro }}</p>

      <div class="mt-4 flex flex-wrap items-end gap-4">
        <div class="w-full sm:w-72">
          <label
            hlmLabel
            for="f-recherche-compte"
            class="text-encre-2 mb-2 block text-[0.8rem] font-semibold"
            >{{ textes.recherche }}</label
          >
          <input
            hlmInput
            id="f-recherche-compte"
            type="search"
            class="h-10 w-full bg-white"
            [placeholder]="textes.placeholderRecherche"
            [value]="saisie()"
            (input)="saisie.set($any($event.target).value)"
          />
        </div>
        <si-choix-bascules
          [choix]="textes.filtres"
          [valeur]="role()"
          [libelle]="textes.filtre"
          (choisir)="role.set($any($event))"
        />
      </div>

      @if (liste.isLoading() && !liste.value()) {
        <si-squelette-registre />
      } @else if (liste.error()) {
        <si-erreur-chargement (reessayer)="liste.reload()" />
      } @else if (liste.value(); as l) {
        @if (l.data.length) {
          <div class="border-border mt-3.5 border-t">
            @for (c of l.data; track c.id) {
              <si-ligne-compte
                [compte]="c"
                [enCours]="actions.enCours() === c.id"
                [erreur]="actions.erreur(c.id)"
                [pieceVue]="piecesVues().has(c.id)"
                (valider)="validerAgent(c, $event)"
                (suspendre)="suspendre(c)"
                (reactiver)="reactiver(c)"
                (voirPiece)="voirPiece(c)"
                (verifier)="verifierIdentite(c)"
              />
            }
          </div>
          <si-pagination
            [page]="l.current_page"
            [derniere]="l.last_page"
            (changer)="page.set($event)"
          />
        } @else {
          <div class="vide">
            <ng-icon name="siCompte" size="32" class="text-bleu" />
            <div>
              <h3 class="font-display text-[1.4rem] leading-tight font-semibold">
                {{ textes.videTitre }}
              </h3>
              <p class="text-encre-2 mt-1.5 max-w-[52ch]">{{ textes.videTexte }}</p>
              <button type="button" class="lien-texte mt-4" (click)="effacer()">
                {{ textes.effacer }}
              </button>
            </div>
          </div>
        }
      }
    </section>
  `,
  host: { class: 'block' },
})
export class Comptes {
  readonly modifie = output<void>();
  protected readonly textes = TEXTES_COMPTES;
  private readonly service = inject(AdminService);
  protected readonly actions = new SuiviActions(TEXTES_ADMIN.erreurAction);

  protected readonly role = signal<Role | ''>('');
  protected readonly saisie = signal('');
  private readonly recherche = toSignal(
    toObservable(this.saisie).pipe(
      debounceTime(DELAI_RECHERCHE_MS),
      map((q) => q.trim()),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );
  private readonly filtres = computed(() => ({ role: this.role(), q: this.recherche() }));
  protected readonly page = linkedSignal({
    source: this.filtres,
    computation: () => PREMIERE_PAGE,
  });
  protected readonly liste = rxResource({
    params: () => ({ ...this.filtres(), page: this.page() }),
    stream: ({ params }) =>
      this.service.comptes({ role: params.role || undefined, q: params.q, page: params.page }),
  });
  protected readonly piecesVues = signal<ReadonlySet<string>>(new Set());

  protected effacer(): void {
    this.saisie.set('');
    this.role.set('');
  }

  protected validerAgent(c: CompteAdmin, accepte: boolean): void {
    this.lancer(c, this.service.validerAgent(c.id, accepte));
  }

  protected suspendre(c: CompteAdmin): void {
    this.lancer(c, this.service.suspendre(c.id));
  }

  protected reactiver(c: CompteAdmin): void {
    this.lancer(c, this.service.reactiver(c.id));
  }

  protected verifierIdentite(c: CompteAdmin): void {
    this.lancer(c, this.service.verifierIdentite(c.id));
  }

  /** L'onglet s'ouvre pendant le clic, sinon le navigateur le bloque ; le lien signé arrive ensuite. */
  protected voirPiece(c: CompteAdmin): void {
    const onglet = window.open('', '_blank');
    this.actions.lancer(
      c.id,
      this.service.pieceIdentite(c.id),
      ({ url }) => {
        if (onglet) {
          onglet.opener = null;
          onglet.location.href = url;
        } else {
          window.open(url, '_blank', 'noopener');
        }
        this.piecesVues.update((vues) => new Set(vues).add(c.id));
      },
      () => onglet?.close(),
    );
  }

  private lancer(c: CompteAdmin, requete: ReturnType<AdminService['suspendre']>): void {
    this.actions.lancer(c.id, requete, () => {
      this.liste.reload();
      this.modifie.emit();
    });
  }
}
