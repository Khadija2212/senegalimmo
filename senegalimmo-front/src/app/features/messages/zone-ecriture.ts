import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { TEXTES_MESSAGES } from './textes';

/** Limite fixée par le backend pour le contenu d'un message. */
export const LONGUEUR_MESSAGE_MAX = 5000;

/** Zone d'écriture : Entrée envoie, Maj et Entrée passe à la ligne. */
@Component({
  selector: 'si-zone-ecriture',
  imports: [HlmButton, HlmLabel, HlmTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block border-border border-t px-4 py-3 sm:px-6 sm:py-4' },
  template: `
    <form (submit)="soumettre($event)">
      <label hlmLabel for="m-texte" class="sr-only">{{ textes.votreMessage }}</label>
      <textarea
        hlmTextarea
        id="m-texte"
        rows="2"
        class="max-h-40 min-h-[52px] resize-none text-[0.95rem]"
        [placeholder]="textes.ecrire"
        [attr.maxlength]="longueurMax"
        [attr.aria-describedby]="erreur() ? 'm-erreur' : 'm-aide'"
        [value]="texte()"
        (input)="saisir($event)"
        (keydown)="touche($event)"
      ></textarea>
      <div class="mt-2.5 flex items-center justify-between gap-3">
        <p id="m-aide" class="text-encre-3 hidden text-[0.78rem] sm:block">{{ textes.aide }}</p>
        <button
          hlmBtn
          type="submit"
          class="ml-auto h-[42px] px-5"
          [disabled]="enCours() || !texte().trim()"
        >
          {{ enCours() ? textes.envoiEnCours : textes.envoyer }}
        </button>
      </div>
      @if (erreur(); as e) {
        <p id="m-erreur" role="alert" class="text-refus mt-2 text-[0.85rem]">{{ e }}</p>
      }
    </form>
  `,
})
export class ZoneEcriture {
  readonly enCours = input(false);
  readonly erreur = input<string | null>(null);
  /** Augmente à chaque envoi réussi : la zone se vide alors. */
  readonly envois = input(0);
  readonly envoyer = output<string>();

  protected readonly textes = TEXTES_MESSAGES;
  protected readonly longueurMax = LONGUEUR_MESSAGE_MAX;
  protected readonly texte = linkedSignal({ source: this.envois, computation: () => '' });

  protected saisir(e: Event): void {
    this.texte.set((e.target as HTMLTextAreaElement).value);
  }

  protected touche(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      this.soumettre(e);
    }
  }

  protected soumettre(e: Event): void {
    e.preventDefault();
    const contenu = this.texte().trim();
    if (contenu && !this.enCours()) this.envoyer.emit(contenu);
  }
}
