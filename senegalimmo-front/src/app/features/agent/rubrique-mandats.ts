import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { BienAssigne, Mandat } from '../../core/modeles/agent';
import { AgentService } from '../../core/services/agent';
import { LigneMandat } from './ligne-mandat';
import { LigneMandat as Ligne, lignesMandats } from './registres-vue';
import { SuiviActions } from './suivi-actions';
import { TEXTES_AGENT } from './textes';

/** Cas « Gérer les mandats » : registre, renouvellement et résiliation. */
@Component({
  selector: 'si-rubrique-mandats',
  imports: [NgIcon, LigneMandat],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../shared/espace/rubriques.css',
  template: `
    <h2 class="font-display text-[1.55rem] leading-tight font-semibold">
      {{ textes.rubriqueMandats }}
    </h2>
    <p class="text-encre-2 mt-1.5 text-[0.92rem]">{{ textes.mandatsIntro }}</p>

    @if (lignes().length) {
      <div class="border-border mt-5 border-t">
        @for (l of lignes(); track l.mandat.id) {
          <si-ligne-mandat
            [ligne]="l"
            [principale]="l.mandat.id === principale()"
            [enCours]="suivi.enCours() === l.mandat.id"
            [erreur]="suivi.erreurs()[l.mandat.id] ?? null"
            (renouveler)="renouveler(l, $event)"
            (resilier)="resilier(l, $event)"
          />
        }
      </div>
    } @else {
      <div class="vide">
        <ng-icon name="siSceau" size="32" class="text-bleu" />
        <div>
          <h3 class="font-display text-[1.4rem] leading-tight font-semibold">
            {{ textes.mandatsVides }}
          </h3>
          <p class="text-encre-2 mt-1.5 max-w-[52ch]">{{ textes.mandatsVidesTexte }}</p>
        </div>
      </div>
    }
  `,
  host: { class: 'block' },
})
export class RubriqueMandats {
  readonly mandats = input.required<readonly Mandat[]>();
  readonly biens = input.required<readonly BienAssigne[]>();
  readonly modifie = output<void>();

  protected readonly textes = TEXTES_AGENT;
  protected readonly suivi = new SuiviActions(TEXTES_AGENT.erreurAction);
  private readonly service = inject(AgentService);
  protected readonly lignes = computed(() => lignesMandats(this.mandats(), this.biens()));
  protected readonly principale = computed(
    () => this.lignes().find((l) => l.aSigner)?.mandat.id ?? null,
  );

  protected renouveler(l: Ligne, dureeMois: number): void {
    this.suivi.agir(l.mandat.id, this.service.renouvelerMandat(l.mandat.id, dureeMois), () =>
      this.modifie.emit(),
    );
  }

  protected resilier(l: Ligne, motif: string): void {
    this.suivi.agir(l.mandat.id, this.service.resilierMandat(l.mandat.id, motif), () =>
      this.modifie.emit(),
    );
  }
}
