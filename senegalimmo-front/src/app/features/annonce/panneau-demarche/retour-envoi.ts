import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EnvoiDemarche } from './envoi';
import { TEXTES_DEMARCHE } from '../textes';

/** Message sous le bouton d'envoi : connexion requise, compte non client ou erreur de l'API. */
@Component({
  selector: 'si-retour-envoi',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (envoi.blocage()) {
      @case ('connexion') {
        <p class="text-foreground mt-3 text-sm" role="alert">
          {{ textes.connexionRequise }}
          <button
            type="button"
            class="text-bleu-vif font-semibold underline underline-offset-4"
            (click)="envoi.seConnecter()"
          >
            {{ textes.seConnecter }}
          </button>
        </p>
      }
      @case ('role') {
        <p class="text-foreground mt-3 text-sm" role="alert">{{ textes.reserveClients }}</p>
      }
    }
    @if (envoi.erreur(); as e) {
      <p class="text-destructive mt-3 text-sm" role="alert">{{ e }}</p>
    }
  `,
})
export class RetourEnvoi {
  protected readonly envoi = inject(EnvoiDemarche);
  protected readonly textes = TEXTES_DEMARCHE;
}
