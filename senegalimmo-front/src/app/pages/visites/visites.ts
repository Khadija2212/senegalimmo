import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { VisiteService } from '../../services/visite';

@Component({
  selector: 'app-visites',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './visites.html',
  styleUrl: './visites.css'
})
export class Visites implements OnInit {
  visites: any[] = [];
  user: any;
  isLoading = true;
  filtre = '';

  tabs = [
    { value: '', label: 'Toutes' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'confirme', label: 'Confirmées' },
    { value: 'effectue', label: 'Effectuées' },
    { value: 'annule', label: 'Annulées' },
  ];

  constructor(
    private visiteService: VisiteService,
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

  get isOwner(): boolean {
    return ['proprietaire', 'agence', 'agent'].includes(this.user?.role);
  }
  get dashboardLink(): string {
    return this.authService.getDashboardRoute(this.user?.role);
  }

  get filtered(): any[] {
    return this.filtre ? this.visites.filter((v) => v.statut === this.filtre) : this.visites;
  }

  count(statut: string): number {
    return statut ? this.visites.filter((v) => v.statut === statut).length : this.visites.length;
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      confirme: 'Confirmée',
      effectue: 'Effectuée',
      annule: 'Annulée',
    };
    return labels[statut] ?? statut;
  }

  load() {
    this.visiteService.getAll().subscribe({
      next: (data) => {
        this.visites = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Impossible de charger les visites', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  changeStatut(visite: any, statut: string, question?: string) {
    if (question && !confirm(question)) return;

    this.visiteService.updateStatut(visite.id, statut).subscribe({
      next: () => {
        this.snackBar.open('Visite mise à jour', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Action impossible', 'Fermer', { duration: 4000 });
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