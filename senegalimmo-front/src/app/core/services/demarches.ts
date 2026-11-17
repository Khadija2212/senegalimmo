import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ENVIRONNEMENT } from '../config/environnement';

export interface DemandeVisite {
  annonce_id: string;
  date_heure: string;
}

export interface DemandeLocation {
  annonce_id: string;
  date_entree_souhaitee: string;
  duree_mois: number;
  message?: string;
}

export interface OffreAchat {
  annonce_id: string;
  montant: number;
  message?: string;
}

export type MotifSignalement =
  | 'annonce_frauduleuse'
  | 'informations_erronees'
  | 'bien_indisponible'
  | 'comportement_abusif'
  | 'probleme_paiement'
  | 'autre';

export interface Signalement {
  annonce_id: string;
  motif: MotifSignalement;
  description: string;
}

/** Démarches du client sur une annonce : visite, location, offre, signalement. */
@Injectable({ providedIn: 'root' })
export class DemarchesService {
  private readonly http = inject(HttpClient);
  private readonly api = ENVIRONNEMENT.apiUrl;

  demanderVisite(d: DemandeVisite): Observable<unknown> {
    return this.http.post(`${this.api}/visites`, d);
  }

  demanderLocation(d: DemandeLocation): Observable<unknown> {
    return this.http.post(`${this.api}/demandes-location`, d);
  }

  soumettreOffre(d: OffreAchat): Observable<unknown> {
    return this.http.post(`${this.api}/offres-achat`, d);
  }

  signaler(d: Signalement): Observable<unknown> {
    return this.http.post(`${this.api}/signalements`, d);
  }
}

/** Message d'erreur lisible, tiré de la réponse de l'API. */
export function messageErreur(erreur: unknown, parDefaut: string): string {
  if (erreur instanceof HttpErrorResponse && typeof erreur.error?.message === 'string') {
    return erreur.error.message;
  }
  return parDefaut;
}
