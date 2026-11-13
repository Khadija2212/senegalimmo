import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { OffreAchatService } from '../../services/offre-achat';
import { PromesseVenteService } from '../../services/promesse-vente';

@Component({
  selector: 'app-offres',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './offres.html',
  styleUrl: './offres.css'
})
export class Offres implements OnInit {
  offres: any[] = [];
  user: any;
  isLoading = true;
  filtre = '';
  today = '';

  panel: { id: number; mode: 'refus' | 'contre' | 'nouvelle' | 'promesse' } | null = null;
  motif = '';
  montant: number | null = null;
  promesse = { date_limite: '', indemnite: 0, conditions: '' };
  saving = false;

  tabs = [
    { value: '', label: 'Toutes' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'contre_proposee', label: 'Contre-proposées' },
    { value: 'acceptee', label: 'Acceptées' },
    { value: 'refusee', label: 'Refusées' },
    { value: 'annulee', label: 'Annulées' },
  ];

  constructor(
    private offreService: OffreAchatService,
    private promesseService: PromesseVenteService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.authService.getCurrentUser();

    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    this.today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

  get filtered(): any[] {
    return this.filtre ? this.offres.filter((o) => o.statut === this.filtre) : this.offres;
  }

  count(statut: string): number {
    return statut ? this.offres.filter((o) => o.statut === statut).length : this.offres.length;
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      contre_proposee: 'Contre-proposée',
      acceptee: 'Acceptée',
      refusee: 'Refusée',
      annulee: 'Annulée',
    };
    return labels[statut] ?? statut;
  }

  private message(err: any, fallback: string): string {
    return err.error?.errors
      ? (Object.values(err.error.errors).flat() as string[]).join(' ')
      : err.error?.message || fallback;
  }

  load() {
    this.offreService.getAll().subscribe({
      next: (data) => {
        this.offres = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Impossible de charger les offres', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  open(offre: any, mode: 'refus' | 'contre' | 'nouvelle' | 'promesse') {
    this.panel = { id: offre.id, mode };
    this.motif = '';
    this.montant = null;
    this.promesse = { date_limite: '', indemnite: 0, conditions: '' };
  }

  close() {
    this.panel = null;
  }

  act(offre: any, action: string, confirmation?: string) {
    if (confirmation && !confirm(confirmation)) return;

    this.offreService.act(offre.id, { action }).subscribe({
      next: () => {
        this.snackBar.open('Offre mise à jour', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snackBar.open(this.message(err, 'Action impossible'), 'Fermer', { duration: 5000 })
    });
  }

  confirm(offre: any) {
    if (!this.panel) return;
    const mode = this.panel.mode;

    if (mode === 'promesse') {
      if (!this.promesse.date_limite) {
        this.snackBar.open('Indiquez la date limite', 'Fermer', { duration: 3000 });
        return;
      }

      this.saving = true;
      this.promesseService.create({
        offre_id: offre.id,
        date_limite: this.promesse.date_limite,
        indemnite: this.promesse.indemnite || 0,
        conditions: this.promesse.conditions.trim() || null,
      }).subscribe({
        next: () => {
          this.saving = false;
          this.panel = null;
          this.snackBar.open('Promesse créée. Elle doit maintenant être signée par les deux parties.', 'Fermer', { duration: 5000 });
          this.load();
        },
        error: (err) => {
          this.saving = false;
          this.snackBar.open(this.message(err, 'Création impossible'), 'Fermer', { duration: 6000 });
          this.cdr.detectChanges();
        }
      });
      return;
    }

    const payload: { action: string; montant?: number | null; motif?: string } =
      mode === 'refus'
        ? { action: 'refuser', motif: this.motif.trim() }
        : { action: mode === 'contre' ? 'contre' : 'nouvelle_offre', montant: this.montant };

    if (mode === 'refus' && !payload.motif) {
      this.snackBar.open('Indiquez le motif du refus', 'Fermer', { duration: 3000 });
      return;
    }
    if (mode !== 'refus' && (!this.montant || this.montant <= 0)) {
      this.snackBar.open('Indiquez un montant valide', 'Fermer', { duration: 3000 });
      return;
    }

    this.saving = true;
    this.offreService.act(offre.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.panel = null;
        this.snackBar.open('Offre mise à jour', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(this.message(err, 'Action impossible'), 'Fermer', { duration: 5000 });
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