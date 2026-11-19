import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { AgentService } from '../../core/services/agent';
import { DemandesClients, LigneClient as Ligne } from './clients-vue';
import { LigneClient } from './ligne-client';
import { SuiviActions } from './suivi-actions';
import { TEXTES_AGENT } from './textes';

/** Cas « Traiter demandes clients » : location et offres sur les biens gérés. */
@Component({
  selector: 'si-rubrique-demandes',
  imports: [NgIcon, LigneClient],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../shared/espace/rubriques.css',
  template: `
    @let d = demandes();
    <h2 class="font-display text-[1.55rem] leading-tight font-semibold">
      {{ textes.rubriqueDemandes }}
    </h2>
    <p class="text-encre-2 mt-1.5 text-[0.92rem]">{{ textes.demandesIntro }}</p>

    @if (!d.enAttente.length && !d.traitees.length) {
      <div class="vide">
        <ng-icon name="siContrat" size="32" class="text-bleu" />
        <div>
          <h3 class="font-display text-[1.4rem] leading-tight font-semibold">
            {{ textes.demandesVides }}
          </h3>
          <p class="text-encre-2 mt-1.5 max-w-[52ch]">{{ textes.demandesVidesTexte }}</p>
        </div>
      </div>
    }

    @if (d.enAttente.length) {
      <section class="mt-9" aria-labelledby="t-demandes-attente">
        <h3
          id="t-demandes-attente"
          class="font-display flex items-baseline gap-3 text-[1.35rem] leading-tight font-semibold"
        >
          {{ textes.enAttente }}
          <small class="text-encre-3 font-sans text-[0.85rem] font-medium">{{
            d.enAttente.length
          }}</small>
        </h3>
        <div class="border-border mt-3.5 border-t">
          @for (l of d.enAttente; track l.cle) {
            <si-ligne-client
              [ligne]="l"
              [principale]="l.cle === principale()"
              [enCours]="suivi.enCours() === l.cle"
              [erreur]="suivi.erreurs()[l.cle] ?? null"
              (accepter)="accepter(l)"
              (refuser)="refuser(l, $event)"
            />
          }
        </div>
      </section>
    }

    @if (d.traitees.length) {
      <details class="group mt-9">
        <summary
          class="border-border text-encre-2 flex cursor-pointer list-none items-center gap-2.5 border-t py-3 font-semibold"
        >
          <ng-icon name="siBas" size="18" class="transition-transform group-open:rotate-180" />{{
            textes.traitees
          }}
          <small class="text-encre-3 text-[0.85rem]">{{ d.traitees.length }}</small>
        </summary>
        <div class="border-border border-t opacity-85">
          @for (l of d.traitees; track l.cle) {
            <si-ligne-client [ligne]="l" />
          }
        </div>
      </details>
    }
  `,
  host: { class: 'block' },
})
export class RubriqueDemandes {
  readonly demandes = input.required<DemandesClients>();
  readonly modifie = output<void>();

  protected readonly textes = TEXTES_AGENT;
  protected readonly suivi = new SuiviActions(TEXTES_AGENT.erreurAction);
  private readonly service = inject(AgentService);
  protected readonly principale = computed(
    () => this.demandes().enAttente.find((l) => l.peutAccepter)?.cle ?? null,
  );

  protected accepter(l: Ligne): void {
    this.suivi.agir(l.cle, this.service.accepterDemande(l.id), () => this.modifie.emit());
  }

  protected refuser(l: Ligne, motif: string): void {
    const requete =
      l.genre === 'offre'
        ? this.service.refuserOffre(l.id, motif)
        : this.service.refuserDemande(l.id, motif);
    this.suivi.agir(l.cle, requete, () => this.modifie.emit());
  }
}
