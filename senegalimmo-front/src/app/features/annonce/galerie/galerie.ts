import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { Media } from '../../../core/modeles/annonce';
import { TEXTES_ANNONCE } from '../textes';

const PHOTOS_EN_TETE = 3;

/** Photos du bien : une grande et deux petites, puis toutes sur demande. */
@Component({
  selector: 'si-galerie',
  imports: [NgIcon, HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      [attr.aria-label]="textes.photos"
      class="-mx-4 grid h-[280px] grid-cols-1 sm:mx-0 sm:h-[380px] sm:grid-cols-[2fr_1fr] sm:grid-rows-2 sm:gap-2.5 lg:h-[470px]"
    >
      @for (p of enTete(); track p.id; let i = $index) {
        <figure
          class="bg-glace relative m-0 overflow-hidden sm:rounded-media"
          [class]="i === 0 ? 'sm:row-span-2' : 'max-sm:hidden'"
        >
          <img
            [src]="p.lien"
            [alt]="textes.photo + ' ' + (i + 1) + ', ' + titre()"
            class="size-full object-cover"
            [attr.fetchpriority]="i === 0 ? 'high' : null"
          />
          @if (i === 0 && photos().length > 1) {
            <button
              hlmBtn
              variant="trait"
              size="lg"
              type="button"
              class="absolute right-3 bottom-3 bg-white px-4 shadow-[0_2px_8px_rgb(0_24_94/0.12)]"
              [attr.aria-expanded]="toutes()"
              (click)="toutes.set(!toutes())"
            >
              {{ toutes() ? textes.masquerPhotos : textes.voirPhotos(photos().length) }}
            </button>
          }
        </figure>
      } @empty {
        <div
          class="bg-glace text-ciel grid place-items-center sm:col-span-2 sm:row-span-2 sm:rounded-media"
        >
          <ng-icon name="siImmeuble" size="56" />
        </div>
      }
    </section>
    @if (toutes()) {
      <div class="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        @for (p of photos(); track p.id; let i = $index) {
          <img
            [src]="p.lien"
            [alt]="textes.photo + ' ' + (i + 1) + ', ' + titre()"
            loading="lazy"
            class="aspect-[4/3] w-full rounded-media object-cover"
          />
        }
      </div>
    }
  `,
})
export class Galerie {
  readonly medias = input.required<Media[]>();
  readonly titre = input.required<string>();
  protected readonly textes = TEXTES_ANNONCE;
  protected readonly toutes = signal(false);
  protected readonly photos = computed(() =>
    this.medias()
      .filter((m) => m.type === 'photo')
      .sort((a, b) => a.ordre - b.ordre),
  );
  protected readonly enTete = computed(() => this.photos().slice(0, PHOTOS_EN_TETE));
}
