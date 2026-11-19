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
import { SignalementAdmin, StatutSignalement } from '../../../core/modeles/admin';
import { AdminService } from '../../../core/services/admin';
import { ChoixBascules } from '../commun/choix-bascules';
import { ErreurChargement } from '../commun/erreur-chargement';
import { Pagination } from '../commun/pagination';
import { SqueletteRegistre } from '../commun/squelette-registre';
import { SuiviActions } from '../commun/suivi-actions';
import { TEXTES_ADMIN } from '../textes';
import { LigneSignalement } from './ligne-signalement';
import { TEXTES_SIGNALEMENTS } from './textes';

const PREMIERE_PAGE = 1;

/** Rubrique « Signalements » : lire, puis traiter avec une résolution écrite. */
@Component({
  selector: 'si-signalements',
  imports: [
    NgIcon,
    ChoixBascules,
    ErreurChargement,
    Pagination,
    SqueletteRegistre,
    LigneSignalement,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../../../shared/espace/rubriques.css', '../../../shared/espace/lien-texte.css'],
  template: `
    <section aria-labelledby="t-signalements">
      <h2
        id="t-signalements"
        class="font-display flex items-baseline gap-3 text-[1.55rem] leading-tight font-semibold"
      >
        {{ textes.titre }}
        @if (liste.value(); as l) {
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

      @if (liste.isLoading() && !liste.value()) {
        <si-squelette-registre />
      } @else if (liste.error()) {
        <si-erreur-chargement (reessayer)="liste.reload()" />
      } @else if (liste.value(); as l) {
        @if (l.data.length) {
          <div class="border-border mt-3.5 border-t">
            @for (s of l.data; track s.id) {
              <si-ligne-signalement
                [signalement]="s"
                [enCours]="actions.enCours() === s.id"
                [erreur]="actions.erreur(s.id)"
                (traiter)="traiter(s, $event)"
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
            <ng-icon name="siSignaler" size="32" class="text-bleu" />
            <div>
              <h3 class="font-display text-[1.4rem] leading-tight font-semibold">
                {{ textes.videTitre }}
              </h3>
              <p class="text-encre-2 mt-1.5 max-w-[52ch]">{{ textes.videTexte }}</p>
              @if (statut() !== 'resolu') {
                <button type="button" class="lien-texte mt-4" (click)="statut.set('resolu')">
                  {{ textes.voirResolus }}
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
export class Signalements {
  readonly modifie = output<void>();
  protected readonly textes = TEXTES_SIGNALEMENTS;
  private readonly service = inject(AdminService);
  protected readonly actions = new SuiviActions(TEXTES_ADMIN.erreurAction);

  protected readonly statut = signal<StatutSignalement>('ouvert');
  protected readonly page = linkedSignal({ source: this.statut, computation: () => PREMIERE_PAGE });
  protected readonly liste = rxResource({
    params: () => ({ statut: this.statut(), page: this.page() }),
    stream: ({ params }) => this.service.signalements(params.statut, params.page),
  });

  protected traiter(s: SignalementAdmin, resolution: string): void {
    this.actions.lancer(s.id, this.service.traiterSignalement(s.id, resolution), () => {
      this.liste.reload();
      this.modifie.emit();
    });
  }
}
