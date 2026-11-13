import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { AgenceService } from '../../services/agence';

@Component({
  selector: 'app-commissions',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './commissions.html',
  styleUrl: './commissions.css'
})
export class Commissions implements OnInit {
  data: any = { total: 0, due: 0, reglee: 0, commissions: [] };
  user: any;
  isLoading = true;

  constructor(
    private agenceService: AgenceService,
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
    return ['agence', 'agent'].includes(this.user?.role);
  }

  get isOwner(): boolean {
    return this.user?.role === 'proprietaire';
  }

  get dashboardLink(): string {
    return this.authService.getDashboardRoute(this.user?.role);
  }

  load() {
    this.agenceService.commissions().subscribe({
      next: (data) => {
        this.data = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Impossible de charger les commissions', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  regler(c: any) {
    if (!confirm('Marquer cette commission comme réglée ?')) return;

    this.agenceService.regler(c.id).subscribe({
      next: () => {
        this.snackBar.open('Commission marquée comme réglée', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Action impossible', 'Fermer', { duration: 4000 })
    });
  }
    get isProprietaire(): boolean {
    return this.user?.role === 'proprietaire';
  }

  payer(c: any) {
    if (!confirm('Régler cette commission depuis votre portefeuille ?')) return;

    this.agenceService.payerCommission(c.id).subscribe({
      next: () => {
        this.snackBar.open('Commission réglée depuis votre portefeuille', 'Fermer', { duration: 4000 });
        this.load();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Paiement impossible', 'Fermer', { duration: 5000 })
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