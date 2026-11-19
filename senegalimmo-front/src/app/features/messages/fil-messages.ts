import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
} from '@angular/core';
import { GroupeJour } from './jours';
import { BulleMessage } from './messagerie-vue';
import { TEXTES_MESSAGES } from './textes';

/** Fil d'une conversation : séparateur par jour, mes messages à droite, les autres à gauche. */
@Component({
  selector: 'si-fil-messages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../shared/espace/lien-texte.css',
  host: { class: 'block overflow-y-auto px-4 py-4 sm:px-6', role: 'log', 'aria-live': 'polite' },
  template: `
    @for (g of groupes(); track g.cle) {
      <section [attr.aria-label]="textes.messagesDu(g.libelle)">
        <h3
          class="text-encre-3 before:bg-border after:bg-border my-4 flex items-center gap-3 text-[0.78rem] font-semibold first-letter:uppercase before:h-px before:flex-1 after:h-px after:flex-1"
        >
          {{ g.libelle }}
        </h3>
        @for (m of g.elements; track m.id) {
          <div class="mb-3 flex flex-col" [class.items-end]="m.aMoi" [class.items-start]="!m.aMoi">
            <p
              class="rounded-champ max-w-[85%] px-3.5 py-2.5 text-[0.95rem] leading-relaxed break-words whitespace-pre-wrap sm:max-w-[72%]"
              [class.bg-brume]="m.aMoi"
              [class.border]="!m.aMoi"
              [class.border-border]="!m.aMoi"
            >
              {{ m.contenu }}
            </p>
            @if (m.pieceJointe) {
              <a
                class="lien-texte mt-1.5"
                [href]="m.pieceJointe"
                target="_blank"
                rel="noopener noreferrer"
                >{{ textes.pieceJointe }}</a
              >
            }
            <span class="text-encre-3 mt-1 text-[0.74rem] tabular-nums">
              @if (m.aMoi) {
                <span class="sr-only">{{ textes.moi }}, </span>
              }
              {{ m.heure }}
            </span>
          </div>
        }
      </section>
    } @empty {
      <p class="text-encre-2 py-10 text-center">{{ textes.filVide }}</p>
    }
  `,
})
export class FilMessages {
  readonly groupes = input.required<readonly GroupeJour<BulleMessage>[]>();

  protected readonly textes = TEXTES_MESSAGES;
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private dernierMessage: string | null = null;

  constructor() {
    afterRenderEffect(() => {
      const dernier = this.groupes().at(-1)?.elements.at(-1)?.id ?? null;
      if (dernier === this.dernierMessage) return;
      this.dernierMessage = dernier;
      const el = this.hote.nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }
}
