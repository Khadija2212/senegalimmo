import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { PortefeuilleService } from '../../services/portefeuille';

@Component({
  selector: 'app-portefeuille',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './portefeuille.html',
  styleUrl: './portefeuille.css'
})
export class Portefeuille implements OnInit {
  data: any = { solde_disponible: 0, solde_en_attente: 0, minimum: 0, ecritures: [], retraits: [] };
  user: any;
  isLoading = true;
  showForm = false;
  saving = false;
  form = { montant: null as number | null, methode: 'wave', numero_telephone: '' };

  methodes = [
    { value: 'wave', label: 'Wave' },
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'free_money', label: 'Free Money' },
  ];

  constructor(
    private service: PortefeuilleService,
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

  get dashboardLink(): string {
    return this.authService.getDashboardRoute(this.user?.role);
  }

  methodeLabel(m: string): string {
    return this.methodes.find((x) => x.value === m)?.label ?? m;
  }

  statutLabel(s: string): string {
    const labels: Record<string, string> = { demande: 'Demandé', approuve: 'Versement en cours', verse: 'Versé', rejete: 'Rejeté' };
    return labels[s] ?? s;
  }

  private message(err: any, fallback: string): string {
    return err.error?.errors
      ? (Object.values(err.error.errors).flat() as string[]).join(' ')
      : err.error?.message || fallback;
  }

  load() {
    this.service.portefeuille().subscribe({
      next: (d) => {
        this.data = d;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(this.message(err, 'Impossible de charger le portefeuille'), 'Fermer', { duration: 4000 });
        this.cdr.detectChanges();
      }
    });
  }

  demander() {
    if (!this.form.montant || this.form.montant <= 0 || !this.form.numero_telephone.trim()) {
      this.snackBar.open('Indiquez le montant et le numéro', 'Fermer', { duration: 3000 });
      return;
    }

    this.saving = true;
    this.service.demander({
      montant: this.form.montant,
      methode: this.form.methode,
      numero_beneficiaire: this.form.numero_telephone.trim(),
    }).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.form = { montant: null, methode: 'wave', numero_telephone: '' };
        this.snackBar.open('Demande envoyée. Le montant est bloqué jusqu\'au traitement.', 'Fermer', { duration: 5000 });
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(this.message(err, 'Demande impossible'), 'Fermer', { duration: 6000 });
        this.cdr.detectChanges();
      }
    });
  }
}