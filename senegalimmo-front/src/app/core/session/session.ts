import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, firstValueFrom, map, of, switchMap, tap } from 'rxjs';
import { ENVIRONNEMENT } from '../config/environnement';

export type Role = 'client' | 'proprietaire' | 'agent' | 'administrateur';
export type RoleInscription = Exclude<Role, 'administrateur'>;

export interface CompteConnecte {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: Role;
}

export interface Identifiants {
  email: string;
  password: string;
}

export interface Inscription extends Identifiants {
  prenom: string;
  nom: string;
  telephone: string;
  password_confirmation: string;
  role: RoleInscription;
}

interface ReponseSession {
  user: CompteConnecte;
}

/** Cookie posé par Sanctum ; Angular le recopie dans l'en-tête X-XSRF-TOKEN. */
const CHEMIN_CSRF = '/sanctum/csrf-cookie';

/**
 * Compte connecté. La session vit dans un cookie httpOnly posé par le backend :
 * la page ne voit jamais de jeton, elle demande seulement « qui suis-je ».
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly api = ENVIRONNEMENT.apiUrl;
  private readonly compteCourant = signal<CompteConnecte | null>(null);

  readonly compte = this.compteCourant.asReadonly();
  readonly connecte = computed(() => this.compteCourant() !== null);
  readonly role = computed(() => this.compteCourant()?.role ?? null);
  readonly estClient = computed(() => this.role() === 'client');

  /** Lu au démarrage : une session ouverte avant le rechargement reste ouverte. */
  charger(): Promise<void> {
    return firstValueFrom(
      this.http.get<CompteConnecte>(`${this.api}/moi`).pipe(
        tap((c) => this.compteCourant.set(c)),
        map(() => undefined),
        catchError(() => {
          this.compteCourant.set(null);
          return of(undefined);
        }),
      ),
    );
  }

  connecter(identifiants: Identifiants): Observable<CompteConnecte> {
    return this.ouvrir(`${this.api}/connexion`, identifiants);
  }

  inscrire(inscription: Inscription): Observable<CompteConnecte> {
    return this.ouvrir(`${this.api}/inscription`, inscription);
  }

  deconnecter(): Observable<void> {
    return this.http.post(`${this.api}/deconnexion`, {}).pipe(
      catchError(() => of(null)),
      tap(() => this.compteCourant.set(null)),
      map(() => undefined),
    );
  }

  private ouvrir(url: string, corps: object): Observable<CompteConnecte> {
    return this.http.get(CHEMIN_CSRF).pipe(
      switchMap(() => this.http.post<ReponseSession>(url, corps)),
      map((r) => r.user),
      tap((c) => this.compteCourant.set(c)),
    );
  }
}
