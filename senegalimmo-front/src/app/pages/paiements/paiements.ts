import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { PaiementService } from '../../services/paiement';

@Component({
  selector: 'app-paiements',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './paiements.html',
  styleUrl: './paiements.css'
})
export class Paiements implements OnInit {
  paiements: any[] = [];
  user: any;
  isLoading = true;

  constructor(
    private paiementService: PaiementService,
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

    this.paiementService.getAll().subscribe({
      next: (data) => {
        this.paiements = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Impossible de charger les paiements', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  get isOwner(): boolean {
    return this.user?.role === 'proprietaire';
  }

  get dashboardLink(): string {
    return this.authService.getDashboardRoute(this.user?.role);
  }

  get totalConfirme(): number {
    return this.paiements
      .filter((p) => p.statut === 'reussi')
      .reduce((sum, p) => sum + Number(p.montant), 0);
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      confirme: 'Confirmé',
      echoue: 'Échoué',
    };
    return labels[statut] ?? statut;
  }

  methodeLabel(m: string): string {
    const labels: Record<string, string> = {
      orange_money: 'Orange Money',
      wave: 'Wave',
      free_money: 'Free Money',
    };
    return labels[m] ?? m;
  }

  objet(p: any): string {
    return p.libelle;
  }

  openQuittance(p: any) {
    this.snackBar.open('Génération de la quittance PDF...', '', { duration: 1500 });
    this.paiementService.quittance(p.id).subscribe({
      next: (blob) => {
        const blobPdf = new Blob([blob], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(blobPdf);
        const win = window.open(fileURL, '_blank');
        if (!win || win.closed) {
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = fileURL;
          a.download = `quittance-${p.reference}.pdf`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            if (document.body.contains(a)) document.body.removeChild(a);
            window.URL.revokeObjectURL(fileURL);
          }, 45000);
        }
      },
      error: () => this.snackBar.open('Quittance indisponible ou non confirmée', 'Fermer', { duration: 3000 })
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