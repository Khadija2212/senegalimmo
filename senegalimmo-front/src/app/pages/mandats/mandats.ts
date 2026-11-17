import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { AgenceService } from '../../services/agence';
import { BienService } from '../../services/bien';

@Component({
  selector: 'app-mandats',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './mandats.html',
  styleUrl: './mandats.css'
})
export class Mandats implements OnInit {
  mandats: any[] = [];
  user: any;
  isLoading = true;
  filtre = '';
  today = '';

  showForm = false;
  saving = false;
  biens: any[] = [];
  agences: any[] = [];
  agents: any[] = [];
  form: any = this.emptyForm();

  panel: { id: number; mode: 'refus' | 'agent' } | null = null;
  motif = '';
  agentChoice: number | null = null;

  tabs = [
    { value: '', label: 'Tous' },
    { value: 'propose', label: 'En attente' },
    { value: 'actif', label: 'Actifs' },
    { value: 'termine', label: 'Terminés' },
  ];

  constructor(
    private agenceService: AgenceService,
    private bienService: BienService,
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

  private emptyForm() {
    return { bien_id: null, agence_id: null, type: 'simple', commission_pct: 5, date_debut: '', date_fin: '' };
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

  get isAgence(): boolean {
    return this.user?.role === 'agent';
  }

  get canAssignAgent(): boolean {
    return false;
  }

  get dashboardLink(): string {
    return this.authService.getDashboardRoute(this.user?.role);
  }

  private matches(m: any, filtre: string): boolean {
    if (!filtre) return true;
    if (filtre === 'termine') return ['refuse', 'resilie', 'annule', 'expire'].includes(m.statut);
    return m.statut === filtre;
  }

  get filtered(): any[] {
    return this.mandats.filter((m) => this.matches(m, this.filtre));
  }

  count(filtre: string): number {
    return this.mandats.filter((m) => this.matches(m, filtre)).length;
  }

  statutLabel(statut: string): string {
    const labels: Record<string, string> = {
      propose: 'Proposé', actif: 'Actif', refuse: 'Refusé',
      resilie: 'Résilié', annule: 'Annulé', expire: 'Expiré',
    };
    return labels[statut] ?? statut;
  }

  badge(statut: string): string {
    const classes: Record<string, string> = {
      propose: 'lp-s-en_attente', actif: 'lp-s-signe', refuse: 'lp-s-refusee',
      resilie: 'lp-s-resilie', annule: 'lp-s-annulee', expire: 'lp-s-expire',
    };
    return classes[statut] ?? '';
  }

  private message(err: any, fallback: string): string {
    return err.error?.errors
      ? (Object.values(err.error.errors).flat() as string[]).join(' ')
      : err.error?.message || fallback;
  }

  load() {
    this.agenceService.mandats().subscribe({
      next: (data) => {
        this.mandats = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Impossible de charger les mandats', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });

    if (this.canAssignAgent) {
      this.agenceService.agents().subscribe({
        next: (a) => {
          this.agents = a.filter((x) => x.statut === 'actif');
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    }
  }

  /* ---------- Propriétaire : nouveau mandat ---------- */

  toggleForm() {
    this.showForm = !this.showForm;

    if (this.showForm) {
      this.form = this.emptyForm();

      this.bienService.getAll().subscribe({
        next: (data) => {
          this.biens = data.filter((b) => b.statut === 'disponible');
          this.cdr.detectChanges();
        },
        error: () => {}
      });

      this.agenceService.agences().subscribe({
        next: (data) => {
          this.agences = data;
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    }
  }

  createMandat() {
    const f = this.form;

    if (!f.bien_id || !f.agence_id || !f.date_debut || !f.date_fin) {
      this.snackBar.open('Remplissez tous les champs du mandat', 'Fermer', { duration: 3000 });
      return;
    }

    this.saving = true;
    this.agenceService.creerMandat({ ...f, commission_pct: Number(f.commission_pct) }).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.snackBar.open('Mandat envoyé à l\'agent immobilier', 'Fermer', { duration: 4000 });
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(this.message(err, 'Création impossible'), 'Fermer', { duration: 6000 });
        this.cdr.detectChanges();
      }
    });
  }

  /* ---------- Actions sur un mandat ---------- */

  act(m: any, action: string, confirmation?: string) {
    if (confirmation && !confirm(confirmation)) return;

    this.agenceService.actionMandat(m.id, { action }).subscribe({
      next: () => {
        this.snackBar.open('Mandat mis à jour', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snackBar.open(this.message(err, 'Action impossible'), 'Fermer', { duration: 5000 })
    });
  }

  openRefus(m: any) {
    this.panel = { id: m.id, mode: 'refus' };
    this.motif = '';
  }

  openAgent(m: any) {
    this.panel = { id: m.id, mode: 'agent' };
    this.agentChoice = m.agent_id ?? null;
  }

  closePanel() {
    this.panel = null;
  }

  confirmRefus(m: any) {
    if (!this.motif.trim()) {
      this.snackBar.open('Indiquez le motif du refus', 'Fermer', { duration: 3000 });
      return;
    }

    this.agenceService.actionMandat(m.id, { action: 'refuser', motif: this.motif.trim() }).subscribe({
      next: () => {
        this.panel = null;
        this.snackBar.open('Mandat refusé', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snackBar.open(this.message(err, 'Action impossible'), 'Fermer', { duration: 5000 })
    });
  }

  confirmAgent(m: any) {
    this.agenceService.assigner(m.id, this.agentChoice).subscribe({
      next: () => {
        this.panel = null;
        this.snackBar.open('Assignation enregistrée', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snackBar.open(this.message(err, 'Assignation impossible'), 'Fermer', { duration: 5000 })
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