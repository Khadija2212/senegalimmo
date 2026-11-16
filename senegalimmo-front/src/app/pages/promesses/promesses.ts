import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { PromesseVenteService } from '../../services/promesse-vente';
import { PaiementService } from '../../services/paiement';

@Component({
  selector: 'app-promesses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './promesses.html',
  styleUrl: './promesses.css'
})
export class Promesses implements OnInit {
  promesses: any[] = [];
  paiements: any[] = [];
  user: any;
  isLoading = true;
  payingPromesseId: number | null = null;
  selectedMethode = 'wave';
  isInitiatingPayment = false;

  constructor(
    private promesseService: PromesseVenteService,
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

  get isBuyer(): boolean {
    return this.user?.role === 'acheteur' || this.user?.role === 'client';
  }

  get dashboardLink(): string {
    return this.authService.getDashboardRoute(this.user?.role);
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      en_attente: 'À signer',
      signee: 'Signée',
      annulee: 'Annulée',
    };
    return labels[statut] ?? statut;
  }

  canSign(p: any): boolean {
    if (p.statut !== 'en_attente') return false;
    return this.isOwner ? !p.signe_vendeur : !p.signe_acheteur;
  }

  getPaiement(p: any): any | undefined {
    return this.paiements.find(pay => pay.promesse_id === p.id && pay.statut === 'reussi');
  }

  load() {
    this.promesseService.getAll().subscribe({
      next: (data) => {
        this.promesses = data;
        this.loadPaiements();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Impossible de charger les promesses', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  private loadPaiements() {
    this.paiementService.getAll().subscribe({
      next: (pays) => {
        this.paiements = pays;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openPdf(p: any) {
    this.snackBar.open('Génération de la promesse PDF...', '', { duration: 1500 });
    this.promesseService.pdf(p.id).subscribe({
      next: (blob) => {
        const blobPdf = new Blob([blob], { type: 'application/pdf' });
        const url = URL.createObjectURL(blobPdf);
        const win = window.open(url, '_blank');

        if (!win || win.closed) {
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `promesse-${p.id}.pdf`;
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

  sign(p: any) {
    const ok = confirm(
      'En signant, vous vous engagez à vendre ou acquérir ce bien aux conditions de la promesse. ' +
      'Votre signature sera enregistrée avec la date et l\'heure. Continuer ?'
    );
    if (!ok) return;

    this.promesseService.sign(p.id).subscribe({
      next: () => {
        this.snackBar.open('Promesse signée avec succès', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Signature impossible', 'Fermer', { duration: 4000 })
    });
  }

  startPayment(p: any) {
    this.payingPromesseId = p.id;
  }

  cancelPayment() {
    this.payingPromesseId = null;
  }

  submitPayment(p: any) {
    this.isInitiatingPayment = true;
    this.paiementService.initier({
      promesse_id: p.id,
      type: 'indemnite',
      methode: this.selectedMethode
    }).subscribe({
      next: (res) => {
        this.isInitiatingPayment = false;
        this.payingPromesseId = null;
        if (res.redirect_url) {
          window.location.href = res.redirect_url;
        }
      },
      error: (err) => {
        this.isInitiatingPayment = false;
        this.snackBar.open(err.error?.message || 'Erreur lors de l\'initialisation du paiement.', 'Fermer', { duration: 4000 });
      }
    });
  }

  downloadReceipt(paiement: any) {
    this.snackBar.open('Téléchargement du reçu en cours...', '', { duration: 1500 });
    this.paiementService.quittance(paiement.id).subscribe({
      next: (blob) => {
        const blobPdf = new Blob([blob], { type: 'application/pdf' });
        const url = URL.createObjectURL(blobPdf);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `recu-${paiement.reference}.pdf`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 45000);
      },
      error: () => this.snackBar.open('Impossible de télécharger le reçu', 'Fermer', { duration: 3000 })
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
