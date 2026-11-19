import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { Notification } from '../../core/modeles/notifications';
import { messageErreur } from '../../core/services/demarches';
import { NotificationsService } from '../../core/services/notifications';
import { ESPACE_PAR_ROLE } from '../../core/session/garde-role';
import { SessionService } from '../../core/session/session';
import { CompteurNotifications } from './compteur-notifications';
import { LigneNotification, grouperNotifications } from './notifications-vue';
import { TEXTES_NOTIFICATIONS } from './textes';

const PREMIERE_PAGE = 1;

/** Notifications du compte connecté, en registre groupé par jour. Ouverte à tous les rôles. */
@Component({
  selector: 'si-notifications',
  imports: [RouterLink, NgIcon, HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notifications.html',
  styleUrls: [
    '../../shared/espace/rubriques.css',
    '../../shared/espace/lien-texte.css',
    '../../shared/espace/confirmer.css',
  ],
  host: { class: 'block' },
})
export class Notifications {
  protected readonly textes = TEXTES_NOTIFICATIONS;
  private readonly service = inject(NotificationsService);
  private readonly compteur = inject(CompteurNotifications);
  private readonly session = inject(SessionService);

  protected readonly premiere = rxResource({ stream: () => this.service.lister(PREMIERE_PAGE) });
  /** Pages plus anciennes chargées à la demande. */
  private readonly suite = signal<readonly Notification[]>([]);
  private readonly pageChargee = signal(PREMIERE_PAGE);
  protected readonly chargementSuite = signal(false);
  /** Marquées comme lues depuis l'ouverture de la page, sans relire la liste. */
  private readonly luesIci = signal<ReadonlySet<string>>(new Set());
  protected readonly enCours = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);

  private readonly reponse = computed(() =>
    this.premiere.hasValue() ? this.premiere.value() : undefined,
  );
  protected readonly groupes = computed(() => {
    const r = this.reponse();
    if (!r) return null;
    return grouperNotifications(
      [...r.notifications.data, ...this.suite()],
      this.luesIci(),
      this.session.role(),
      new Date(),
    );
  });
  protected readonly nonLues = computed(() =>
    Math.max(0, (this.reponse()?.non_lues ?? 0) - this.luesIci().size),
  );
  protected readonly resteAnciennes = computed(
    () => this.pageChargee() < (this.reponse()?.notifications.last_page ?? PREMIERE_PAGE),
  );
  protected readonly espace = computed(() => {
    const role = this.session.role();
    return role ? ESPACE_PAR_ROLE[role] : '/';
  });

  protected marquer(n: LigneNotification): void {
    if (n.lue) return;
    this.enCours.set(n.id);
    this.erreur.set(null);
    this.service.marquerLue(n.id).subscribe({
      next: () => {
        this.enCours.set(null);
        this.luesIci.update((s) => new Set([...s, n.id]));
        this.compteur.rafraichir();
      },
      error: (e: unknown) => this.echec(e),
    });
  }

  protected toutMarquer(): void {
    this.enCours.set('tout');
    this.erreur.set(null);
    this.service.toutLire().subscribe({
      next: () => {
        this.enCours.set(null);
        this.repartirDeZero();
        this.compteur.rafraichir();
      },
      error: (e: unknown) => this.echec(e),
    });
  }

  protected plusAnciennes(): void {
    const page = this.pageChargee() + 1;
    this.chargementSuite.set(true);
    this.service.lister(page).subscribe({
      next: (r) => {
        this.chargementSuite.set(false);
        this.pageChargee.set(page);
        this.suite.update((s) => [...s, ...r.notifications.data]);
      },
      error: (e: unknown) => {
        this.chargementSuite.set(false);
        this.erreur.set(messageErreur(e, this.textes.erreurAction));
      },
    });
  }

  protected reessayer(): void {
    this.repartirDeZero();
  }

  private repartirDeZero(): void {
    this.suite.set([]);
    this.pageChargee.set(PREMIERE_PAGE);
    this.luesIci.set(new Set());
    this.premiere.reload();
  }

  private echec(e: unknown): void {
    this.enCours.set(null);
    this.erreur.set(messageErreur(e, this.textes.erreurAction));
  }
}
