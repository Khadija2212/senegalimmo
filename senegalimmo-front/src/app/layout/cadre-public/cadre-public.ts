import { OVERLAY_DEFAULT_CONFIG } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EnTete } from '../en-tete/en-tete';
import { PiedDePage } from '../pied-de-page/pied-de-page';

/**
  Cadre des écrans refaits : en-tête bleu nuit, contenu, pied de page.
  Le réglage des fenêtres flottantes (listes, menus) est fourni ici plutôt qu'au démarrage,
  pour que le module overlay ne soit chargé qu'avec les écrans qui s'en servent.
*/
@Component({
  selector: 'si-cadre-public',
  imports: [RouterOutlet, EnTete, PiedDePage],
  providers: [{ provide: OVERLAY_DEFAULT_CONFIG, useValue: { usePopover: false } }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <si-en-tete />
    <div class="flex-1">
      <router-outlet />
    </div>
    <si-pied-de-page />
  `,
  host: { class: 'flex min-h-svh flex-col' },
})
export class CadrePublic {}
