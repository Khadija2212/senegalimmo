import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth';
import { PortefeuilleService } from '../../../services/portefeuille';

@Component({
  selector: 'app-retraits',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './retraits.html',
  styleUrl: './retraits.css'
})
export class Retraits implements OnInit {
  retraits: any[] = [];
  user: any;
  isLoading = true;
  statut = 'en_attente';

  panel: { id: number; mode: 'valider' | 'rejeter' } | null = null;
  motif = '';
  reference = '';
  fichier: File | null = null;
  saving = false;

  tabs = [
    { value: 'en_attente', label: 'En attente' },
    { value: 'validee', label: 'Effectués' },
    { value: 'rejetee', label: 'Rejetés' },
    { value: '', label: 'Toutes' },
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
    if (!this.authService.isLoggedIn() || this.user?.role !== 'administrateur') {
      this.router.navigate(['/login']);
      return;
    }
    this.load();
  }

  methodeLabel(m: string): string {
    const labels: Record<string, string> = { wave: 'Wave', orange_money: 'Orange Money', virement: 'Virement bancaire' };
    return labels[m] ?? m;
  }

  statutLabel(s: string): string {
    const labels: Record<string, string> = { en_attente: 'En attente', validee: 'Effectué', rejetee: 'Rejeté' };
    return labels[s] ?? s;
  }

  private message(err: any, fallback: string): string {
    return err.error?.errors
      ? (Object.values(err.error.errors).flat() as string[]).join(' ')
      : err.error?.message || fallback;
  }

  choisir(value: string) {
    this.statut = value;
    this.panel = null;
    this.load();
  }

  load() {
    this.service.adminRetraits(this.statut).subscribe({
      next: (data) => {
        this.retraits = data;
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

  open(r: any, mode: 'valider' | 'rejeter') {
    this.panel = { id: r.id, mode };
    this.motif = '';
    this.reference = '';
    this.fichier = null;
  }

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (file && file.size > 5 * 1024 * 1024) {
      this.snackBar.open('Le fichier dépasse 5 Mo', 'Fermer', { duration: 3000 });
      return;
    }

    this.fichier = file;
  }

  confirmer(r: any) {
    if (!this.panel) return;
    const rejet = this.panel.mode === 'rejeter';

    if (rejet && !this.motif.trim()) {
      this.snackBar.open('Indiquez le motif du rejet', 'Fermer', { duration: 3000 });
      return;
    }

    const formData = new FormData();
    formData.append('decision', rejet ? 'rejetee' : 'validee');
    if (rejet) {
      formData.append('motif', this.motif.trim());
    } else {
      if (this.reference.trim()) formData.append('reference', this.reference.trim());
      if (this.fichier) formData.append('preuve', this.fichier);
    }

    this.saving = true;
    this.service.traiter(r.id, formData).subscribe({
      next: () => {
        this.saving = false;
        this.panel = null;
        this.snackBar.open(rejet ? 'Demande rejetée, montant remboursé' : 'Retrait validé', 'Fermer', { duration: 4000 });
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(this.message(err, 'Traitement impossible'), 'Fermer', { duration: 6000 });
        this.cdr.detectChanges();
      }
    });
  }

  voirPreuve(r: any) {
    this.service.preuve(r.id).subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => this.snackBar.open('Preuve introuvable', 'Fermer', { duration: 3000 })
    });
  }
}