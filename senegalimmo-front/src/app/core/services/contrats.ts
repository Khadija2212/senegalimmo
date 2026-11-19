import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ENVIRONNEMENT } from '../config/environnement';
import { Media } from '../modeles/annonce';
import {
  AdresseDocument,
  Bail,
  Contrat,
  DemandePourBail,
  Echeancier,
  EtatDesLieux,
  NouvelEtatDesLieux,
} from '../modeles/contrats';

/** Contrats du compte : bail, promesse de vente, mandat ; signatures, échéancier, états des lieux. */
@Injectable({ providedIn: 'root' })
export class ContratsService {
  private readonly http = inject(HttpClient);
  private readonly api = ENVIRONNEMENT.apiUrl;

  lister(): Observable<Contrat[]> {
    return this.http.get<Contrat[]>(`${this.api}/contrats`);
  }

  detail(id: string): Observable<Contrat> {
    return this.http.get<Contrat>(`${this.api}/contrats/${id}`);
  }

  /** Adresse de lecture du PDF, valable quelques minutes. */
  document(id: string): Observable<AdresseDocument> {
    return this.http.get<AdresseDocument>(`${this.api}/contrats/${id}/document`);
  }

  signer(id: string): Observable<Contrat> {
    return this.http.post<Contrat>(`${this.api}/contrats/${id}/signer`, {});
  }

  relancer(signatureId: string): Observable<unknown> {
    return this.http.post(`${this.api}/signatures/${signatureId}/relancer`, {});
  }

  echeancier(bailId: string): Observable<Echeancier> {
    return this.http.get<Echeancier>(`${this.api}/baux/${bailId}/echeancier`);
  }

  resilierBail(bailId: string, motif: string): Observable<unknown> {
    return this.http.post(`${this.api}/baux/${bailId}/resilier`, { motif });
  }

  creerBail(demandeId: string, jourEcheance: number): Observable<Bail> {
    return this.http.post<Bail>(`${this.api}/baux`, {
      demande_location_id: demandeId,
      jour_echeance: jourEcheance,
    });
  }

  etatsDesLieux(bailId: string): Observable<EtatDesLieux[]> {
    return this.http.get<EtatDesLieux[]>(`${this.api}/baux/${bailId}/etats-des-lieux`);
  }

  creerEtatDesLieux(bailId: string, e: NouvelEtatDesLieux): Observable<EtatDesLieux> {
    return this.http.post<EtatDesLieux>(`${this.api}/baux/${bailId}/etats-des-lieux`, e);
  }

  validerEtatDesLieux(id: string): Observable<unknown> {
    return this.http.post(`${this.api}/etats-des-lieux/${id}/valider`, {});
  }

  /** Photos déjà rangées sur le bien, à joindre à un état des lieux. */
  photosDuBien(bienId: string): Observable<Media[]> {
    return this.http
      .get<{ medias: Media[] }>(`${this.api}/biens/${bienId}`)
      .pipe(map((b) => b.medias.filter((m) => m.type === 'photo')));
  }

  demandesLocation(): Observable<DemandePourBail[]> {
    return this.http.get<DemandePourBail[]>(`${this.api}/demandes-location`);
  }
}

/**
 * Ouvre un document dans un nouvel onglet. L'onglet est ouvert tout de suite, pendant le clic,
 * pour ne pas être bloqué ; il reçoit l'adresse signée dès que l'API la renvoie.
 */
export function ouvrirDocument(requete: Observable<{ url: string }>): Observable<void> {
  const onglet = window.open('', '_blank');
  return requete.pipe(
    tap({
      next: ({ url }) => {
        if (!onglet) {
          window.location.assign(url);
          return;
        }
        onglet.opener = null;
        onglet.location.href = url;
      },
      error: () => onglet?.close(),
    }),
    map(() => undefined),
  );
}
