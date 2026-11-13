import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ComparateurService } from '../../services/comparateur';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-comparateur',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './comparateur.html',
  styleUrls: ['./comparateur.css']
})
export class Comparateur implements OnInit {
  biens: any[] = [];
  user: any = null;

  constructor(
    private compService: ComparateurService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
    this.compService.biens$.subscribe((list) => {
      this.biens = list;
    });
  }

  get dashboardLink(): string {
    return this.auth.getDashboardRoute(this.user?.role);
  }

  retirer(id: number): void {
    this.compService.remove(id);
  }

  vider(): void {
    this.compService.clear();
  }
}
