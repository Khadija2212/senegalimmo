import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://127.0.0.1:8000/api';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        this.currentUserSubject.next(JSON.parse(user));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data).pipe(
      tap((response: any) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data).pipe(
      tap((response: any) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
      })
    );
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`).pipe(
      tap((user: any) => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  modifierProfil(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profil`, data).pipe(
      tap((response: any) => {
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  changerMotDePasse(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profil/mot-de-passe`, data);
  }

  televerserDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('document', file);
    return this.http.post(`${this.apiUrl}/profil/document`, formData).pipe(
      tap((response: any) => {
        const u = this.currentUserSubject.value;
        if (u && response.document_identite) {
          u.document_identite = response.document_identite;
          localStorage.setItem('user', JSON.stringify(u));
          this.currentUserSubject.next(u);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  getDashboardRoute(role?: string | null): string {
    switch (role) {
      case 'administrateur':
        return '/admin/dashboard';
      case 'agence':
      case 'agent':
        return '/agent/dashboard';
      case 'proprietaire':
        return '/proprietaire/dashboard';
      case 'locataire':
        return '/locataire/dashboard';
      case 'acheteur':
        return '/acheteur/dashboard';
      case 'client':
        return '/client/dashboard';
      default:
        return '/';
    }
  }

    // Met à jour l'utilisateur mémorisé (après modification du profil)
  updateStoredUser(user: any): void {
    const store = sessionStorage.getItem('user') !== null ? sessionStorage : localStorage;
    store.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
}
