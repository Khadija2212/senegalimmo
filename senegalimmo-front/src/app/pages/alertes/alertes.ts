import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth';
import { AlerteService } from '../../services/alerte';

@Component({
  selector: 'app-alertes',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule],
  templateUrl: './alertes.html',
  styleUrl: './alertes.css'
})
export class Alertes implements OnInit {
  alertes: any[] = [];
  user: any;
  isLoading = true;

  constructor(
    private service: AlerteService,
    private authService: AuthService,
    private router: Router,
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

  load() {
    this.service.list().subscribe({
      next: (r) => {
        this.alertes = r.alertes;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ouvrir(a: any) {
    if (!a.lue) {
      this.service.lire(a.id).subscribe({ next: () => this.service.list().subscribe() });
      a.lue = true;
    }

    if (a.lien) {
      this.router.navigateByUrl(a.lien);
    }
  }

  toutLire() {
    this.service.lireTout().subscribe({ next: () => this.load() });
  }
}