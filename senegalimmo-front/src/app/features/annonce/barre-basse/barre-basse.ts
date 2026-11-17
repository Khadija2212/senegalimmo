import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  afterNextRender,
  computed,
  input,
  signal,
} from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { fcfa } from '../../../core/format/fcfa';
import { Annonce } from '../../../core/modeles/annonce';
import { TEXTES_ANNONCE } from '../textes';

const ID_PANNEAU = 'panneau';

/**
 * Barre du bas sur téléphone : rappelle le prix et mène au panneau.
 * Elle se cache quand le panneau est à l'écran, pour ne jamais montrer deux boutons pleins.
 */
@Component({
  selector: 'si-barre-basse',
  imports: [HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!panneauVisible()) {
      <div
        class="bg-brume fixed inset-x-0 bottom-0 z-20 flex items-center gap-3.5 border-t border-ciel px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] sm:hidden"
      >
        <p class="text-[1.1rem] leading-tight font-bold tabular-nums">
          {{ prix()
          }}<small class="text-encre-3 block text-[0.78rem] font-normal">{{ sousPrix() }}</small>
        </p>
        <a
          hlmBtn
          size="grand"
          class="ml-auto h-[46px] px-[18px]"
          [href]="'#' + idPanneau"
          (click)="allerAuPanneau($event)"
          >{{ action() }}</a
        >
      </div>
    }
  `,
})
export class BarreBasse implements OnDestroy {
  readonly annonce = input.required<Annonce>();
  protected readonly textes = TEXTES_ANNONCE;
  protected readonly idPanneau = ID_PANNEAU;
  protected readonly panneauVisible = signal(false);
  private observateur: IntersectionObserver | null = null;

  private readonly location = computed(() => this.annonce().type_transaction === 'location');
  protected readonly prix = computed(() => fcfa(this.annonce().prix + this.annonce().charges));
  protected readonly sousPrix = computed(() =>
    this.location() ? this.textes.chargesComprises : this.textes.prixDemandeCourt,
  );
  protected readonly action = computed(() =>
    this.location() ? this.textes.demanderVisite : this.textes.visiterOuOffre,
  );

  constructor() {
    afterNextRender(() => {
      const panneau = document.getElementById(ID_PANNEAU);
      if (!panneau) return;
      this.observateur = new IntersectionObserver(([e]) =>
        this.panneauVisible.set(e.isIntersecting),
      );
      this.observateur.observe(panneau);
    });
  }

  protected allerAuPanneau(e: Event): void {
    e.preventDefault();
    document.getElementById(ID_PANNEAU)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  ngOnDestroy(): void {
    this.observateur?.disconnect();
  }
}
