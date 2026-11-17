import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { PaiementService } from '../../services/paiement';

@Component({
  selector: 'app-quittances',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './quittances.html',
  styleUrl: './quittances.css'
})
export class Quittances implements OnInit {
  paiements: any[] = [];
  user: any;
  isLoading = true;
  filtres = { bien: '', type: '', annee: '' };

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

    const allowed = ['proprietaire', 'client', 'administrateur'];
    if (!allowed.includes(this.user?.role)) {
      this.router.navigate([`/${this.user?.role ?? 'login'}/dashboard`]);
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
        this.snackBar.open('Impossible de charger les quittances', 'Fermer', { duration: 3000 });
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

  private annee(p: any): number {
    return new Date(p.confirme_le ?? p.created_at).getFullYear();
  }

  get quittances(): any[] {
    return this.paiements
      .filter((p) => p.statut === 'reussi' || p.statut === 'en_attente')
      .sort((a, b) =>
        new Date(b.confirme_le ?? b.created_at).getTime() - new Date(a.confirme_le ?? a.created_at).getTime()
      );
  }

  get biens(): { id: number; titre: string }[] {
    const map = new Map<number, string>();
    this.quittances.forEach((p) => {
      const b = p.contrat?.bien ?? p.promesse?.bien;
      if (b) map.set(b.id, b.titre);
    });
    return Array.from(map, ([id, titre]) => ({ id, titre }));
  }

  get annees(): number[] {
    return Array.from(new Set(this.quittances.map((p) => this.annee(p)))).sort((a, b) => b - a);
  }

  get filtrees(): any[] {
    return this.quittances.filter((p) => {
      const bId = p.contrat?.bien?.id ?? p.promesse?.bien?.id;
      return (
        (!this.filtres.bien || String(bId) === this.filtres.bien) &&
        (!this.filtres.type || p.type === this.filtres.type) &&
        (!this.filtres.annee || String(this.annee(p)) === this.filtres.annee)
      );
    });
  }

  get total(): number {
    return this.filtrees.reduce((somme, p) => somme + Number(p.montant), 0);
  }

  reset() {
    this.filtres = { bien: '', type: '', annee: '' };
  }

  objet(p: any): string {
    return p.libelle;
  }

  methodeLabel(m: string): string {
    const labels: Record<string, string> = { orange_money: 'Orange Money', wave: 'Wave', free_money: 'Free Money', carte_bancaire: 'Carte bancaire' };
    return labels[m] ?? m;
  }

  private declencherTelechargement(blob: Blob, nomFichier: string): void {
    const blobPdf = new Blob([blob], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blobPdf);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = nomFichier;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      window.URL.revokeObjectURL(url);
    }, 45000);
  }

  private onError(err: any, fallback: string): void {
    if (err?.error instanceof Blob) {
      err.error.text().then((text: string) => {
        try {
          const json = JSON.parse(text);
          this.snackBar.open(json.message || fallback, 'Fermer', { duration: 4000 });
        } catch {
          this.snackBar.open(fallback, 'Fermer', { duration: 4000 });
        }
      });
      return;
    }
    this.snackBar.open(err?.error?.message || fallback, 'Fermer', { duration: 4000 });
  }

  voir(p: any) {
    this.snackBar.open('Ouverture du document PDF...', '', { duration: 2000 });
    this.paiementService.quittance(p.id).subscribe({
      next: (blob) => {
        const blobPdf = new Blob([blob], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(blobPdf);
        const win = window.open(fileURL, '_blank');
        if (!win || win.closed) {
          this.declencherTelechargement(blob, `quittance-${p.reference}.pdf`);
        }
      },
      error: (err) => this.onError(err, 'Quittance indisponible ou non confirmée')
    });
  }

  telecharger(p: any) {
    this.snackBar.open('Téléchargement de la quittance...', '', { duration: 2000 });
    this.paiementService.quittance(p.id).subscribe({
      next: (blob) => {
        this.declencherTelechargement(blob, `quittance-${p.reference}.pdf`);
        this.snackBar.open('Téléchargement lancé avec succès !', 'Fermer', { duration: 3000 });
      },
      error: (err) => this.onError(err, 'Téléchargement impossible')
    });
  }
}
