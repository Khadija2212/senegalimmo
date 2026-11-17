import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { ContratService } from '../../services/contrat';
import { PaiementService } from '../../services/paiement';

@Component({
  selector: 'app-contrats',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './contrats.html',
  styleUrl: './contrats.css'
})
export class Contrats implements OnInit {
  contrats: any[] = [];
  user: any;
  isLoading = true;

  eche: Record<number, any> = {};
  methode: Record<number, string> = {};
  paying: string | null = null;

  methodes = [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'wave', label: 'Wave' },
    { value: 'free_money', label: 'Free Money' },
  ];

  constructor(
    private contratService: ContratService,
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
    this.load();
  }

  get isOwner(): boolean {
    return this.user?.role === 'proprietaire';
  }

  get dashboardLink(): string {
    return this.authService.getDashboardRoute(this.user?.role);
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      en_attente: 'À signer',
      signe: 'Signé',
      resilie: 'Résilié',
      expire: 'Expiré',
    };
    return labels[statut] ?? statut;
  }

  canSign(c: any): boolean {
    if (c.statut !== 'en_attente') return false;
    return this.isOwner ? !c.signe_proprietaire : !c.signe_locataire;
  }

  periodeLabel(periode: string): string {
    const [y, m] = periode.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  load() {
    this.contratService.getAll().subscribe({
      next: (data) => {
        this.contrats = data;
        this.isLoading = false;

        if (!this.isOwner) {
          data.filter((c) => c.statut === 'signe').forEach((c) => {
            this.methode[c.id] = this.methode[c.id] ?? 'orange_money';
            this.paiementService.echeancier(c.id).subscribe({
              next: (e) => {
                this.eche[c.id] = e;
                this.cdr.detectChanges();
              },
              error: () => {}
            });
          });
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Impossible de charger les baux', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  openPdf(c: any) {
    this.snackBar.open('Génération du bail PDF...', '', { duration: 1500 });
    this.contratService.pdf(c.id).subscribe({
      next: (blob) => {
        const blobPdf = new Blob([blob], { type: 'application/pdf' });
        const url = URL.createObjectURL(blobPdf);
        const win = window.open(url, '_blank');

        if (!win || win.closed) {
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `bail-${c.id}.pdf`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            if (document.body.contains(a)) document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 45000);
        }
      },
      error: () => this.snackBar.open('Impossible de générer le PDF', 'Fermer', { duration: 4000 })
    });
  }

  sign(c: any) {
    const ok = confirm(
      'En signant, vous confirmez avoir lu et accepté les termes de ce bail. ' +
      'Votre signature sera enregistrée avec la date et l\'heure. Continuer ?'
    );
    if (!ok) return;

    this.contratService.sign(c.id).subscribe({
      next: () => {
        this.snackBar.open('Bail signé', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Signature impossible', 'Fermer', { duration: 4000 })
    });
  }

  pay(c: any, type: 'caution' | 'loyer') {
    this.paying = `${c.id}-${type}`;

    this.paiementService.initier({
      bail_id: c.id,
      type,
      methode: this.methode[c.id] ?? 'orange_money',
    }).subscribe({
      next: (res) => {
        // Redirection vers la page de paiement PayTech
        window.location.href = res.redirect_url;
      },
      error: (err) => {
        this.paying = null;
        this.snackBar.open(err.error?.message || 'Paiement impossible', 'Fermer', { duration: 6000 });
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