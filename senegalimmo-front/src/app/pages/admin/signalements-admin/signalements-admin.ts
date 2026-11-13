import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SignalementService } from '../../../services/signalement';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-signalements-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './signalements-admin.html',
  styleUrls: ['./signalements-admin.css']
})
export class SignalementsAdmin implements OnInit {
  signalements: any[] = [];
  isLoading = true;
  message = '';
  error = '';

  constructor(
    private signalementService: SignalementService,
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
    this.loadSignalements();
  }

  loadSignalements(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.signalementService.getAll().subscribe({
      next: (data) => {
        this.signalements = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement des signalements.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  traiter(s: any, statut: 'traite' | 'rejete'): void {
    const reponse = prompt(
      statut === 'traite'
        ? 'Indiquez la mesure prise (ex: annonce vérifiée, avertissement envoyé) :'
        : 'Indiquez le motif de classement sans suite :'
    );

    if (reponse === null) return;

    this.message = '';
    this.error = '';

    this.signalementService.traiter(s.id, { statut, reponse_admin: reponse }).subscribe({
      next: (res) => {
        this.message = res.message;
        s.statut = res.signalement.statut;
        s.reponse_admin = res.signalement.reponse_admin;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la mise à jour.';
      }
    });
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
