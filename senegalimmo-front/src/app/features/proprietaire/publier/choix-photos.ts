import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { PHOTO_ACCEPT, photoAcceptable } from './regles-vue';
import { TEXTES_PUBLIER } from './textes';

/** Troisième étape : les photos choisies, avec aperçu ; celles déjà envoyées ne se retirent plus. */
@Component({
  selector: 'si-choix-photos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/espace/lien-texte.css',
  host: { class: 'block' },
  template: `
    <p class="text-encre-2 text-[0.9rem]">{{ t.photosIntro }}</p>
    @if (apercus().length) {
      <ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        @for (p of apercus(); track p.url; let i = $index) {
          <li class="min-w-0">
            <img [src]="p.url" alt="" class="aspect-[4/3] w-full rounded-media object-cover" />
            <p class="mt-1.5 flex items-center justify-between gap-2 text-[0.8rem]">
              <span class="text-encre-3 truncate">{{ i === 0 ? t.premiere : p.nom }}</span>
              @if (i >= envoyees()) {
                <button type="button" class="lien-texte danger shrink-0" (click)="retirer(i)">
                  {{ t.retirer }}
                </button>
              }
            </p>
          </li>
        }
      </ul>
    } @else {
      <p class="text-encre-3 mt-3 text-[0.88rem]">{{ t.aucunePhoto }}</p>
    }
    <input
      id="p-fichiers"
      type="file"
      multiple
      class="peer sr-only"
      [accept]="accept"
      (change)="ajouter($any($event.target))"
    />
    <label
      for="p-fichiers"
      class="peer-focus-visible:outline-ring border-input peer-focus-visible:outline-2 hover:border-ring hover:text-bleu-vif mt-4 inline-flex h-11 cursor-pointer items-center rounded-[10px] border px-4 font-semibold"
      >{{ t.choisirPhotos }}</label
    >
    @for (r of refusees(); track r) {
      <p class="text-destructive mt-2 text-[0.82rem]" role="alert">{{ t.photoRefusee(r) }}</p>
    }
  `,
})
export class ChoixPhotos {
  readonly photos = model.required<readonly File[]>();
  /** Nombre de photos déjà parties sur le serveur, en tête de liste. */
  readonly envoyees = input(0);

  protected readonly t = TEXTES_PUBLIER;
  protected readonly accept = PHOTO_ACCEPT;
  protected readonly refusees = signal<readonly string[]>([]);
  private readonly liens = new Map<File, string>();
  protected readonly apercus = computed(() =>
    this.photos().map((f) => ({ nom: f.name, url: this.lienDe(f) })),
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.liens.forEach((url) => URL.revokeObjectURL(url)));
  }

  protected ajouter(champ: HTMLInputElement): void {
    const fichiers = Array.from(champ.files ?? []);
    this.refusees.set(fichiers.filter((f) => !photoAcceptable(f)).map((f) => f.name));
    this.photos.update((liste) => [...liste, ...fichiers.filter(photoAcceptable)]);
    champ.value = '';
  }

  protected retirer(index: number): void {
    const f = this.photos()[index];
    const url = this.liens.get(f);
    if (url) URL.revokeObjectURL(url);
    this.liens.delete(f);
    this.photos.update((liste) => liste.filter((_, i) => i !== index));
  }

  private lienDe(f: File): string {
    let url = this.liens.get(f);
    if (!url) {
      url = URL.createObjectURL(f);
      this.liens.set(f, url);
    }
    return url;
  }
}
