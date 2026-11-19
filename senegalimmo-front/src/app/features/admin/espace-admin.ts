import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { fcfaCourt } from '../../core/format/fcfa';
import { AdminService } from '../../core/services/admin';
import { NomIcone } from '../../shared/icones/icones';
import {
  INDICATEURS_MONTANT,
  Rubrique,
  compteurRubrique,
  indicateursVisibles,
  resumerTravail,
  rubriqueActive,
  rubriquesPermises,
} from './admin-vue';
import { AnnoncesAModerer } from './annonces/annonces-a-moderer';
import { Commissions } from './commissions/commissions';
import { Comptes } from './comptes/comptes';
import { EnvoyerNotification } from './notification/envoyer-notification';
import { OptionsPremium } from './options/options-premium';
import { Retraits } from './retraits/retraits';
import { Signalements } from './signalements/signalements';
import { TEXTES_ADMIN } from './textes';
import { Transactions } from './transactions/transactions';

const ICONES: Readonly<Record<Rubrique, NomIcone>> = {
  annonces: 'siSceau',
  comptes: 'siCompte',
  signalements: 'siSignaler',
  notification: 'siMessage',
  retraits: 'siMobile',
  transactions: 'siListe',
  commissions: 'siReglages',
  options: 'siHaut',
};

/** Espace d'administration : le travail en attente, rubrique par rubrique, selon le niveau. */
@Component({
  selector: 'si-espace-admin',
  imports: [
    NgIcon,
    HlmButton,
    AnnoncesAModerer,
    Comptes,
    Signalements,
    EnvoyerNotification,
    Retraits,
    Transactions,
    Commissions,
    OptionsPremium,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './espace-admin.html',
  styleUrl: '../../shared/espace/rubriques.css',
  host: { class: 'block' },
})
export class EspaceAdmin {
  /** Paramètre « rubrique » de l'adresse ; une rubrique hors du niveau ramène à la première permise. */
  readonly rubrique = input<string>();

  protected readonly textes = TEXTES_ADMIN;
  protected readonly icones = ICONES;
  private readonly service = inject(AdminService);
  private readonly router = inject(Router);

  protected readonly accueil = rxResource({ stream: () => this.service.accueil() });

  protected readonly niveau = computed(() => this.accueil.value()?.moi.niveau ?? null);
  protected readonly permises = computed(() => {
    const n = this.niveau();
    return n ? rubriquesPermises(n) : [];
  });
  protected readonly active = computed(() => {
    const n = this.niveau();
    return n ? rubriqueActive(this.rubrique(), n) : null;
  });
  protected readonly resume = computed(() => {
    const a = this.accueil.value();
    if (!a) return '';
    return resumerTravail(a.indicateurs, a.moi.niveau) || this.textes.rienEnAttente;
  });
  protected readonly chiffres = computed(() => {
    const a = this.accueil.value();
    if (!a) return [];
    return indicateursVisibles(a.moi.niveau).map((cle) => ({
      cle,
      libelle: this.textes.indicateurs[cle],
      valeur: INDICATEURS_MONTANT.includes(cle)
        ? fcfaCourt(a.indicateurs[cle])
        : String(a.indicateurs[cle]),
    }));
  });

  protected compteur(r: Rubrique): number | null {
    const a = this.accueil.value();
    return a ? compteurRubrique(r, a.indicateurs) : null;
  }

  protected choisir(r: Rubrique): void {
    this.router.navigate([], {
      queryParams: { rubrique: r === this.permises()[0] ? null : r },
      replaceUrl: true,
    });
  }

  /** Une décision prise dans une rubrique change les compteurs de l'en-tête. */
  protected rafraichir(): void {
    this.accueil.reload();
  }
}
