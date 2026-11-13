import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { StatsService } from '../../../services/stats';
import { AdminUsersService } from '../../../services/admin-users';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  user: any;
  stats: any = null;
  exportSuccess = '';
  exportError = '';
  exporting = false;

  constructor(
    private authService: AuthService,
    private statsService: StatsService,
    private adminUsersService: AdminUsersService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.authService.getCurrentUser();
  }

  ngOnInit() {
    this.statsService.get().subscribe({
      next: (data) => {
        this.stats = data;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  exporterStatistiques(): void {
    this.exporting = true;
    this.exportSuccess = '';
    this.exportError = '';
    this.cdr.detectChanges();

    this.adminUsersService.exportStats().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_statistiques_${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exporting = false;
        this.exportSuccess = 'Rapport statistique PDF téléchargé avec succès.';
        this.cdr.detectChanges();
      },
      error: () => {
        this.exporting = false;
        this.exportError = 'Erreur lors de l\'export des statistiques.';
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
