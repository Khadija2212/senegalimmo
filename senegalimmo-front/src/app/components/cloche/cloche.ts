import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth';
import { AlerteService } from '../../services/alerte';

@Component({
  selector: 'app-cloche',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cloche.html',
  styleUrl: './cloche.css'
})
export class Cloche implements OnInit, OnDestroy {
  visible = signal(false);
  private timer: any;
  private sub: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    public alertes: AlerteService
  ) {}

  ngOnInit() {
    this.actualiser();
    this.sub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.actualiser());
    this.timer = setInterval(() => this.actualiser(), 20000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
    this.sub?.unsubscribe();
  }

  private actualiser() {
    const connecte = this.authService.isLoggedIn();
    this.visible.set(connecte);

    if (connecte) {
      this.alertes.list().subscribe({ error: () => {} });
    } else {
      this.alertes.nonLues.set(0);
    }
  }
}