import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ENVIRONNEMENT } from '../config/environnement';
import {
  AnnoncePubliee,
  BienAssigne,
  CompteAgent,
  CompteRendu,
  DemandeGeree,
  IndicateursAgent,
  Mandat,
  NiveauInteret,
  NouvelleAnnonce,
  OffreGeree,
  PerformancesAgent,
  VisiteGeree,
} from '../modeles/agent';

export interface DonneesAgent {
  indicateurs: IndicateursAgent;
  visites: VisiteGeree[];
  demandes: DemandeGeree[];
  offres: OffreGeree[];
  biens: BienAssigne[];
  mandats: Mandat[];
}

const NATURE_MANDAT = 'mandat';

/** Travail de l'agent : biens sous mandat, visites, demandes des clients, mandats. */
@Injectable({ providedIn: 'root' })
export class AgentService {
  private readonly http = inject(HttpClient);
  private readonly api = ENVIRONNEMENT.apiUrl;

  /** Le compte complet, pour savoir si l'administrateur l'a validé. */
  compte(): Observable<CompteAgent> {
    return this.http.get<CompteAgent>(`${this.api}/moi`);
  }

  charger(): Observable<DonneesAgent> {
    return forkJoin({
      indicateurs: this.http.get<IndicateursAgent>(`${this.api}/tableau-de-bord`),
      visites: this.http.get<VisiteGeree[]>(`${this.api}/visites`),
      demandes: this.http.get<DemandeGeree[]>(`${this.api}/demandes-location`),
      offres: this.http.get<OffreGeree[]>(`${this.api}/offres-achat`),
      biens: this.http.get<BienAssigne[]>(`${this.api}/biens`),
      mandats: this.http
        .get<Mandat[]>(`${this.api}/contrats`)
        .pipe(map((contrats) => contrats.filter((c) => c.nature === NATURE_MANDAT))),
    });
  }

  performances(): Observable<PerformancesAgent> {
    return this.http.get<PerformancesAgent>(`${this.api}/agent/performances`);
  }

  /** Visites confirmées des 30 prochains jours, au format iCalendar. */
  planning(): Observable<Blob> {
    return this.http.get(`${this.api}/agent/planning`, { responseType: 'blob' });
  }

  confirmerVisite(id: string): Observable<unknown> {
    return this.http.post(`${this.api}/visites/${id}/confirmer`, {});
  }

  refuserVisite(id: string, motif: string): Observable<unknown> {
    return this.http.post(`${this.api}/visites/${id}/refuser`, { motif });
  }

  reprogrammerVisite(id: string, dateHeure: string): Observable<unknown> {
    return this.http.post(`${this.api}/visites/${id}/reprogrammer`, { date_heure: dateHeure });
  }

  redigerCompteRendu(id: string, contenu: string, interet: NiveauInteret): Observable<CompteRendu> {
    return this.http.post<CompteRendu>(`${this.api}/visites/${id}/compte-rendu`, {
      contenu,
      interet_client: interet,
    });
  }

  accepterDemande(id: string): Observable<unknown> {
    return this.http.post(`${this.api}/demandes-location/${id}/accepter`, {});
  }

  refuserDemande(id: string, motif: string): Observable<unknown> {
    return this.http.post(`${this.api}/demandes-location/${id}/refuser`, { motif });
  }

  refuserOffre(id: string, motif: string): Observable<unknown> {
    return this.http.post(`${this.api}/offres-achat/${id}/refuser`, { motif });
  }

  publierAnnonce(a: NouvelleAnnonce): Observable<AnnoncePubliee> {
    return this.http.post<AnnoncePubliee>(`${this.api}/mes-annonces`, a);
  }

  renouvelerMandat(id: string, dureeMois: number): Observable<unknown> {
    return this.http.post(`${this.api}/mandats/${id}/renouveler`, { duree_mois: dureeMois });
  }

  resilierMandat(id: string, motif: string): Observable<unknown> {
    return this.http.post(`${this.api}/mandats/${id}/resilier`, { motif });
  }
}
