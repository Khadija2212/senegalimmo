import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { CompteAdmin } from '../../../core/modeles/admin';
import { dateCourte } from '../commun/dates';
import { COULEURS, agentEnAttente, etatCompte, etatProfil, identiteAVerifier } from './comptes-vue';
import { TEXTES_COMPTES } from './textes';

type Volet = 'refuser' | 'suspendre' | null;

/** Un compte en registre : identité, rôle, statut en mot coloré, actions écrites. */
@Component({
  selector: 'si-ligne-compte',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../../../shared/espace/lien-texte.css', '../../../shared/espace/confirmer.css'],
  template: `
    @let c = compte();
    <div class="min-w-0">
      <span class="text-encre-3 text-[0.78rem] font-semibold tracking-[0.06em] uppercase">
        {{ textes.roles[c.role] }}
      </span>
      <h3 class="mt-1 text-[1.02rem] leading-snug font-semibold">{{ nom() }}</h3>
      <p class="text-encre-2 mt-1 text-[0.9rem] break-words">
        {{ coordonnees() }}
      </p>
      @if (c.agence || c.numero_carte_professionnelle) {
        <p class="text-encre-2 mt-0.5 text-[0.88rem]">{{ details() }}</p>
      }
      <p class="mt-2 text-[0.88rem]">
        <b class="font-semibold" [class]="couleurs[etat().ton]">{{ etat().libelle }}</b>
        @if (profil(); as p) {
          <span class="ml-1.5 font-semibold" [class]="couleurs[p.ton]">{{ p.libelle }}</span>
        }
      </p>
    </div>

    <div class="flex flex-wrap items-start gap-x-4 gap-y-2 sm:max-w-[260px] sm:justify-end">
      @if (enAttente()) {
        <button
          type="button"
          class="lien-texte"
          [disabled]="enCours()"
          (click)="valider.emit(true)"
        >
          {{ textes.valider }}
        </button>
        <button
          type="button"
          class="lien-texte danger"
          [attr.aria-expanded]="volet() === 'refuser'"
          (click)="ouvrir('refuser')"
        >
          {{ textes.refuser }}
        </button>
      }
      @if (c.role === 'proprietaire') {
        <button type="button" class="lien-texte" (click)="voirPiece.emit()">
          {{ textes.voirPiece }}
        </button>
        @if (aVerifier()) {
          <button
            type="button"
            class="lien-texte"
            [disabled]="enCours() || !pieceVue()"
            [attr.aria-describedby]="pieceVue() ? null : 'note-' + c.id"
            (click)="verifier.emit()"
          >
            {{ textes.verifier }}
          </button>
        }
      }
      @if (c.statut === 'actif') {
        <button
          type="button"
          class="lien-texte danger"
          [attr.aria-expanded]="volet() === 'suspendre'"
          (click)="ouvrir('suspendre')"
        >
          {{ textes.suspendre }}
        </button>
      } @else if (c.statut === 'suspendu') {
        <button type="button" class="lien-texte" [disabled]="enCours()" (click)="reactiver.emit()">
          {{ textes.reactiver }}
        </button>
      }
      @if (aVerifier() && !pieceVue()) {
        <p [id]="'note-' + c.id" class="text-encre-3 w-full text-[0.8rem] sm:text-right">
          {{ textes.noteVerifier }}
        </p>
      }
    </div>

    @if (volet(); as v) {
      <div class="confirmer sm:col-span-2" role="alert">
        {{ v === 'refuser' ? textes.confirmerRefus : textes.confirmerSuspension(nom()) }}
        <button
          type="button"
          class="lien-texte text-alerte-texte"
          [disabled]="enCours()"
          (click)="v === 'refuser' ? valider.emit(false) : suspendre.emit()"
        >
          {{ v === 'refuser' ? textes.ouiRefuser : textes.ouiSuspendre }}
        </button>
        <button type="button" class="lien-texte text-alerte-texte" (click)="volet.set(null)">
          {{ textes.nonGarder }}
        </button>
      </div>
    }
    @if (erreur(); as e) {
      <p class="text-destructive text-[0.85rem] sm:col-span-2" role="alert">{{ e }}</p>
    }
  `,
  host: {
    class:
      'grid grid-cols-1 items-start gap-3 border-b border-border py-[18px] sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-[18px]',
  },
})
export class LigneCompte {
  readonly compte = input.required<CompteAdmin>();
  readonly enCours = input(false);
  readonly erreur = input<string | null>(null);
  /** La pièce d'identité a été ouverte : la vérification devient possible. */
  readonly pieceVue = input(false);
  readonly valider = output<boolean>();
  readonly suspendre = output<void>();
  readonly reactiver = output<void>();
  readonly voirPiece = output<void>();
  readonly verifier = output<void>();

  protected readonly textes = TEXTES_COMPTES;
  protected readonly couleurs = COULEURS;
  protected readonly volet = linkedSignal<CompteAdmin, Volet>({
    source: this.compte,
    computation: () => null,
  });
  protected readonly nom = computed(() => `${this.compte().prenom} ${this.compte().nom}`);
  protected readonly coordonnees = computed(() => {
    const c = this.compte();
    const inscrit = this.textes.inscritLe(dateCourte(c.created_at));
    return [c.email, c.telephone, inscrit].filter((x) => !!x).join(', ');
  });
  protected readonly details = computed(() => {
    const c = this.compte();
    return [
      c.agence ? this.textes.agence(c.agence) : null,
      c.numero_carte_professionnelle ? this.textes.carte(c.numero_carte_professionnelle) : null,
    ]
      .filter((x) => x !== null)
      .join(', ');
  });
  protected readonly etat = computed(() => etatCompte(this.compte()));
  protected readonly profil = computed(() => etatProfil(this.compte()));
  protected readonly enAttente = computed(() => agentEnAttente(this.compte()));
  protected readonly aVerifier = computed(() => identiteAVerifier(this.compte()));

  protected ouvrir(v: Volet): void {
    this.volet.update((actuel) => (actuel === v ? null : v));
  }
}
