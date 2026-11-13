import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth';
import { AdminService } from '../../../services/admin';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './utilisateurs.html',
  styleUrl: './utilisateurs.css'
})
export class Utilisateurs implements OnInit {
  users: any[] = [];
  user: any;
  isLoading = true;
  filtres = { role: '', statut: '', verification: '', q: '' };
  refusing: number | null = null;
  motif = '';

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.authService.getCurrentUser();
  }

  ngOnInit() {
    if (!this.authService.isLoggedIn() || this.user?.role !== 'administrateur') {
      this.router.navigate(['/login']);
      return;
    }
    this.load();
  }

  roleLabel(role: string): string {
    const labels: Record<string, string> = {
      client: 'Client', proprietaire: 'Propriétaire', locataire: 'Locataire', acheteur: 'Acheteur',
      agence: 'Agent immobilier', agent: 'Agent immobilier',
    };
    return labels[role] ?? role;
  }

  verificationLabel(v: string): string {
    const labels: Record<string, string> = {
      non_soumis: 'Aucun document', en_attente: 'À vérifier', verifie: 'Vérifié', refuse: 'Refusé',
    };
    return labels[v] ?? v;
  }

  private message(err: any, fallback: string): string {
    return err.error?.errors
      ? (Object.values(err.error.errors).flat() as string[]).join(' ')
      : err.error?.message || fallback;
  }

  load() {
    this.adminService.utilisateurs(this.filtres).subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Impossible de charger les utilisateurs', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  reset() {
    this.filtres = { role: '', statut: '', verification: '', q: '' };
    this.load();
  }

  toggleStatut(u: any) {
    const suspendre = u.statut === 'actif';
    const question = suspendre
      ? `Suspendre ${u.prenom} ${u.nom} ? Il sera déconnecté.`
      : `Réactiver ${u.prenom} ${u.nom} ?`;

    if (!confirm(question)) return;

    this.adminService.statut(u.id, suspendre ? 'suspendu' : 'actif').subscribe({
      next: () => {
        this.snackBar.open('Compte mis à jour', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snackBar.open(this.message(err, 'Action impossible'), 'Fermer', { duration: 5000 })
    });
  }

  valider(u: any) {
    this.adminService.verification(u.id, 'verifie').subscribe({
      next: () => {
        this.snackBar.open('Compte vérifié', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snackBar.open(this.message(err, 'Action impossible'), 'Fermer', { duration: 5000 })
    });
  }

  startRefus(u: any) {
    this.refusing = u.id;
    this.motif = '';
  }

  confirmRefus(u: any) {
    if (!this.motif.trim()) {
      this.snackBar.open('Indiquez le motif du refus', 'Fermer', { duration: 3000 });
      return;
    }

    this.adminService.verification(u.id, 'refuse', this.motif.trim()).subscribe({
      next: () => {
        this.refusing = null;
        this.snackBar.open('Vérification refusée', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snackBar.open(this.message(err, 'Action impossible'), 'Fermer', { duration: 5000 })
    });
  }

  voirDocument(u: any) {
    this.adminService.document(u.id).subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => this.snackBar.open('Document introuvable', 'Fermer', { duration: 3000 })
    });
  }
}