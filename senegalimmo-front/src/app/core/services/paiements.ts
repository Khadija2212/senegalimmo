import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { ENVIRONNEMENT } from '../config/environnement';
import { Contrat, Echeancier } from '../modeles/contrats';
import { DemandePaiement, Paiement, PaiementOuvert, Quittance } from '../modeles/paiements';
import { ContratsService } from './contrats';

/** Ce qu'il faut pour calculer les sommes dues : contrats signés et échéancier de chaque bail. */
export interface DonneesAPayer {
  contrats: Contrat[];
  echeanciers: Readonly<Record<string, Echeancier>>;
}

/** Paiements versés (client) ou reçus (propriétaire), ouverture chez la passerelle, quittances. */
@Injectable({ providedIn: 'root' })
export class PaiementsService {
  private readonly http = inject(HttpClient);
  private readonly contrats = inject(ContratsService);
  private readonly api = ENVIRONNEMENT.apiUrl;

  lister(): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.api}/paiements`);
  }

  parReference(reference: string): Observable<Paiement> {
    return this.http.get<Paiement>(
      `${this.api}/paiements/reference/${encodeURIComponent(reference)}`,
    );
  }

  initier(d: DemandePaiement): Observable<PaiementOuvert> {
    return this.http.post<PaiementOuvert>(`${this.api}/paiements/initier`, d);
  }

  quittance(id: string): Observable<Quittance> {
    return this.http.get<Quittance>(`${this.api}/paiements/${id}/quittance`);
  }

  /** Contrats signés du client, avec l'échéancier de chacun de ses baux. */
  donneesAPayer(): Observable<DonneesAPayer> {
    return this.contrats.lister().pipe(
      map((tous) => tous.filter((c) => c.statut === 'signe' && c.nature !== 'mandat')),
      switchMap((contrats) => {
        const baux = contrats.filter((c) => c.nature === 'bail');
        if (!baux.length) return of({ contrats, echeanciers: {} });
        return forkJoin(baux.map((b) => this.contrats.echeancier(b.id))).pipe(
          map((liste) => ({
            contrats,
            echeanciers: Object.fromEntries(baux.map((b, i) => [b.id, liste[i]])),
          })),
        );
      }),
    );
  }
}
