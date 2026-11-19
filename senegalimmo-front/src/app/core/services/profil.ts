import { HttpClient, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { ENVIRONNEMENT } from '../config/environnement';
import {
  ChangementMotDePasse,
  LienPiece,
  ModificationProfil,
  ProfilCompte,
} from '../modeles/profil';

/** Cas « Gérer son profil » : identité, attributs du rôle, mot de passe, pièce d'identité. */
@Injectable({ providedIn: 'root' })
export class ProfilService {
  private readonly http = inject(HttpClient);
  private readonly api = ENVIRONNEMENT.apiUrl;
  private readonly url = `${this.api}/profil`;

  charger(): Observable<ProfilCompte> {
    return this.http.get<ProfilCompte>(`${this.api}/moi`);
  }

  /** Multipart pour pouvoir joindre la photo ; un champ vide part vide et devient null côté Laravel. */
  modifier(m: ModificationProfil): Observable<ProfilCompte> {
    const corps = new FormData();
    for (const [cle, valeur] of Object.entries(m)) {
      if (valeur === undefined) continue;
      corps.append(cle, valeur);
    }
    return this.http.post<ProfilCompte>(this.url, corps);
  }

  changerMotDePasse(c: ChangementMotDePasse): Observable<unknown> {
    return this.http.put(`${this.url}/mot-de-passe`, c);
  }

  televerserPiece(fichier: File): Observable<unknown> {
    const corps = new FormData();
    corps.append('fichier', fichier);
    return this.http.post(`${this.url}/piece-identite`, corps);
  }

  /** Lien signé vers la pièce actuelle, ou null si aucune n'a été envoyée (réponse 422). */
  pieceIdentite(): Observable<LienPiece | null> {
    return this.http
      .get<LienPiece>(`${this.url}/piece-identite`)
      .pipe(
        catchError((e: unknown) =>
          e instanceof HttpErrorResponse && e.status === HttpStatusCode.UnprocessableEntity
            ? of(null)
            : throwError(() => e),
        ),
      );
  }
}
