import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { AgenceService } from '../../services/agence';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './agents.html',
  styleUrl: './agents.css'
})
export class Agents implements OnInit {
  agents: any[] = [];
  user: any;
  isLoading = true;
  showForm = false;
  saving = false;
  form = { prenom: '', nom: '', email: '', telephone: '', password: '' };

  constructor(
    private agenceService: AgenceService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.authService.getCurrentUser();
  }

  ngOnInit() {
    if (!this.authService.isLoggedIn() || this.user?.role !== 'agence') {
      this.router.navigate(['/login']);
      return;
    }
    this.load();
  }

  load() {
    this.agenceService.agents().subscribe({
      next: (data) => {
        this.agents = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Impossible de charger les agents', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  create() {
    const f = this.form;

    if (!f.prenom.trim() || !f.nom.trim() || !f.email.trim() || !f.telephone.trim() || f.password.length < 6) {
      this.snackBar.open('Remplissez tous les champs (mot de passe : 6 caractères minimum)', 'Fermer', { duration: 4000 });
      return;
    }

    this.saving = true;
    this.agenceService.creerAgent(f).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.form = { prenom: '', nom: '', email: '', telephone: '', password: '' };
        this.snackBar.open('Agent créé. Communiquez-lui son e-mail et son mot de passe provisoire.', 'Fermer', { duration: 7000 });
        this.load();
      },
      error: (err) => {
        this.saving = false;
        const msg = err.error?.errors
          ? (Object.values(err.error.errors).flat() as string[]).join(' ')
          : err.error?.message || 'Création impossible';
        this.snackBar.open(msg, 'Fermer', { duration: 6000 });
        this.cdr.detectChanges();
      }
    });
  }

  toggle(agent: any) {
    const suspendre = agent.statut === 'actif';
    const question = suspendre
      ? `Suspendre ${agent.prenom} ${agent.nom} ? Ses biens seront désassignés.`
      : `Réactiver ${agent.prenom} ${agent.nom} ?`;

    if (!confirm(question)) return;

    this.agenceService.statutAgent(agent.id, suspendre ? 'suspendu' : 'actif').subscribe({
      next: () => {
        this.snackBar.open('Agent mis à jour', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Action impossible', 'Fermer', { duration: 4000 })
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