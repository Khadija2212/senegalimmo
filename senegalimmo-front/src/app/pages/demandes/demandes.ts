import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { DemandeLocationService } from '../../services/demande-location';
import { ContratService } from '../../services/contrat';

@Component({
  selector: 'app-demandes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './demandes.html',
  styleUrl: './demandes.css'
})
export class Demandes implements OnInit {
  demandes: any[] = [];
  user: any;
  isLoading = true;
  filtre = '';
  today = '';

  refusingId: number | null = null;
  motif = '';

  bailId: number | null = null;
  isSaving = false;
  bail = { date_debut: '', duree_mois: 12, loyer_mensuel: 0, caution: 0 };

  tabs = [
    { value: '', label: 'Toutes' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'acceptee', label: 'Acceptées' },
    { value: 'refusee', label: 'Refusées' },
    { value: 'annulee', label: 'Annulées' },
  ];

  constructor(
    private demandeService: DemandeLocationService,
    private contratService: ContratService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.authService.getCurrentUser();

    const d = new Date();
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
    return this.filtre ? this.demandes.filter((d) => d.statut === this.filtre) : this.demandes;
  }

  count(statut: string): number {
    return statut ? this.demandes.filter((d) => d.statut === statut).length : this.demandes.length;
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
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
    this.demandeService.getAll().subscribe({
      next: (data) => {
        this.demandes = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Impossible de charger les demandes', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  accepter(d: any) {
    this.demandeService.updateStatut(d.id, 'acceptee').subscribe({
      next: () => {
        this.snackBar.open('Demande acceptée. Vous pouvez maintenant créer le bail.', 'Fermer', { duration: 4000 });
        this.load();
      },
      error: (err) => this.snackBar.open(this.message(err, 'Action impossible'), 'Fermer', { duration: 4000 })
    });
  }

  startRefus(d: any) {
    this.refusingId = d.id;
    this.motif = '';
  }

  cancelRefus() {
    this.refusingId = null;
    this.motif = '';
  }

  confirmRefus(d: any) {
    if (!this.motif.trim()) {
      this.snackBar.open('Indiquez le motif du refus', 'Fermer', { duration: 3000 });
      return;
    }

    this.demandeService.updateStatut(d.id, 'refusee', this.motif.trim()).subscribe({
      next: () => {
        this.snackBar.open('Demande refusée', 'Fermer', { duration: 3000 });
        this.cancelRefus();
        this.load();
      },
      error: (err) => this.snackBar.open(this.message(err, 'Action impossible'), 'Fermer', { duration: 4000 })
    });
  }

  annuler(d: any) {
    if (!confirm('Annuler cette demande de location ?')) return;

    this.demandeService.updateStatut(d.id, 'annulee').subscribe({
      next: () => {
        this.snackBar.open('Demande annulée', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snackBar.open(this.message(err, 'Action impossible'), 'Fermer', { duration: 4000 })
    });
  }

  startBail(d: any) {
    const loyer = Number(d.bien?.prix ?? 0);
    this.bailId = d.id;
    this.bail = {
      date_debut: d.date_emmenagement ? String(d.date_emmenagement).substring(0, 10) : '',
      duree_mois: 12,
      loyer_mensuel: loyer,
      caution: loyer * 2,
    };
  }

  cancelBail() {
    this.bailId = null;
  }

  createBail(d: any) {
    if (!this.bail.date_debut) {
      this.snackBar.open('Indiquez la date de début du bail', 'Fermer', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    this.contratService.create({ demande_id: d.id, ...this.bail }).subscribe({
      next: () => {
        this.isSaving = false;
        this.bailId = null;
        this.snackBar.open('Bail créé. Il doit maintenant être signé par les deux parties.', 'Fermer', { duration: 5000 });
        this.load();
      },
      error: (err) => {
        this.isSaving = false;
        this.snackBar.open(this.message(err, 'Création du bail impossible'), 'Fermer', { duration: 5000 });
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