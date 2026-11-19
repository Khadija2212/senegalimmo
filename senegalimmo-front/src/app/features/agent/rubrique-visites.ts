import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { AgentService } from '../../core/services/agent';
import { SaisieCompteRendu } from './formulaire-compte-rendu';
import { LigneVisite } from './ligne-visite';
import { SuiviActions } from './suivi-actions';
import { telecharger } from './telecharger';
import { TEXTES_AGENT } from './textes';
import { GroupesVisites, LigneVisite as Ligne } from './visites-vue';

const NOM_PLANNING = 'planning.ics';

/** Cas « Gérer les visites » : confirmer, refuser, reprogrammer, compte rendu, planning. */
@Component({
  selector: 'si-rubrique-visites',
  imports: [NgIcon, HlmButton, LigneVisite],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rubrique-visites.html',
  styleUrls: ['../../shared/espace/rubriques.css', '../../shared/espace/lien-texte.css'],
  host: { class: 'block' },
})
export class RubriqueVisites {
  readonly visites = input.required<GroupesVisites>();
  readonly modifie = output<void>();
  /** Lien de l'état vide vers les biens assignés. */
  readonly voirBiens = output<void>();

  protected readonly textes = TEXTES_AGENT;
  protected readonly suivi = new SuiviActions(TEXTES_AGENT.erreurAction);
  protected readonly exportEnCours = signal(false);
  protected readonly erreurExport = signal(false);
  private readonly service = inject(AgentService);
  private readonly document = inject(DOCUMENT);

  /** Première ligne de chaque bloc qui porte une action : elle seule a le bouton plein. */
  protected readonly principales = computed(() => ({
    aVenir: this.visites().aVenir.find((l) => l.peutConfirmer)?.cle ?? null,
    sansCompteRendu: this.visites().sansCompteRendu[0]?.cle ?? null,
  }));
  protected readonly vide = computed(() => {
    const v = this.visites();
    return !v.aVenir.length && !v.sansCompteRendu.length && !v.historique.length;
  });

  protected confirmer(l: Ligne): void {
    this.suivi.agir(l.cle, this.service.confirmerVisite(l.id), () => this.modifie.emit());
  }

  protected refuser(l: Ligne, motif: string): void {
    this.suivi.agir(l.cle, this.service.refuserVisite(l.id, motif), () => this.modifie.emit());
  }

  protected reprogrammer(l: Ligne, dateHeure: string): void {
    this.suivi.agir(l.cle, this.service.reprogrammerVisite(l.id, dateHeure), () =>
      this.modifie.emit(),
    );
  }

  protected rediger(l: Ligne, s: SaisieCompteRendu): void {
    this.suivi.agir(l.cle, this.service.redigerCompteRendu(l.id, s.contenu, s.interet), () =>
      this.modifie.emit(),
    );
  }

  protected exporter(): void {
    this.exportEnCours.set(true);
    this.erreurExport.set(false);
    this.service.planning().subscribe({
      next: (ics) => {
        this.exportEnCours.set(false);
        telecharger(this.document, ics, NOM_PLANNING);
      },
      error: () => {
        this.exportEnCours.set(false);
        this.erreurExport.set(true);
      },
    });
  }
}
