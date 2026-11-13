import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth';
import { AnnonceService } from '../../../services/annonce';

@Component({
  selector: 'app-annonces-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './annonces-admin.html',
  styleUrl: './annonces-admin.css'
})
export class AnnoncesAdmin implements OnInit {
  annonces: any[] = [];
  user: any;
  isLoading = true;
  filtre = 'en_attente';

  verifieChoice: Record<number, boolean> = {};
  rejectingId: number | null = null;
  motif = '';

  tabs = [
    { value: 'en_attente', label: 'En attente' },
    { value: 'publiee', label: 'Publiées' },
    { value: 'rejetee', label: 'Rejetées' },
    { value: '', label: 'Toutes' },
  ];

  constructor(
    private annonceService: AnnonceService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.authService.getCurrentUser();
  }

  ngOnInit() {
    if (!this.authService.isLoggedIn() || this.user?.role !== 'administrateur') {
      this.router.navigate(['/login']);
      return;
    }
    this.load();
  }

  get filtered(): any[] {
    return this.filtre ? this.annonces.filter((a) => a.statut === this.filtre) : this.annonces;
  }

  count(statut: string): number {
    return statut ? this.annonces.filter((a) => a.statut === statut).length : this.annonces.length;
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      publiee: 'Publiée',
      rejetee: 'Rejetée',
      expiree: 'Expirée',
    };
    return labels[statut] ?? statut;
  }

  load() {
    this.annonceService.getAll().subscribe({
      next: (data) => {
        this.annonces = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Impossible de charger les annonces', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  publier(annonce: any) {
    this.annonceService
      .moderate(annonce.id, { statut: 'publiee', verifie: !!this.verifieChoice[annonce.id] })
      .subscribe({
        next: () => {
          this.snackBar.open('Annonce publiée', 'Fermer', { duration: 3000 });
          this.load();
        },
        error: (err) => this.snackBar.open(err.error?.message || 'Action impossible', 'Fermer', { duration: 4000 })
      });
  }

  startReject(annonce: any) {
    this.rejectingId = annonce.id;
    this.motif = '';
  }

  cancelReject() {
    this.rejectingId = null;
    this.motif = '';
  }

  confirmReject(annonce: any) {
    if (!this.motif.trim()) {
      this.snackBar.open('Indiquez le motif du rejet', 'Fermer', { duration: 3000 });
      return;
    }

    this.annonceService
      .moderate(annonce.id, { statut: 'rejetee', motif_rejet: this.motif.trim() })
      .subscribe({
        next: () => {
          this.snackBar.open('Annonce rejetée', 'Fermer', { duration: 3000 });
          this.cancelReject();
          this.load();
        },
        error: (err) => this.snackBar.open(err.error?.message || 'Action impossible', 'Fermer', { duration: 4000 })
      });
  }

  toggleBadge(annonce: any) {
    this.annonceService.setVerification(annonce.id, !annonce.bien_verifie).subscribe({
      next: () => {
        this.snackBar.open('Badge mis à jour', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Action impossible', 'Fermer', { duration: 4000 })
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