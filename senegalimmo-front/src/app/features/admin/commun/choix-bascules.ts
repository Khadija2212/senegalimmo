import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface Choix {
  valeur: string;
  libelle: string;
}

/** Groupe de bascules (.bascule) : filtre d'un registre ou choix exclusif d'un formulaire. */
@Component({
  selector: 'si-choix-bascules',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="border-input inline-flex max-w-full overflow-x-auto rounded-[10px] border"
      role="group"
      [attr.aria-label]="libelle()"
    >
      @for (c of choix(); track c.valeur; let premier = $first) {
        <button
          type="button"
          class="bascule shrink-0 whitespace-nowrap"
          [class.border-l]="!premier"
          [class.border-input]="!premier"
          [attr.aria-pressed]="c.valeur === valeur()"
          (click)="choisir.emit(c.valeur)"
        >
          {{ c.libelle }}
        </button>
      }
    </div>
  `,
  host: { class: 'block max-w-full' },
})
export class ChoixBascules {
  readonly choix = input.required<readonly Choix[]>();
  readonly valeur = input.required<string>();
  /** Nom du groupe, lu par les lecteurs d'écran. */
  readonly libelle = input.required<string>();
  readonly choisir = output<string>();
}
