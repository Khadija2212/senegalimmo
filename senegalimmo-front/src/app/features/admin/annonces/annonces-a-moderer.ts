import {
  ChangeDetectionStrategy,
  Component,
  inject,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import { AnnonceModeration, DecisionModeration, StatutAnnonce } from '../../../core/modeles/admin';
import { AdminService } from '../../../core/services/admin';
import { ChoixBascules } from '../commun/choix-bascules';
import { ErreurChargement } from '../commun/erreur-chargement';
import { Pagination } from '../commun/pagination';
import { SqueletteRegistre } from '../commun/squelette-registre';
import { SuiviActions } from '../commun/suivi-actions';
import { TEXTES_ADMIN } from '../textes';
import { LigneAnnonce } from './ligne-annonce';
import { TEXTES_ANNONCES } from './textes';
import { lire } from '../../../core/ressources/lire';

const PREMIERE_PAGE = 1;

/** Rubrique « Annonces à modérer » : approuver, rejeter, suspendre, attribuer le badge vérifié. */
@Component({
  selector: 'si-annonces-a-moderer',
  imports: [NgIcon, ChoixBascules, ErreurChargement, Pagination, SqueletteRegistre, LigneAnnonce],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../../../shared/espace/rubriques.css', '../../../shared/espace/lien-texte.css'],
  template: `
    <section aria-labelledby="t-annonces">
      <h2
        id="t-annonces"
        class="font-display flex items-baseline gap-3 text-[1.55rem] leading-tight font-semibold"
      >
        {{ textes.titre }}
        @if (lire(liste); as l) {
          <small class="text-encre-3 font-sans text-[0.85rem] font-medium">{{ l.total }}</small>
        }
      </h2>
      <p class="text-encre-2 mt-1.5 text-[0.92rem]">{{ textes.intro }}</p>
      <si-choix-bascules
        class="mt-4"
        [choix]="textes.filtres"
        [valeur]="statut()"
        [libelle]="textes.filtre"
        (choisir)="statut.set($any($event))"
      />

      @if (liste.isLoading() && !liste.hasValue()) {
        <si-squelette-registre />
      } @else if (liste.error()) {
        <si-erreur-chargement (reessayer)="liste.reload()" />
      } @else if (lire(liste); as l) {
        @if (l.data.length) {
          <div class="border-border mt-3.5 border-t">
            @for (a of l.data; track a.id; let premier = $first) {
              <si-ligne-annonce
                [annonce]="a"
                [principale]="premier"
                [enCours]="actions.enCours() === a.id"
                [erreur]="actions.erreur(a.id)"
                (decider)="moderer(a, $event)"
                (badge)="attribuerBadge(a)"
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
            <ng-icon name="siSceau" size="32" class="text-bleu" />
            <div>
              <h3 class="font-display text-[1.4rem] leading-tight font-semibold">
                {{ textes.videTitre }}
              </h3>
              <p class="text-encre-2 mt-1.5 max-w-[52ch]">{{ textes.videTexte }}</p>
              @if (statut() !== 'publiee') {
                <button type="button" class="lien-texte mt-4" (click)="statut.set('publiee')">
                  {{ textes.voirPubliees }}
                </button>
              }
            </div>
          </div>
        }
      }
    </section>
  `,
  host: { class: 'block' },
})
export class AnnoncesAModerer {
  protected readonly lire = lire;
  readonly modifie = output<void>();
  protected readonly textes = TEXTES_ANNONCES;
  private readonly service = inject(AdminService);
  protected readonly actions = new SuiviActions(TEXTES_ADMIN.erreurAction);

  protected readonly statut = signal<StatutAnnonce>('en_moderation');
  protected readonly page = linkedSignal({ source: this.statut, computation: () => PREMIERE_PAGE });
  protected readonly liste = rxResource({
    params: () => ({ statut: this.statut(), page: this.page() }),
    stream: ({ params }) => this.service.annonces(params.statut, params.page),
  });

  protected moderer(a: AnnonceModeration, decision: DecisionModeration): void {
    this.actions.lancer(a.id, this.service.moderer(a.id, decision), () => this.recharger());
  }

  protected attribuerBadge(a: AnnonceModeration): void {
    this.actions.lancer(a.id, this.service.attribuerBadge(a.id), () => this.recharger());
  }

  private recharger(): void {
    this.liste.reload();
    this.modifie.emit();
  }
}
