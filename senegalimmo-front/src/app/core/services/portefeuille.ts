import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ENVIRONNEMENT } from '../config/environnement';
import { DemandeRetrait, EtatPortefeuille, Retrait } from '../modeles/portefeuille';

/** Cas « Consulter portefeuille » et « Demander un retrait » (propriétaire, agent). */
@Injectable({ providedIn: 'root' })
export class PortefeuilleService {
  private readonly http = inject(HttpClient);
  private readonly api = ENVIRONNEMENT.apiUrl;

  charger(): Observable<EtatPortefeuille> {
    return this.http.get<EtatPortefeuille>(`${this.api}/portefeuille`);
  }

  demanderRetrait(d: DemandeRetrait): Observable<Retrait> {
    return this.http.post<Retrait>(`${this.api}/retraits`, d);
  }
}
