import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { ENVIRONNEMENT } from '../config/environnement';
import { Media } from '../modeles/annonce';
import {
  AgentValide,
  AnnonceGeree,
  BienGere,
  DemandeRecue,
  IndicateursProprietaire,
  Mandat,
  NouveauBien,
  NouveauMandat,
  NouvelleAnnonce,
  OffreRecue,
  OptionPremium,
  VisiteRecue,
} from '../modeles/proprietaire';

export interface Recues {
  demandes: DemandeRecue[];
  offres: OffreRecue[];
  visites: VisiteRecue[];
}

export interface Patrimoine {
  biens: BienGere[];
  annonces: AnnonceGeree[];
}

export type ActionAnnonce = 'suspendre' | 'reprendre' | 'conclure';

/** Espace du propriétaire : demandes reçues, biens et annonces, agents et mandats. */
@Injectable({ providedIn: 'root' })
export class ProprietaireService {
  private readonly http = inject(HttpClient);
  private readonly api = ENVIRONNEMENT.apiUrl;

  indicateurs(): Observable<IndicateursProprietaire> {
    return this.http.get<IndicateursProprietaire>(`${this.api}/tableau-de-bord`);
  }

  recues(): Observable<Recues> {
    return forkJoin({
      demandes: this.http.get<DemandeRecue[]>(`${this.api}/demandes-location`),
      offres: this.http.get<OffreRecue[]>(`${this.api}/offres-achat`),
      visites: this.http.get<VisiteRecue[]>(`${this.api}/visites`),
    });
  }

  patrimoine(): Observable<Patrimoine> {
    return forkJoin({
      biens: this.http.get<BienGere[]>(`${this.api}/biens`),
      annonces: this.http.get<AnnonceGeree[]>(`${this.api}/mes-annonces`),
    });
  }

  /** La liste des biens ne porte pas les mandats : chaque fiche les charge. */
  biensAvecMandats(ids: readonly string[]): Observable<BienGere[]> {
    return ids.length ? forkJoin(ids.map((id) => this.bien(id))) : of([]);
  }

  bien(id: string): Observable<BienGere> {
    return this.http.get<BienGere>(`${this.api}/biens/${id}`);
  }

  accepterDemande(id: string): Observable<unknown> {
    return this.http.post(`${this.api}/demandes-location/${id}/accepter`, {});
  }

  refuserDemande(id: string, motif: string): Observable<unknown> {
    return this.http.post(`${this.api}/demandes-location/${id}/refuser`, { motif });
  }

  accepterOffre(id: string): Observable<unknown> {
    return this.http.post(`${this.api}/offres-achat/${id}/accepter`, {});
  }

  refuserOffre(id: string, motif: string): Observable<unknown> {
    return this.http.post(`${this.api}/offres-achat/${id}/refuser`, { motif });
  }

  confirmerVisite(id: string): Observable<unknown> {
    return this.http.post(`${this.api}/visites/${id}/confirmer`, {});
  }

  refuserVisite(id: string, motif: string): Observable<unknown> {
    return this.http.post(`${this.api}/visites/${id}/refuser`, { motif });
  }

  agirSurAnnonce(id: string, action: ActionAnnonce): Observable<AnnonceGeree> {
    return this.http.post<AnnonceGeree>(`${this.api}/mes-annonces/${id}/${action}`, {});
  }

  optionsPremium(): Observable<OptionPremium[]> {
    return this.http.get<OptionPremium[]>(`${this.api}/options-premium`);
  }

  mettreEnAvant(id: string, optionId: string): Observable<AnnonceGeree> {
    return this.http.post<AnnonceGeree>(`${this.api}/mes-annonces/${id}/premium`, {
      option_premium_id: optionId,
    });
  }

  agents(): Observable<AgentValide[]> {
    return this.http.get<AgentValide[]>(`${this.api}/agents`);
  }

  mandater(m: NouveauMandat): Observable<Mandat> {
    return this.http.post<Mandat>(`${this.api}/mandats`, m);
  }

  creerBien(b: NouveauBien): Observable<BienGere> {
    return this.http.post<BienGere>(`${this.api}/biens`, b);
  }

  ajouterPhoto(bienId: string, fichier: File): Observable<Media> {
    const corps = new FormData();
    corps.append('type', 'photo');
    corps.append('fichier', fichier);
    return this.http.post<Media>(`${this.api}/biens/${bienId}/medias`, corps);
  }

  publierAnnonce(a: NouvelleAnnonce): Observable<AnnonceGeree> {
    return this.http.post<AnnonceGeree>(`${this.api}/mes-annonces`, a);
  }
}
