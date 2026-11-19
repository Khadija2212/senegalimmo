import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LigneConversation } from './messagerie-vue';
import { LIENS_MESSAGES, TEXTES_MESSAGES } from './textes';

/** Liste des conversations, en registre : la personne, le bien, le dernier échange. */
@Component({
  selector: 'si-liste-conversations',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <nav [attr.aria-label]="textes.listeConversations">
      <ul>
        @for (l of lignes(); track l.id) {
          <li>
            <a
              [routerLink]="liens.messages"
              [queryParams]="{ conversation: l.id }"
              [attr.aria-current]="l.id === active() ? 'true' : null"
              class="border-border hover:bg-brume/50 aria-[current=true]:bg-brume grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 border-b px-4 py-3.5 aria-[current=true]:shadow-[inset_3px_0_0_var(--primary)]"
            >
              <span
                class="truncate"
                [class.font-semibold]="l.nonLus"
                [class.font-medium]="!l.nonLus"
                >{{ l.nom }}</span
              >
              <span class="text-encre-3 text-[0.78rem] tabular-nums">{{ l.quand }}</span>
              <span class="text-encre-3 col-span-2 truncate text-[0.82rem]">{{ l.contexte }}</span>
              <span
                class="truncate text-[0.88rem]"
                [class.text-encre-2]="!l.nonLus"
                [class.text-foreground]="l.nonLus"
                >{{ l.extrait }}</span
              >
              @if (l.nonLus) {
                <span
                  class="text-bleu-vif text-right text-[0.85rem] font-bold tabular-nums"
                  [attr.aria-label]="textes.nonLus(l.nonLus)"
                  >{{ l.nonLus }}</span
                >
              }
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class ListeConversations {
  readonly lignes = input.required<readonly LigneConversation[]>();
  readonly active = input<string | null>(null);

  protected readonly textes = TEXTES_MESSAGES;
  protected readonly liens = LIENS_MESSAGES;
}
