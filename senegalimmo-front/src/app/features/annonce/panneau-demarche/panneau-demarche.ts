import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { fcfa } from '../../../core/format/fcfa';
import { AnnonceDetaillee } from '../../../core/modeles/annonce';
import { SelectionService } from '../../../core/services/selection';
import { CHEMIN_CONNEXION, versConnexion } from '../../../core/session/contexte-connexion';
import { SessionService } from '../../../core/session/session';
import { TEXTES_ANNONCE, TEXTES_DEMARCHE } from '../textes';
import { EnvoiDemarche } from './envoi';
import { OngletLocation } from './onglet-location';
import { OngletOffre } from './onglet-offre';
import { OngletVisite } from './onglet-visite';

const CHEMIN_MESSAGES = '/messages';

/** Panneau d'action de l'annonce : prix, onglets de démarche, Garder, Comparer, Écrire. */
@Component({
  selector: 'si-panneau-demarche',
  imports: [RouterLink, NgIcon, HlmTabsImports, OngletVisite, OngletLocation, OngletOffre],
  providers: [EnvoiDemarche],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panneau-demarche.html',
  host: {
    class:
      'block rounded-cadre border border-ciel bg-brume px-[18px] pt-[22px] pb-[18px] sm:px-[26px] sm:pt-[26px] sm:pb-[22px]',
  },
})
export class PanneauDemarche implements OnInit {
  readonly annonce = input.required<AnnonceDetaillee>();
  protected readonly textes = TEXTES_ANNONCE;
  protected readonly textesDemarche = TEXTES_DEMARCHE;
  protected readonly envoi = inject(EnvoiDemarche);
  protected readonly selection = inject(SelectionService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly location = computed(() => this.annonce().type_transaction === 'location');
  protected readonly prix = computed(() => fcfa(this.annonce().prix + this.annonce().charges));
  protected readonly sousPrix = computed(() =>
    this.location()
      ? this.textes.sousPrixLocation(fcfa(this.annonce().charges), fcfa(this.annonce().caution))
      : this.textes.sousPrixVente,
  );

  /** Onglet ouvert : celui de la saisie reprise après connexion, sinon la visite. */
  protected readonly ongletInitial = computed(() => this.envoi.repris()?.onglet ?? 'visite');

  ngOnInit(): void {
    this.envoi.lier(this.annonce());
  }

  protected garder(): void {
    if (!this.session.estClient()) {
      const { queryParams, state } = versConnexion(
        this.router.url,
        this.annonce(),
        this.textesDemarche.actionConnexion.garder,
      );
      this.router.navigate([CHEMIN_CONNEXION], { queryParams, state });
      return;
    }
    this.selection.basculerFavori(this.annonce().id).subscribe();
  }

  protected ecrire(): void {
    const a = this.annonce();
    const destinataire = a.agent ?? a.bien.proprietaire;
    this.router.navigate([CHEMIN_MESSAGES], {
      queryParams: { a: destinataire?.id, annonce: a.id },
    });
  }
}
