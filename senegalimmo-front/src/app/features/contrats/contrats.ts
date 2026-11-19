import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { ContratsService } from '../../core/services/contrats';
import { ESPACE_PAR_ROLE } from '../../core/session/garde-role';
import { SessionService } from '../../core/session/session';
import { ordonner, resumeContrats, versLigne } from './contrats-vue';
import { LigneContrat } from './ligne-contrat';
import { LIENS_CONTRATS, TEXTES_CONTRATS } from './textes';
import { lire } from '../../core/ressources/lire';

const ESPACE_PAR_DEFAUT = '/espace';

/** Registre de tous les contrats du compte : baux, promesses de vente, mandats. */
@Component({
  selector: 'si-contrats',
  imports: [RouterLink, NgIcon, HlmButton, LigneContrat],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contrats.html',
  styleUrls: ['../../shared/espace/rubriques.css', '../../shared/espace/lien-texte.css'],
  host: { class: 'block' },
})
export class Contrats {
  protected readonly lire = lire;
  protected readonly textes = TEXTES_CONTRATS;
  private readonly session = inject(SessionService);
  private readonly service = inject(ContratsService);

  protected readonly donnees = rxResource({ stream: () => this.service.lister() });
  protected readonly lignes = computed(() => {
    const moi = this.session.compte()?.id ?? '';
    return ordonner((lire(this.donnees) ?? []).map((c) => versLigne(c, moi)));
  });
  protected readonly resume = computed(() => resumeContrats(this.lignes()));
  protected readonly principale = computed(() => this.lignes().find((l) => l.aSigner)?.id ?? null);
  protected readonly espace = computed(() => {
    const role = this.session.role();
    return role ? ESPACE_PAR_ROLE[role] : ESPACE_PAR_DEFAUT;
  });
  /** État vide adapté au rôle : le client cherche un bien, les autres retournent à leur espace. */
  protected readonly vide = computed(() => {
    const role = this.session.role();
    if (role === 'client') {
      return {
        texte: this.textes.videClient,
        lien: LIENS_CONTRATS.accueil,
        action: this.textes.chercherLogement,
      };
    }
    return {
      texte: role === 'agent' ? this.textes.videAgent : this.textes.videProprietaire,
      lien: this.espace(),
      action: this.textes.allerEspace,
    };
  });
}
