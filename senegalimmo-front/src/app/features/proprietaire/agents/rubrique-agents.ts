import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import { forkJoin, map, switchMap } from 'rxjs';
import { ProprietaireService } from '../../../core/services/proprietaire';
import { ChargementRubrique } from '../chargement';
import { TEXTES_PROPRIETAIRE } from '../textes';
import { COULEURS_TON, dateJour, nomComplet } from '../vue-commune';
import { ConfierBien } from './confier-bien';
import { biensLibres, lignesMandats } from './mandats-vue';

/** Rubrique « Agents et mandats » : mandats en cours et annuaire des agents validés. */
@Component({
  selector: 'si-rubrique-agents',
  imports: [NgIcon, ChargementRubrique, ConfierBien],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../../../shared/espace/rubriques.css', '../../../shared/espace/lien-texte.css'],
  host: { class: 'block' },
  templateUrl: './rubrique-agents.html',
})
export class RubriqueAgents {
  protected readonly textes = TEXTES_PROPRIETAIRE;
  protected readonly couleurs = COULEURS_TON;
  protected readonly nom = nomComplet;
  protected readonly dateJour = (iso: string): string => dateJour(new Date(iso));
  private readonly service = inject(ProprietaireService);

  /** La liste des biens ne porte pas les mandats : on lit la fiche de chacun. */
  protected readonly donnees = rxResource({
    stream: () =>
      forkJoin({
        agents: this.service.agents(),
        biens: this.service
          .patrimoine()
          .pipe(switchMap((p) => this.service.biensAvecMandats(p.biens.map((b) => b.id)))),
      }).pipe(
        map((d) => ({
          agents: d.agents,
          mandats: lignesMandats(d.biens),
          libres: biensLibres(d.biens),
        })),
      ),
  });
  protected readonly vue = computed(() => (this.donnees.hasValue() ? this.donnees.value() : null));
  /** Agent dont le formulaire « Confier un bien » est ouvert. */
  protected readonly ouvert = signal<string | null>(null);
  protected readonly reussite = signal<string | null>(null);

  protected basculer(id: string): void {
    this.reussite.set(null);
    this.ouvert.update((actuel) => (actuel === id ? null : id));
  }

  protected confie(message: string): void {
    this.ouvert.set(null);
    this.reussite.set(message);
    this.donnees.reload();
  }
}
