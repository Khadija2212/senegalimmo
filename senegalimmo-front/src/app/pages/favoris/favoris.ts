import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FavoriService } from '../../services/favori';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-favoris',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './favoris.html',
  styleUrls: ['./favoris.css']
})
export class Favoris implements OnInit {
  favoris: any[] = [];
  isLoading = true;
  errorMessage = '';
  user: any = null;

  constructor(
    private favoriService: FavoriService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.user = this.auth.getCurrentUser();
    if (!this.user) {
      this.auth.getMe().subscribe({
        next: (res: any) => {
          this.user = res?.user ?? res;
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    }
    this.loadFavoris();
  }

  get dashboardLink(): string {
    return this.auth.getDashboardRoute(this.user?.role);
  }

  loadFavoris(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.favoriService.getFavoris().subscribe({
      next: (data) => {
        this.favoris = Array.isArray(data) ? data : [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }
        this.errorMessage = err?.error?.message || 'Impossible de charger vos biens favoris pour le moment.';
        this.cdr.detectChanges();
      }
    });
  }

  retirer(bien: any): void {
    this.favoriService.toggle(bien.id).subscribe({
      next: () => {
        this.favoris = this.favoris.filter(b => Number(b.id) !== Number(bien.id));
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Erreur lors de la suppression du favori.';
        this.cdr.detectChanges();
      }
    });
  }
}
