import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { RetraitService } from '../../../services/retrait';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-retraits-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './retraits-admin.html',
  styleUrls: ['./retraits-admin.css']
})
export class RetraitsAdmin implements OnInit {
  retraits: any[] = [];
  isLoading = true;
  message = '';
  error = '';

  constructor(
    private retraitService: RetraitService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const u = this.auth.getCurrentUser();
    if (!u || u.role !== 'administrateur') {
      this.router.navigate(['/login']);
      return;
    }
    this.loadRetraits();
  }

  loadRetraits(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.retraitService.getAll().subscribe({
      next: (data) => {
        this.retraits = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement des retraits.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  traiter(r: any, action: 'valider' | 'rejeter'): void {
    let motif: string | undefined = undefined;
    if (action === 'rejeter') {
      const input = prompt('Indiquez le motif du rejet :');
      if (!input) return;
      motif = input;
    } else {
      if (!confirm(`Confirmez-vous le virement de ${r.montant} FCFA à ${r.user?.prenom} ${r.user?.nom} ?`)) {
        return;
      }
    }

    this.message = '';
    this.error = '';

    this.retraitService.traiter(r.id, { action, motif }).subscribe({
      next: (res) => {
        this.message = res.message;
        r.statut = res.demande.statut;
        r.traitee_le = res.demande.traitee_le;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du traitement.';
        this.cdr.detectChanges();
      }
    });
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
