import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { fcfa } from '../../core/format/fcfa';
import { AgentService } from '../../core/services/agent';
import { pourcent } from './agent-vue';
import { LIENS_AGENT, TEXTES_AGENT } from './textes';

/** Cas « Consulter ses performances » : chiffres sobres, sans graphique. */
@Component({
  selector: 'si-rubrique-performances',
  imports: [RouterLink, HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../shared/espace/lien-texte.css',
  template: `
    <h2 class="font-display text-[1.55rem] leading-tight font-semibold">
      {{ textes.rubriquePerformances }}
    </h2>
    <p class="text-encre-2 mt-1.5 text-[0.92rem]">{{ textes.performancesIntro }}</p>

    @if (performances.isLoading() && !performances.value()) {
      <div class="mt-5 animate-pulse" aria-busy="true" [attr.aria-label]="textes.chargement">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="border-border flex justify-between border-b py-4">
            <div class="bg-brume h-4 w-40 rounded"></div>
            <div class="bg-brume h-4 w-16 rounded"></div>
          </div>
        }
      </div>
    } @else if (performances.error()) {
      <div class="border-input mt-5 rounded-cadre border border-dashed px-6 py-8" role="alert">
        <h3 class="font-display text-[1.4rem] font-semibold">{{ textes.erreurTitre }}</h3>
        <p class="text-encre-2 mt-1.5">{{ textes.erreurTexte }}</p>
        <button hlmBtn size="grand" class="mt-4 h-[46px]" (click)="performances.reload()">
          {{ textes.reessayer }}
        </button>
      </div>
    } @else if (lignes(); as ls) {
      <dl class="border-border mt-5 max-w-[640px] border-t">
        @for (l of ls; track l.terme) {
          <div
            class="border-border grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 border-b py-4"
          >
            <dt class="min-w-0 font-semibold">
              {{ l.terme }}
              @if (l.explication) {
                <span class="text-encre-2 block text-[0.85rem] font-normal">{{
                  l.explication
                }}</span>
              }
            </dt>
            <dd
              class="text-[1.5rem] leading-none font-bold tabular-nums [font-variation-settings:'wdth'_85]"
            >
              {{ l.valeur }}
            </dd>
          </div>
        }
      </dl>
      <a class="lien-texte mt-4 inline-block" [routerLink]="liens.portefeuille">{{
        textes.voirPortefeuille
      }}</a>
    }
  `,
  host: { class: 'block' },
})
export class RubriquePerformances {
  protected readonly textes = TEXTES_AGENT;
  protected readonly liens = LIENS_AGENT;
  private readonly service = inject(AgentService);
  protected readonly performances = rxResource({ stream: () => this.service.performances() });

  protected readonly lignes = computed(() => {
    const p = this.performances.value();
    if (!p) return null;
    const t = this.textes;
    return [
      {
        terme: t.tauxConversion,
        explication: t.tauxExplication,
        valeur: pourcent(p.taux_conversion),
      },
      { terme: t.visitesConfirmeesLong, explication: null, valeur: String(p.visites_confirmees) },
      { terme: t.visitesAConfirmerLong, explication: null, valeur: String(p.visites_a_confirmer) },
      { terme: t.biensAssignesLong, explication: null, valeur: String(p.biens_assignes) },
      { terme: t.mandatsEnSignature, explication: null, valeur: String(p.mandats_en_signature) },
      { terme: t.soldeDisponible, explication: null, valeur: fcfa(p.solde) },
    ];
  });
}
