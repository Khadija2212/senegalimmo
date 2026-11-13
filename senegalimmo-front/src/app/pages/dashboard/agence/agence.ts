import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { StatsService } from '../../../services/stats';

@Component({
  selector: 'app-agence',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './agence.html',
  styleUrl: './agence.css'
})
export class Agence implements OnInit {
  user: any;
  stats: any = null;

  constructor(
    private authService: AuthService,
    private statsService: StatsService,
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