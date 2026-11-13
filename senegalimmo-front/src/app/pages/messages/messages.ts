import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth';
import { MessageService } from '../../services/message';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatSnackBarModule],
  templateUrl: './messages.html',
  styleUrl: './messages.css'
})
export class Messages implements OnInit, OnDestroy {
  user: any;
  conversations: any[] = [];
  interlocuteur: any = null;
  thread: any[] = [];

  avec: number | null = null;
  bienId: number | null = null;
  texte = '';
  sending = false;
  private timer: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService,
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

    this.route.queryParamMap.subscribe((params) => {
      this.avec = Number(params.get('avec')) || null;
      this.bienId = Number(params.get('bien')) || null;
      this.thread = [];
      this.interlocuteur = null;

      this.loadConversations();
      if (this.avec) this.loadThread(true);
      this.cdr.detectChanges();
    });

    // Actualisation automatique toutes les 5 secondes
    this.timer = setInterval(() => {
      this.loadConversations();
      if (this.avec) this.loadThread(false);
    }, 5000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  get dashboardLink(): string {
    return this.authService.getDashboardRoute(this.user?.role);
  }

  isMine(m: any): boolean {
    return m.expediteur_id === this.user?.id;
  }

  roleLabel(role: string): string {
    const labels: Record<string, string> = {
      client: 'Client',
      proprietaire: 'Propriétaire',
      locataire: 'Locataire',
      acheteur: 'Acheteur',
      agence: 'Agent immobilier',
      agent: 'Agent immobilier',
      administrateur: 'Administrateur',
    };
    return labels[role] ?? role;
  }

  initiale(u: any): string {
    return (u?.prenom ?? '?').charAt(0).toUpperCase();
  }

  loadConversations() {
    this.messageService.conversations().subscribe({
      next: (data) => {
        this.conversations = data;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadThread(scroll: boolean) {
    if (!this.avec) return;

    this.messageService.thread(this.avec, this.bienId).subscribe({
      next: (res) => {
        const nouveaux = res.messages.length !== this.thread.length;
        this.interlocuteur = res.interlocuteur;
        this.thread = res.messages;
        this.cdr.detectChanges();
        if (scroll || nouveaux) this.scrollToEnd();
      },
      error: (err) => {
        if (err.status === 403) {
          this.snackBar.open('Conversation impossible avec cet utilisateur', 'Fermer', { duration: 4000 });
          this.router.navigate(['/messages']);
        }
      }
    });
  }

  private scrollToEnd() {
    setTimeout(() => document.getElementById('msg-end')?.scrollIntoView({ block: 'end' }), 0);
  }

  open(c: any) {
    this.router.navigate(['/messages'], { queryParams: { avec: c.interlocuteur.id } });
  }

  onEnter(event: Event) {
    const e = event as KeyboardEvent;
    if (!e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  send() {
    const contenu = this.texte.trim();
    if (!contenu || !this.avec || this.sending) return;

    this.sending = true;
    this.messageService.send({
      destinataire_id: this.avec,
      contenu,
      bien_id: this.thread.length === 0 ? this.bienId : null,
    }).subscribe({
      next: () => {
        this.sending = false;
        this.texte = '';
        this.loadThread(true);
        this.loadConversations();
      },
      error: (err) => {
        this.sending = false;
        const msg = err.error?.errors
          ? (Object.values(err.error.errors).flat() as string[]).join(' ')
          : err.error?.message || 'Envoi impossible';
        this.snackBar.open(msg, 'Fermer', { duration: 5000 });
        this.cdr.detectChanges();
      }
    });
  }
}