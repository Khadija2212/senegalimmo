import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TEXTES_ADMIN } from '../textes';

/** Pages d'un registre paginé par Laravel : précédente, suivante, position. */
@Component({
  selector: 'si-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/espace/lien-texte.css',
  template: `
    @if (derniere() > 1) {
      <nav
        class="text-encre-2 mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.88rem]"
        [attr.aria-label]="textes.pagination"
      >
        <button
          type="button"
          class="lien-texte"
          [disabled]="page() <= 1"
          (click)="changer.emit(page() - 1)"
        >
          {{ textes.pagePrecedente }}
        </button>
        <span class="tabular-nums" aria-live="polite">{{
          textes.pageSur(page(), derniere())
        }}</span>
        <button
          type="button"
          class="lien-texte"
          [disabled]="page() >= derniere()"
          (click)="changer.emit(page() + 1)"
        >
          {{ textes.pageSuivante }}
        </button>
      </nav>
    }
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly derniere = input.required<number>();
  readonly changer = output<number>();
  protected readonly textes = TEXTES_ADMIN;
}
