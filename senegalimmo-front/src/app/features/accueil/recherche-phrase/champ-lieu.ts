import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { HlmInput } from '@spartan-ng/helm/input';
import { LIEUX, Lieu, sansAccent } from '../donnees';
import { TEXTES_ACCUEIL } from '../textes';

const SUGGESTIONS_MAX = 6;
const DELAI_FERMETURE_MS = 150;
const LARGEUR_MIN = 4;

/** Champ « Quartier ou ville » avec suggestions, au clavier comme à la souris. */
@Component({
  selector: 'si-champ-lieu',
  imports: [HlmInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      hlmInput
      [id]="identifiant()"
      [size]="largeur()"
      class="w-auto font-display text-bleu h-auto rounded-none border-0 border-b-[1.5px] border-bleu-vif bg-transparent px-[3px] pb-[3px] text-[2.1rem] leading-tight font-semibold tabular-nums shadow-none hover:border-ring hover:text-bleu-vif focus-visible:ring-0 focus-visible:border-b-2 md:text-[2.1rem] max-sm:w-full max-sm:text-[1.55rem]"
      [value]="valeur()"
      role="combobox"
      autocomplete="off"
      aria-autocomplete="list"
      aria-controls="lieux"
      [attr.aria-expanded]="ouvert()"
      [attr.aria-activedescendant]="ouvert() ? 'lieu-' + actif() : null"
      (input)="saisir($any($event.target).value)"
      (focus)="ouvert.set(true)"
      (blur)="fermerBientot()"
      (keydown)="clavier($event)"
    />
    @if (ouvert() && suggestions().length) {
      <ul
        id="lieux"
        role="listbox"
        [attr.aria-label]="textes.quartiers"
        class="bg-popover absolute top-[calc(100%+10px)] left-0 z-30 min-w-[300px] max-sm:right-0 max-sm:min-w-0 rounded-champ border border-input p-1.5 text-[0.95rem] shadow-[0_16px_40px_rgb(0_24_94/0.18)]"
      >
        @for (l of suggestions(); track l.nom; let i = $index) {
          <li
            [id]="'lieu-' + i"
            role="option"
            [attr.aria-selected]="i === actif()"
            class="flex cursor-pointer items-baseline justify-between gap-4 rounded-md px-3 py-2.5 hover:bg-brume aria-selected:bg-brume"
            (mousedown)="$event.preventDefault(); choisir(l)"
          >
            <span>{{ l.nom }}</span
            ><small class="text-encre-3 text-[0.82rem]">{{ l.detail }}</small>
          </li>
        }
      </ul>
    }
  `,
  host: { class: 'relative inline-block max-sm:block' },
})
export class ChampLieu {
  readonly identifiant = input.required<string>();
  readonly valeur = input.required<string>();
  readonly choisi = output<Lieu>();
  readonly saisi = output<string>();

  protected readonly textes = TEXTES_ACCUEIL;
  protected readonly ouvert = signal(false);
  protected readonly actif = signal(0);
  private readonly texte = signal('');
  private readonly saisie = signal<string | null>(null);
  protected readonly largeur = computed(
    () => Math.max((this.saisie() ?? this.valeur()).length, LARGEUR_MIN) + 1,
  );

  protected readonly suggestions = computed(() => {
    const cle = sansAccent(this.texte());
    return LIEUX.filter(
      (l) => !cle || sansAccent(l.nom).includes(cle) || sansAccent(l.detail).includes(cle),
    ).slice(0, SUGGESTIONS_MAX);
  });

  protected saisir(texte: string): void {
    this.texte.set(texte);
    this.saisie.set(texte);
    this.actif.set(0);
    this.ouvert.set(true);
    this.saisi.emit(texte);
  }

  protected choisir(l: Lieu): void {
    this.texte.set('');
    this.saisie.set(null);
    this.ouvert.set(false);
    this.choisi.emit(l);
  }

  protected fermerBientot(): void {
    setTimeout(() => this.ouvert.set(false), DELAI_FERMETURE_MS);
  }

  protected clavier(e: KeyboardEvent): void {
    const n = this.suggestions().length;
    if (!this.ouvert() || !n) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.actif.update((i) => (i + (e.key === 'ArrowDown' ? 1 : -1) + n) % n);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.choisir(this.suggestions()[this.actif()]);
    } else if (e.key === 'Escape') {
      this.ouvert.set(false);
    }
  }
}
