import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { NotationService } from '../../services/notation';

@Component({
  selector: 'app-notations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './notations.html',
  styleUrl: './notations.css'
})
export class Notations implements OnInit {
  items: any[] = [];
  user: any;
  isLoading = true;
  saving: number | null = null;
  stars = [1, 2, 3, 4, 5];
  draft: Record<number, { note: number; commentaire: string }> = {};

  constructor(
    private notationService: NotationService,
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

  etoiles(n: number): string {
    const r = Math.round(n);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  load() {
    this.notationService.aFaire().subscribe({
      next: (data) => {
        this.items = data;
        data.forEach((i) => {
          if (!this.draft[i.bien_id]) {
            this.draft[i.bien_id] = { note: 0, commentaire: '' };
          }
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Impossible de charger vos transactions', 'Fermer', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  submit(item: any) {
    const d = this.draft[item.bien_id];

    if (!d || d.note < 1) {
      this.snackBar.open('Choisissez une note de 1 à 5 étoiles', 'Fermer', { duration: 3000 });
      return;
    }

    this.saving = item.bien_id;
    this.notationService.noter({
      bien_id: item.bien_id,
      note: d.note,
      commentaire: d.commentaire.trim() || null,
    }).subscribe({
      next: () => {
        this.saving = null;
        this.snackBar.open('Merci pour votre avis !', 'Fermer', { duration: 3000 });
        this.load();
      },
      error: (err) => {
        this.saving = null;
        const msg = err.error?.errors
          ? (Object.values(err.error.errors).flat() as string[]).join(' ')
          : err.error?.message || 'Envoi impossible';
        this.snackBar.open(msg, 'Fermer', { duration: 5000 });
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