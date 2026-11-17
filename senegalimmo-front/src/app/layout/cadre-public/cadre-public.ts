import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EnTete } from '../en-tete/en-tete';
import { PiedDePage } from '../pied-de-page/pied-de-page';

/** Cadre des écrans refaits : en-tête bleu nuit, contenu, pied de page. */
@Component({
  selector: 'si-cadre-public',
  imports: [RouterOutlet, EnTete, PiedDePage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <si-en-tete />
    <router-outlet />
    <si-pied-de-page />
  `,
})
export class CadrePublic {}
