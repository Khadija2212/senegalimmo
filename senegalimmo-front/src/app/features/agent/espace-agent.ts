import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { AgentService } from '../../core/services/agent';
import { NomIcone } from '../../shared/icones/icones';
import { SessionService } from '../../core/session/session';
import { pourcent, resumerAgent } from './agent-vue';
import { demandesClients } from './clients-vue';
import { RubriqueBiens } from './rubrique-biens';
import { RubriqueDemandes } from './rubrique-demandes';
import { RubriqueMandats } from './rubrique-mandats';
import { RubriquePerformances } from './rubrique-performances';
import { RubriqueVisites } from './rubrique-visites';
import { LIENS_AGENT, RubriqueAgent, TEXTES_AGENT } from './textes';
import { grouperVisites } from './visites-vue';

const RUBRIQUE_DEFAUT: RubriqueAgent = 'visites';

interface EntreeNav {
  cle: RubriqueAgent;
  icone: NomIcone;
  libelle: string;
  n: number | null;
}

/** Espace agent : visites, demandes clients, biens assignés, mandats, performances. */
@Component({
  selector: 'si-espace-agent',
  imports: [
    RouterLink,
    NgIcon,
    HlmButton,
    RubriqueVisites,
    RubriqueDemandes,
    RubriqueBiens,
    RubriqueMandats,
    RubriquePerformances,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './espace-agent.html',
  styleUrl: '../../shared/espace/rubriques.css',
  host: { class: 'block' },
})
export class EspaceAgent {
  /** Paramètre « rubrique » de l'adresse. */
  readonly rubrique = input<RubriqueAgent>(RUBRIQUE_DEFAUT);

  protected readonly textes = TEXTES_AGENT;
  protected readonly liens = LIENS_AGENT;
  protected readonly session = inject(SessionService);
  private readonly service = inject(AgentService);
  private readonly router = inject(Router);

  /** Le compte complet : un agent pas encore validé ne voit que le message d'attente. */
  protected readonly compte = rxResource({ stream: () => this.service.compte() });
  protected readonly valide = computed(() => this.compte.value()?.statut_validation === 'valide');
  protected readonly donnees = rxResource({
    params: () => (this.valide() ? true : undefined),
    stream: () => this.service.charger(),
  });

  protected readonly visites = computed(() => {
    const d = this.donnees.value();
    return d ? grouperVisites(d.visites) : null;
  });
  protected readonly demandes = computed(() => {
    const d = this.donnees.value();
    return d ? demandesClients(d.demandes, d.offres) : null;
  });
  protected readonly resume = computed(() => {
    const v = this.visites();
    const d = this.demandes();
    if (!v || !d) return '';
    const aConfirmer = v.aVenir.filter((l) => l.peutConfirmer).length;
    return resumerAgent(aConfirmer, v.sansCompteRendu.length, d.enAttente.length);
  });
  protected readonly indicateurs = computed(() => {
    const i = this.donnees.value()?.indicateurs;
    if (!i) return null;
    return [
      { valeur: String(i.biens_assignes), libelle: this.textes.biensAssignes },
      { valeur: String(i.visites_a_confirmer), libelle: this.textes.aConfirmer },
      { valeur: String(i.visites_confirmees), libelle: this.textes.confirmees },
      { valeur: pourcent(i.taux_conversion), libelle: this.textes.conversion },
    ];
  });
  /** Rubriques de la colonne, avec ce qui attend dans chacune. */
  protected readonly rubriquesNav = computed((): readonly EntreeNav[] => {
    const v = this.visites();
    const d = this.donnees.value();
    const t = this.textes;
    return [
      {
        cle: 'visites',
        icone: 'siCalendrier',
        libelle: t.rubriqueVisites,
        n: v ? v.aVenir.length + v.sansCompteRendu.length : 0,
      },
      {
        cle: 'demandes',
        icone: 'siCle',
        libelle: t.rubriqueDemandes,
        n: this.demandes()?.enAttente.length ?? 0,
      },
      { cle: 'biens', icone: 'siImmeuble', libelle: t.rubriqueBiens, n: d?.biens.length ?? 0 },
      { cle: 'mandats', icone: 'siSceau', libelle: t.rubriqueMandats, n: d?.mandats.length ?? 0 },
      { cle: 'performances', icone: 'siListe', libelle: t.rubriquePerformances, n: null },
    ];
  });
  protected readonly salut = computed(() =>
    this.textes.bonjour(this.compte.value()?.prenom ?? this.session.compte()?.prenom ?? ''),
  );

  protected choisir(r: RubriqueAgent): void {
    this.router.navigate([], {
      queryParams: { rubrique: r === RUBRIQUE_DEFAUT ? null : r },
      replaceUrl: true,
    });
  }

  protected recharger(): void {
    this.donnees.reload();
  }
}
