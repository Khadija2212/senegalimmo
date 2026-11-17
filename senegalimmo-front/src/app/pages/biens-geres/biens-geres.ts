import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { AgenceService } from '../../services/agence';
import { AnnonceService } from '../../services/annonce';

@Component({
  selector: 'app-biens-geres',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './biens-geres.html',
  styleUrl: './biens-geres.css'
})
export class BiensGeres implements OnInit {
  mandats: any[] = [];
  user: any;
  isLoading = true;
  publishing: number | null = null;

  constructor(
    private agenceService: AgenceService,
    private annonceService: AnnonceService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.authService.getCurrentUser();
  }

  ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.load();
  }

  get isAgence(): boolean {
    return this.user?.role === 'agent';
  }

  get dashboardLink(): string {
    return this.authService.getDashboardRoute(this.user?.role);
  }

  annonceStatut(m: any): string {
    return m.bien?.annonces?.[0]?.statut ?? '';
  }

  annonceMotif(m: any): string {
    return m.bien?.annonces?.[0]?.motif_rejet ?? '';
  }

  peutPublier(m: any): boolean {
    const s = this.annonceStatut(m);
    return s === '' || s === 'rejetee' || s === 'expiree';
  }

  load() {
    this.agenceService.biensGeres().subscribe({
      next: (data) => {
        this.mandats = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Impossible de charger les biens', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  publier(m: any) {
    this.publishing = m.bien_id;

    this.annonceService.publish(m.bien_id).subscribe({
      next: () => {
        this.publishing = null;
        this.snackBar.open('Annonce envoyée à l\'administrateur pour validation', 'Fermer', { duration: 4000 });
        this.load();
      },
      error: (err) => {
        this.publishing = null;
        this.snackBar.open(err.error?.message || 'Publication impossible', 'Fermer', { duration: 5000 });
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    });
  }
}