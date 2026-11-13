import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth';

export type Devise = 'FCFA' | 'EUR' | 'USD';

interface Taux {
  eur: number;
  usd: number;
  source: string;
  date: string | null;
  indicatif: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeviseService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  readonly devise = signal<Devise>('FCFA');
  readonly taux = signal<Taux | null>(null);

  constructor(private http: HttpClient, private authService: AuthService) {
    this.devise.set(this.initiale());
    this.chargerTaux();
  }

  // Choix mémorisé dans le navigateur, sinon préférence du compte
  private initiale(): Devise {
    try {
      const local = localStorage.getItem('devise');
      if (local === 'FCFA' || local === 'EUR' || local === 'USD') return local;
    } catch {}

    const compte = this.authService.getCurrentUser()?.devise;
    return compte === 'EUR' || compte === 'USD' ? compte : 'FCFA';
  }

  private chargerTaux() {
    this.http.get<any>(`${this.apiUrl}/taux-change`).subscribe({
      next: (r) =>
        this.taux.set({
          eur: r.eur_par_xof,
          usd: r.usd_par_xof,
          source: r.source,
          date: r.date,
          indicatif: r.indicatif,
        }),
      error: () => {}
    });
  }

  choisir(d: Devise) {
    this.devise.set(d);

    try {
      localStorage.setItem('devise', d);
    } catch {}

    // Si l'utilisateur est connecté, la préférence suit son compte
    if (this.authService.isLoggedIn()) {
      this.http.put(`${this.apiUrl}/profil/devise`, { devise: d }).subscribe({ error: () => {} });
    }
  }

  // Les montants de la base sont toujours en FCFA
  formater(montantXof: number | string | null | undefined): string {
    if (montantXof === null || montantXof === undefined || montantXof === '') return '';

    const n = Number(montantXof);
    if (isNaN(n)) return '';

    const taux = this.taux();
    const devise = this.devise();

    if (devise === 'EUR' && taux) {
      return '≈ ' + new Intl.NumberFormat('fr-FR', {
        style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
      }).format(n * taux.eur);
    }

    if (devise === 'USD' && taux) {
      return '≈ ' + new Intl.NumberFormat('fr-FR', {
        style: 'currency', currency: 'USD', maximumFractionDigits: 0,
      }).format(n * taux.usd);
    }

    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' FCFA';
  }
}