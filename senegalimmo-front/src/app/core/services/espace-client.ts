import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { ENVIRONNEMENT } from '../config/environnement';
import { Annonce } from '../modeles/annonce';
import { DemandeLocation, IndicateursClient, OffreAchat, Visite } from '../modeles/demarches';

export interface DonneesEspace {
  indicateurs: IndicateursClient;
  visites: Visite[];
  demandes: DemandeLocation[];
  offres: OffreAchat[];
  favoris: Annonce[];
}

/** Lecture et suivi des démarches du client connecté. */
@Injectable({ providedIn: 'root' })
export class EspaceClientService {
  private readonly http = inject(HttpClient);
  private readonly api = ENVIRONNEMENT.apiUrl;

  charger(): Observable<DonneesEspace> {
    return forkJoin({
      indicateurs: this.http.get<IndicateursClient>(`${this.api}/tableau-de-bord`),
      visites: this.http.get<Visite[]>(`${this.api}/visites`),
      demandes: this.http.get<DemandeLocation[]>(`${this.api}/demandes-location`),
      offres: this.http.get<OffreAchat[]>(`${this.api}/offres-achat`),
      favoris: this.http.get<Annonce[]>(`${this.api}/favoris`),
    });
  }

  annulerVisite(id: string): Observable<Visite> {
    return this.http.post<Visite>(`${this.api}/visites/${id}/annuler`, {});
  }

  reprogrammerVisite(id: string, dateHeure: string): Observable<Visite> {
    return this.http.post<Visite>(`${this.api}/visites/${id}/reprogrammer`, {
      date_heure: dateHeure,
    });
  }

  annulerDemande(id: string): Observable<DemandeLocation> {
    return this.http.post<DemandeLocation>(`${this.api}/demandes-location/${id}/annuler`, {});
  }

  retirerOffre(id: string): Observable<OffreAchat> {
    return this.http.post<OffreAchat>(`${this.api}/offres-achat/${id}/retirer`, {});
  }
}
