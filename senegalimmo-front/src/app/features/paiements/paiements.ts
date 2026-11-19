import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { PaiementsService } from '../../core/services/paiements';
import { ESPACE_PAR_ROLE } from '../../core/session/garde-role';
import { SessionService } from '../../core/session/session';
import { BlocAPayer } from './bloc-a-payer';
import { LignePaiement } from './ligne-paiement';
import { preselectionner, sommesDues } from './paiements-vue';
import { LIENS_PAIEMENTS, TEXTES_PAIEMENTS } from './textes';

const ESPACE_PAR_DEFAUT = '/espace';

/** Historique des paiements et, pour le client, les sommes dues sur ses contrats signés. */
@Component({
  selector: 'si-paiements',
  imports: [RouterLink, NgIcon, HlmButton, BlocAPayer, LignePaiement],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './paiements.html',
  styleUrls: ['../../shared/espace/rubriques.css', '../../shared/espace/lien-texte.css'],
  host: { class: 'block' },
})
export class Paiements {
  /** Paramètres d'adresse posés par un contrat : loyer, caution ou indemnité, et le contrat. */
  readonly type = input<string>();
  readonly bail = input<string>();
  readonly promesse = input<string>();
  /** Mois du loyer (AAAA-MM), indicatif : le backend règle toujours le premier mois dû. */
  readonly mois = input<string>();

  protected readonly textes = TEXTES_PAIEMENTS;
  protected readonly cheminContrats = LIENS_PAIEMENTS.contrats;
  private readonly session = inject(SessionService);
  private readonly service = inject(PaiementsService);

  protected readonly role = this.session.role;
  protected readonly estClient = this.session.estClient;
  protected readonly historique = rxResource({ stream: () => this.service.lister() });
  protected readonly aPayer = rxResource({
    params: () => (this.estClient() ? true : undefined),
    stream: () => this.service.donneesAPayer(),
  });
  protected readonly dus = computed(() => {
    const d = this.aPayer.value();
    const h = this.historique.value();
    return d && h ? sommesDues(d, h) : [];
  });
  protected readonly preselection = computed(() =>
    preselectionner(this.dus(), {
      type: this.type(),
      bail: this.bail(),
      promesse: this.promesse(),
    }),
  );
  protected readonly espace = computed(() => {
    const role = this.role();
    return role ? ESPACE_PAR_ROLE[role] : ESPACE_PAR_DEFAUT;
  });
  protected readonly intro = computed(() =>
    this.estClient() ? this.textes.introClient : this.textes.introProprietaire,
  );

  protected recharger(): void {
    this.historique.reload();
    if (this.estClient()) this.aPayer.reload();
  }
}
