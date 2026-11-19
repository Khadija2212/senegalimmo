import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { TEXTES_AGENT } from './textes';

const LONGUEUR_MAX_MOTIF = 1000;

/** Refus ou résiliation dans la ligne même : un motif obligatoire, puis la confirmation. */
@Component({
  selector: 'si-saisie-motif',
  imports: [HlmLabel, HlmTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../../shared/espace/lien-texte.css', '../../shared/espace/confirmer.css'],
  template: `
    @if (question()) {
      <p class="w-full">{{ question() }}</p>
    }
    <label hlmLabel [for]="ident() + '-motif'" class="block w-full text-[0.8rem] font-semibold">{{
      libelle()
    }}</label>
    <textarea
      hlmTextarea
      [id]="ident() + '-motif'"
      rows="2"
      class="w-full bg-white text-foreground"
      [attr.maxlength]="longueurMax"
      [placeholder]="exemple()"
      [value]="motif()"
      (input)="motif.set($any($event.target).value)"
    ></textarea>
    <button
      type="button"
      class="lien-texte text-alerte-texte"
      [disabled]="enCours() || !valide()"
      (click)="valider.emit(motif().trim())"
    >
      {{ enCours() ? textes.envoiEnCours : oui() }}
    </button>
    <button type="button" class="lien-texte text-alerte-texte" (click)="fermer.emit()">
      {{ non() }}
    </button>
  `,
  host: { class: 'confirmer', role: 'group' },
})
export class SaisieMotif {
  readonly ident = input.required<string>();
  readonly libelle = input.required<string>();
  readonly oui = input.required<string>();
  readonly non = input<string>(TEXTES_AGENT.nonGarder);
  readonly question = input<string | null>(null);
  readonly exemple = input<string>(TEXTES_AGENT.placeholderMotif);
  readonly enCours = input(false);
  readonly valider = output<string>();
  readonly fermer = output<void>();

  protected readonly textes = TEXTES_AGENT;
  protected readonly longueurMax = LONGUEUR_MAX_MOTIF;
  protected readonly motif = signal('');
  protected readonly valide = computed(() => this.motif().trim().length > 0);
}
