import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { FcfaPipe } from '../../core/format/fcfa.pipe';
import { ProprietaireService } from '../../core/services/proprietaire';
import { SessionService } from '../../core/session/session';
import { RubriqueAgents } from './agents/rubrique-agents';
import { RubriqueBiens } from './biens/rubrique-biens';
import { LIENS_PROPRIETAIRE, RubriqueProprietaire, TEXTES_PROPRIETAIRE } from './textes';
import { RubriqueTraiter } from './traiter/rubrique-traiter';
import { nombreATraiter, resumerIndicateurs } from './traiter/requetes-vue';

const RUBRIQUES: readonly RubriqueProprietaire[] = ['traiter', 'biens', 'agents'];

/** Espace propriétaire : demandes à traiter, biens et annonces, agents et mandats. */
@Component({
  selector: 'si-espace-proprietaire',
  imports: [RouterLink, NgIcon, FcfaPipe, RubriqueTraiter, RubriqueBiens, RubriqueAgents],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './espace-proprietaire.html',
  styleUrl: '../../shared/espace/rubriques.css',
  host: { class: 'block' },
})
export class EspaceProprietaire {
  /** Paramètre « rubrique » de l'adresse : traiter, biens ou agents. */
  readonly rubrique = input<string | undefined>('traiter');
  /** Paramètre « publie » de l'adresse, posé au retour de la page de publication. */
  readonly publie = input<string | undefined>(undefined);

  protected readonly textes = TEXTES_PROPRIETAIRE;
  protected readonly liens = LIENS_PROPRIETAIRE;
  protected readonly session = inject(SessionService);
  private readonly service = inject(ProprietaireService);
  private readonly router = inject(Router);

  protected readonly indicateurs = rxResource({ stream: () => this.service.indicateurs() });
  protected readonly ind = computed(() =>
    this.indicateurs.hasValue() ? this.indicateurs.value() : null,
  );
  protected readonly active = computed<RubriqueProprietaire>(() => {
    const r = this.rubrique();
    return RUBRIQUES.find((x) => x === r) ?? 'traiter';
  });
  protected readonly aTraiter = computed(() => {
    const i = this.ind();
    return i ? nombreATraiter(i) : 0;
  });
  protected readonly neuf = computed(() => this.ind()?.biens === 0);
  protected readonly salut = computed(() => {
    const prenom = this.session.compte()?.prenom ?? '';
    return this.neuf() ? this.textes.bienvenue(prenom) : this.textes.bonjour(prenom);
  });
  protected readonly resume = computed(() => {
    const i = this.ind();
    if (!i) return '';
    return this.neuf() ? this.textes.compteNeuf : resumerIndicateurs(i);
  });

  protected choisir(r: RubriqueProprietaire): void {
    this.router.navigate([], {
      queryParams: { rubrique: r === 'traiter' ? null : r },
      replaceUrl: true,
    });
  }
}
