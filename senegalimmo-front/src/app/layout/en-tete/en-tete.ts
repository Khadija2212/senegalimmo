import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { filter, map, startWith } from 'rxjs';
import { HlmButton } from '@spartan-ng/helm/button';
import { ESPACE_PAR_ROLE } from '../../core/session/garde-role';
import { SessionService } from '../../core/session/session';
import { CompteurNotifications } from '../../features/notifications/compteur-notifications';
import { Marque } from '../marque/marque';
import { LIENS, TEXTES_LAYOUT } from '../textes';

/** Premiers segments d'adresse qui appartiennent à « Mon espace ». */
const ESPACES = ['espace', 'proprietaire', 'agent', 'admin'];

@Component({
  selector: 'si-en-tete',
  imports: [RouterLink, NgIcon, HlmButton, Marque],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './en-tete.html',
  host: { class: 'sticky top-0 z-30 block bg-marine' },
})
export class EnTete {
  protected readonly textes = TEXTES_LAYOUT;
  protected readonly liens = LIENS;
  protected readonly menuOuvert = signal(false);
  protected readonly session = inject(SessionService);
  protected readonly compteur = inject(CompteurNotifications);
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: '/' },
  );
  /** Lien « Mon espace » selon le rôle du compte connecté. */
  protected readonly lienEspace = computed(() => {
    const role = this.session.role();
    return role ? ESPACE_PAR_ROLE[role] : null;
  });
  /** « Publier un bien » : pour les visiteurs et les propriétaires. */
  protected readonly montrerPublier = computed(() => {
    const role = this.session.role();
    return !role || role === 'proprietaire';
  });
  /** Onglet actif : seulement sur l'accueil, selon la transaction cherchée. */
  protected readonly actif = computed<'louer' | 'acheter' | 'espace' | null>(() => {
    const arbre = this.router.parseUrl(this.url());
    const segments = arbre.root.children['primary']?.segments ?? [];
    if (ESPACES.includes(segments[0]?.path ?? '')) return 'espace';
    if (segments.length) return null;
    return arbre.queryParamMap.get('transaction') === 'vente' ? 'acheter' : 'louer';
  });

  basculerMenu(): void {
    this.menuOuvert.update((o) => !o);
  }

  protected deconnecter(): void {
    this.menuOuvert.set(false);
    this.session.deconnecter().subscribe(() => this.router.navigateByUrl('/'));
  }
}
