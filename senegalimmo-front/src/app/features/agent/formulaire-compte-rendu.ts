import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { NiveauInteret } from '../../core/modeles/agent';
import { TEXTES_AGENT } from './textes';

const LONGUEUR_MAX_CONTENU = 5000;
const NIVEAUX: readonly NiveauInteret[] = ['faible', 'moyen', 'fort'];

export interface SaisieCompteRendu {
  contenu: string;
  interet: NiveauInteret;
}

/** Cas « Créer compte-rendu de visite » : déroulement et intérêt du client. */
@Component({
  selector: 'si-formulaire-compte-rendu',
  imports: [HlmButton, HlmLabel, HlmTextarea, HlmToggleGroupImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../shared/espace/lien-texte.css',
  template: `
    <label
      hlmLabel
      [for]="ident() + '-cr'"
      class="text-encre-2 mb-2 block text-[0.8rem] font-semibold"
      >{{ textes.contenuCompteRendu }}</label
    >
    <textarea
      hlmTextarea
      [id]="ident() + '-cr'"
      rows="4"
      class="w-full bg-white"
      [attr.maxlength]="longueurMax"
      [placeholder]="textes.placeholderCompteRendu"
      [value]="contenu()"
      (input)="contenu.set($any($event.target).value)"
    ></textarea>

    <span
      [id]="ident() + '-interet'"
      class="text-encre-2 mt-3.5 mb-2 block text-[0.8rem] font-semibold"
      >{{ textes.interetClient }}</span
    >
    <hlm-toggle-group
      type="single"
      variant="case"
      [spacing]="1.5"
      [attr.aria-labelledby]="ident() + '-interet'"
      class="grid w-full max-w-[360px] grid-cols-3"
      [value]="interet()"
      (valueChange)="interet.set($any($event) ?? interet())"
    >
      @for (n of niveaux; track n) {
        <button hlmToggleGroupItem [value]="n" class="bg-white text-[0.85rem]">
          {{ textes.niveaux[n] }}
        </button>
      }
    </hlm-toggle-group>

    <div class="mt-4 flex flex-wrap items-center gap-4">
      <button
        hlmBtn
        size="grand"
        class="h-11"
        [disabled]="enCours() || !valide()"
        (click)="valider.emit({ contenu: contenu().trim(), interet: interet() })"
      >
        {{ enCours() ? textes.envoiEnCours : textes.enregistrerCompteRendu }}
      </button>
      <button type="button" class="lien-texte" (click)="fermer.emit()">{{ textes.fermer }}</button>
    </div>
  `,
  host: { class: 'block rounded-cadre border border-ciel bg-brume p-[18px]' },
})
export class FormulaireCompteRendu {
  readonly ident = input.required<string>();
  readonly enCours = input(false);
  readonly valider = output<SaisieCompteRendu>();
  readonly fermer = output<void>();

  protected readonly textes = TEXTES_AGENT;
  protected readonly niveaux = NIVEAUX;
  protected readonly longueurMax = LONGUEUR_MAX_CONTENU;
  protected readonly contenu = signal('');
  protected readonly interet = signal<NiveauInteret>('moyen');
  protected readonly valide = computed(() => this.contenu().trim().length > 0);
}
