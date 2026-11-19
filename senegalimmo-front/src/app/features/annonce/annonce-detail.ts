import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { AnnoncesService } from '../../core/services/annonces';
import { SelectionService } from '../../core/services/selection';
import { BarreBasse } from './barre-basse/barre-basse';
import { CoutsAnnonce } from './couts-annonce/couts-annonce';
import { FilAnnonce } from './fil-annonce/fil-annonce';
import { FaitsBien } from './faits-bien/faits-bien';
import { Galerie } from './galerie/galerie';
import { Interlocuteurs } from './interlocuteurs/interlocuteurs';
import { LieuBien } from './lieu-bien/lieu-bien';
import { PanneauDemarche } from './panneau-demarche/panneau-demarche';
import { Signaler } from './signaler/signaler';
import { TitreAnnonce } from './titre-annonce/titre-annonce';
import { TEXTES_ANNONCE } from './textes';
import { lire } from '../../core/ressources/lire';

const NON_TROUVEE = 404;

/** Détail d'une annonce : cas « Consulter une annonce » et démarches du client. */
@Component({
  selector: 'si-annonce-detail',
  imports: [
    RouterLink,
    HlmButton,
    Galerie,
    FilAnnonce,
    TitreAnnonce,
    FaitsBien,
    CoutsAnnonce,
    LieuBien,
    Interlocuteurs,
    Signaler,
    PanneauDemarche,
    BarreBasse,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './annonce-detail.html',
})
export class AnnonceDetail {
  protected readonly lire = lire;
  /** Identifiant de la route /annonces/:id. */
  readonly id = input.required<string>();
  protected readonly textes = TEXTES_ANNONCE;
  private readonly service = inject(AnnoncesService);

  protected readonly annonce = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.service.consulter(params),
  });

  protected readonly introuvable = computed(() => {
    const e = this.annonce.error();
    return e instanceof HttpErrorResponse && e.status === NON_TROUVEE;
  });

  constructor() {
    inject(SelectionService).chargerFavoris();
  }
}
