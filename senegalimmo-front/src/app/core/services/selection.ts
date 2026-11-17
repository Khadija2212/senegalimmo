import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ENVIRONNEMENT } from '../config/environnement';
import { Annonce } from '../modeles/annonce';
import { SessionService } from '../session/session';

const COMPARAISON_MAX = 4;

/** Annonces gardées (favoris du client) et annonces choisies pour la comparaison. */
@Injectable({ providedIn: 'root' })
export class SelectionService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly url = `${ENVIRONNEMENT.apiUrl}/favoris`;
  private readonly gardees = signal<ReadonlySet<string>>(new Set());
  private readonly aComparer = signal<readonly string[]>([]);
  private favorisCharges = false;

  readonly comparees = this.aComparer.asReadonly();
  readonly nombreComparees = computed(() => this.aComparer().length);

  chargerFavoris(): void {
    if (this.favorisCharges || !this.session.estClient()) return;
    this.favorisCharges = true;
    this.http
      .get<Annonce[]>(this.url)
      .subscribe((liste) => this.gardees.set(new Set(liste.map((a) => a.id))));
  }

  estGardee(id: string): boolean {
    return this.gardees().has(id);
  }

  basculerFavori(id: string): Observable<unknown> {
    const garder = !this.estGardee(id);
    const requete = garder
      ? this.http.post(`${this.url}/${id}`, {})
      : this.http.delete(`${this.url}/${id}`);
    return requete.pipe(tap(() => this.gardees.update((s) => basculer(s, id, garder))));
  }

  estComparee(id: string): boolean {
    return this.aComparer().includes(id);
  }

  basculerComparaison(id: string): void {
    this.aComparer.update((liste) =>
      liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id].slice(-COMPARAISON_MAX),
    );
  }
}

function basculer(s: ReadonlySet<string>, id: string, ajouter: boolean): ReadonlySet<string> {
  const copie = new Set(s);
  if (ajouter) copie.add(id);
  else copie.delete(id);
  return copie;
}
