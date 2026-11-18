import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { NgIcon } from '@ng-icons/core';
import { ContexteConnexion, retourSur } from '../../core/session/contexte-connexion';
import { SessionService } from '../../core/session/session';
import { Marque } from '../../layout/marque/marque';
import { FormulaireConnexion } from './formulaire-connexion';
import { FormulaireInscription } from './formulaire-inscription';
import { PromesseConnexion } from './promesse-connexion';
import { OngletConnexion, TEXTES_CONNEXION } from './textes';

const CHEMIN_ANNONCE = '/annonces/';

function lireContexte(): ContexteConnexion | null {
  const etat: unknown = history.state;
  if (typeof etat !== 'object' || etat === null || !('contexte' in etat)) return null;
  const c = (etat as { contexte: Partial<ContexteConnexion> }).contexte;
  return typeof c?.titre === 'string' && typeof c.action === 'string'
    ? (c as ContexteConnexion)
    : null;
}

/** Cas « S'authentifier » et « S'inscrire », sur un seul écran à deux onglets. */
@Component({
  selector: 'si-connexion',
  imports: [
    NgIcon,
    HlmTabsImports,
    Marque,
    PromesseConnexion,
    FormulaireConnexion,
    FormulaireInscription,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './connexion.html',
  host: { class: 'block min-h-svh bg-white' },
})
export class Connexion {
  /** Donnée de la route : /connexion ou /inscription. */
  readonly onglet = input<OngletConnexion>('connexion');
  /** Paramètre « retour » : la page à rouvrir une fois connecté. */
  readonly retour = input<string | null>(null);

  protected readonly textes = TEXTES_CONNEXION;
  protected readonly contexte = lireContexte();
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly destination = computed(() => retourSur(this.retour()));
  protected readonly versAnnonce = computed(() => this.destination().startsWith(CHEMIN_ANNONCE));
  protected readonly titre = computed(() => {
    if (this.onglet() === 'inscription') return this.textes.titreInscription;
    return this.contexte ? this.textes.titreEtape : this.textes.titreConnexion;
  });
  protected readonly chapeau = computed(() =>
    this.onglet() === 'inscription' ? this.textes.chapeauInscription : this.textes.chapeauConnexion,
  );

  constructor() {
    effect(() => {
      if (this.session.connecte()) this.rentrer();
    });
  }

  protected changerOnglet(onglet: string): void {
    if (onglet === this.onglet()) return;
    this.router.navigate([`/${onglet}`], {
      queryParamsHandling: 'preserve',
      replaceUrl: true,
      state: history.state,
    });
  }

  protected rentrer(): void {
    this.router.navigateByUrl(this.destination(), { replaceUrl: true });
  }
}
