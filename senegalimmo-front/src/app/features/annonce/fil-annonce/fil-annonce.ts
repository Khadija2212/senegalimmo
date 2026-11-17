import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Annonce } from '../../../core/modeles/annonce';
import { TEXTES_ANNONCE } from '../textes';

/** Fil de lecture : Louer ou Acheter, puis la ville et le quartier. */
@Component({
  selector: 'si-fil-annonce',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      class="text-encre-3 flex flex-wrap gap-2 pt-[22px] pb-[18px] text-[0.88rem] max-sm:hidden"
      [attr.aria-label]="textes.filAriane"
    >
      <a
        class="text-encre-2 hover:text-foreground hover:underline"
        routerLink="/"
        [queryParams]="{ transaction: annonce().type_transaction }"
        >{{ action() }}</a
      >
      <span aria-hidden="true">/</span>
      <span>{{ annonce().bien.ville }}</span>
      <span aria-hidden="true">/</span>
      <span>{{ annonce().bien.quartier }}</span>
    </nav>
  `,
})
export class FilAnnonce {
  readonly annonce = input.required<Annonce>();
  protected readonly textes = TEXTES_ANNONCE;
  protected readonly action = computed(() =>
    this.annonce().type_transaction === 'vente' ? this.textes.acheter : this.textes.louer,
  );
}
