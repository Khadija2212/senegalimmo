import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import { RetraitAdmin, StatutRetrait } from '../../../core/modeles/admin';
import { AdminService } from '../../../core/services/admin';
import { ChoixBascules } from '../commun/choix-bascules';
import { ErreurChargement } from '../commun/erreur-chargement';
import { SqueletteRegistre } from '../commun/squelette-registre';
import { SuiviActions } from '../commun/suivi-actions';
import { TEXTES_ADMIN } from '../textes';
import { LigneRetrait } from './ligne-retrait';
import { TEXTES_RETRAITS } from './textes';

/** Rubrique « Retraits » : approuver (le versement suit) ou rejeter avec un motif. */
@Component({
  selector: 'si-retraits',
  imports: [NgIcon, ChoixBascules, ErreurChargement, SqueletteRegistre, LigneRetrait],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../../../shared/espace/rubriques.css', '../../../shared/espace/lien-texte.css'],
  template: `
    <section aria-labelledby="t-retraits">
      <h2
        id="t-retraits"
        class="font-display flex items-baseline gap-3 text-[1.55rem] leading-tight font-semibold"
      >
        {{ textes.titre }}
        @if (liste.value(); as l) {
          <small class="text-encre-3 font-sans text-[0.85rem] font-medium">{{ l.length }}</small>
        }
      </h2>
      <p class="text-encre-2 mt-1.5 max-w-[70ch] text-[0.92rem]">{{ textes.intro }}</p>
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
        @if (l.length) {
          <div class="border-border mt-3.5 border-t">
            @for (r of l; track r.id) {
              <si-ligne-retrait
                [retrait]="r"
                [principale]="r.id === principale()"
                [enCours]="actions.enCours() === r.id"
                [erreur]="actions.erreur(r.id)"
                (approuver)="approuver(r)"
                (rejeter)="rejeter(r, $event)"
              />
            }
          </div>
        } @else {
          <div class="vide">
            <ng-icon name="siMobile" size="32" class="text-bleu" />
            <div>
              <h3 class="font-display text-[1.4rem] leading-tight font-semibold">
                {{ textes.videTitre }}
              </h3>
              <p class="text-encre-2 mt-1.5 max-w-[52ch]">{{ textes.videTexte }}</p>
              @if (statut()) {
                <button type="button" class="lien-texte mt-4" (click)="statut.set('')">
                  {{ textes.voirTous }}
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
export class Retraits {
  readonly modifie = output<void>();
  protected readonly textes = TEXTES_RETRAITS;
  private readonly service = inject(AdminService);
  protected readonly actions = new SuiviActions(TEXTES_ADMIN.erreurAction);

  protected readonly statut = signal<StatutRetrait | ''>('demande');
  protected readonly liste = rxResource({
    params: () => ({ statut: this.statut() || undefined }),
    stream: ({ params }) => this.service.retraits(params.statut),
  });
  protected readonly principale = computed(
    () => this.liste.value()?.find((r) => r.statut === 'demande')?.id ?? null,
  );

  protected approuver(r: RetraitAdmin): void {
    this.lancer(r, 'approuver');
  }

  protected rejeter(r: RetraitAdmin, motif: string): void {
    this.lancer(r, 'rejeter', motif);
  }

  private lancer(r: RetraitAdmin, decision: 'approuver' | 'rejeter', motif?: string): void {
    this.actions.lancer(r.id, this.service.traiterRetrait(r.id, decision, motif), () => {
      this.liste.reload();
      this.modifie.emit();
    });
  }
}
