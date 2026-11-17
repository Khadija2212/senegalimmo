import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, forkJoin, map, of, switchMap, tap } from 'rxjs';
import {
  Annonce,
  CriteresRecherche,
  PointCarte,
  ResumeRecherche,
  TypeTransaction,
} from '../../core/modeles/annonce';
import { AnnoncesService } from '../../core/services/annonces';
import { BUDGET_DEFAUT, LIEU_DEFAUT, SEUIL_BUDGET_VENTE } from './donnees';

const DELAI_SAISIE_MS = 300;

type Etat = 'chargement' | 'pret' | 'erreur';

/** État de la recherche de l'accueil (cas « Rechercher un bien » et « Filtrer par critères »). */
@Injectable()
export class RechercheAccueil {
  private readonly service = inject(AnnoncesService);

  readonly criteres = signal<CriteresRecherche>(criteresInitiaux('location'));
  readonly annonces = signal<Annonce[]>([]);
  readonly points = signal<PointCarte[]>([]);
  readonly total = signal(0);
  readonly resume = signal<ResumeRecherche>({ verifiees: 0, prix_min: null });
  readonly etat = signal<Etat>('chargement');
  private readonly page = signal(1);
  private readonly dernierePage = signal(1);
  readonly encorePlus = computed(() => this.page() < this.dernierePage());

  constructor() {
    toObservable(this.criteres)
      .pipe(
        tap(() => this.etat.set('chargement')),
        debounceTime(DELAI_SAISIE_MS),
        switchMap((c) => this.charger(c)),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe();
  }

  modifier(partiel: Partial<CriteresRecherche>): void {
    this.criteres.update((c) => sansVides({ ...c, ...partiel }));
  }

  changerTransaction(transaction: TypeTransaction): void {
    const budget = this.criteres().prix_max ?? 0;
    const horsEchelle =
      transaction === 'vente' ? budget < SEUIL_BUDGET_VENTE : budget >= SEUIL_BUDGET_VENTE;
    this.modifier({
      type_transaction: transaction,
      prix_max: horsEchelle ? BUDGET_DEFAUT[transaction] : budget,
    });
  }

  reessayer(): void {
    this.criteres.update((c) => ({ ...c }));
  }

  afficherPlus(): void {
    const suivante = this.page() + 1;
    this.service.rechercher(this.criteres(), suivante).subscribe((r) => {
      this.annonces.update((liste) => [...liste, ...r.data]);
      this.page.set(r.current_page);
      this.dernierePage.set(r.last_page);
    });
  }

  private charger(c: CriteresRecherche) {
    return forkJoin({ page: this.service.rechercher(c), points: this.service.carte(c) }).pipe(
      map(({ page, points }) => {
        this.annonces.set(page.data);
        this.total.set(page.total);
        this.resume.set(page.resume);
        this.page.set(page.current_page);
        this.dernierePage.set(page.last_page);
        this.points.set(points);
        this.etat.set('pret');
      }),
      catchError(() => of(this.etat.set('erreur'))),
    );
  }
}

export function criteresInitiaux(transaction: TypeTransaction): CriteresRecherche {
  return {
    type_transaction: transaction,
    type: 'appartement',
    ville: LIEU_DEFAUT,
    prix_max: BUDGET_DEFAUT[transaction],
    tri: 'recent',
  };
}

function sansVides(c: CriteresRecherche): CriteresRecherche {
  return Object.fromEntries(
    Object.entries(c).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false),
  ) as unknown as CriteresRecherche;
}
