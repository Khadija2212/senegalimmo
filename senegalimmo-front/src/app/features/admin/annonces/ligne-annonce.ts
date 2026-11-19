import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { FcfaPipe } from '../../../core/format/fcfa.pipe';
import { AnnonceModeration, DecisionModeration, StatutAnnonce } from '../../../core/modeles/admin';
import { dateCourte } from '../commun/dates';
import { TEXTES_ANNONCES } from './textes';

type Volet = 'rejeter' | 'suspendre' | null;

const COULEURS: Partial<Record<StatutAnnonce, string>> = {
  en_moderation: 'text-bleu-vif',
  publiee: 'text-succes',
  suspendue: 'text-refus',
  rejetee: 'text-refus',
};

/** Une annonce à modérer : photo, titre, propriétaire, prix, date, décisions écrites. */
@Component({
  selector: 'si-ligne-annonce',
  imports: [HlmButton, FcfaPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../../../shared/espace/lien-texte.css', '../../../shared/espace/confirmer.css'],
  template: `
    @let a = annonce();
    @if (photo(); as p) {
      <img [src]="p" alt="" class="size-16 rounded-champ object-cover sm:h-[72px] sm:w-24" />
    } @else {
      <span class="bg-brume size-16 rounded-champ sm:h-[72px] sm:w-24"></span>
    }

    <div class="min-w-0">
      <span class="text-encre-3 text-[0.78rem] font-semibold tracking-[0.06em] uppercase">
        {{ a.type_transaction === 'vente' ? textes.vente : textes.location }}, {{ a.reference }}
      </span>
      <h3 class="mt-1 text-[1.02rem] leading-snug font-semibold">{{ a.bien.titre }}</h3>
      <p class="text-encre-2 mt-1 text-[0.9rem] tabular-nums">
        <b class="text-foreground font-semibold">{{ a.prix | fcfa }}</b
        >{{ a.type_transaction === 'location' ? textes.parMois : '' }}, {{ a.bien.quartier }},
        {{ a.bien.ville }}
      </p>
      <p class="text-encre-2 mt-1 text-[0.88rem]">
        {{ proprietaire() }}
        @if (a.bien.proprietaire; as p) {
          <span [class]="p.identite_verifiee ? 'text-succes' : 'text-encre-3'"
            >,
            {{ p.identite_verifiee ? textes.identiteVerifiee : textes.identiteNonVerifiee }}</span
          >
        }
      </p>
      <p class="mt-2 text-[0.88rem]">
        <b class="font-semibold" [class]="couleur()">{{ textes.statuts[a.statut] }}</b>
        <span class="text-encre-2 block sm:ml-1.5 sm:inline">{{ depuis() }}</span>
      </p>
      @if (a.badge_verifie) {
        <p class="text-succes mt-1 text-[0.88rem] font-semibold">{{ textes.badgeAttribue }}</p>
      }
    </div>

    <div class="col-start-2 flex flex-col items-start gap-2 sm:col-start-auto sm:items-end">
      @if (a.statut === 'en_moderation' || a.statut === 'suspendue') {
        @if (principale()) {
          <button
            hlmBtn
            class="h-[42px] px-4 text-[0.9rem]"
            [disabled]="enCours()"
            (click)="decider.emit('approuver')"
          >
            {{ a.statut === 'suspendue' ? textes.republier : textes.approuver }}
          </button>
        } @else {
          <button
            type="button"
            class="lien-texte"
            [disabled]="enCours()"
            (click)="decider.emit('approuver')"
          >
            {{ a.statut === 'suspendue' ? textes.republier : textes.approuver }}
          </button>
        }
      }
      @if (a.statut === 'publiee' && !a.badge_verifie) {
        @if (a.bien.proprietaire?.identite_verifiee) {
          <button type="button" class="lien-texte" [disabled]="enCours()" (click)="badge.emit()">
            {{ textes.attribuerBadge }}
          </button>
        } @else {
          <p class="text-encre-3 max-w-[30ch] text-[0.82rem] sm:text-right">
            {{ textes.badgeImpossible }}
          </p>
        }
      }
      <div class="flex flex-wrap gap-4 sm:justify-end">
        @if (a.statut === 'en_moderation') {
          <button
            type="button"
            class="lien-texte danger"
            [attr.aria-expanded]="volet() === 'rejeter'"
            (click)="ouvrir('rejeter')"
          >
            {{ textes.rejeter }}
          </button>
        }
        @if (a.statut === 'en_moderation' || a.statut === 'publiee') {
          <button
            type="button"
            class="lien-texte danger"
            [attr.aria-expanded]="volet() === 'suspendre'"
            (click)="ouvrir('suspendre')"
          >
            {{ textes.suspendre }}
          </button>
        }
      </div>
    </div>

    @if (volet(); as v) {
      <div class="confirmer col-span-2 sm:col-start-2" role="alert">
        {{ v === 'rejeter' ? textes.confirmerRejet : textes.confirmerSuspension }}
        <button
          type="button"
          class="lien-texte text-alerte-texte"
          [disabled]="enCours()"
          (click)="decider.emit(v === 'rejeter' ? 'rejeter' : 'suspendre')"
        >
          {{ v === 'rejeter' ? textes.ouiRejeter : textes.ouiSuspendre }}
        </button>
        <button type="button" class="lien-texte text-alerte-texte" (click)="volet.set(null)">
          {{ textes.nonGarder }}
        </button>
      </div>
    }
    @if (erreur(); as e) {
      <p class="text-destructive col-span-2 text-[0.85rem] sm:col-start-2" role="alert">{{ e }}</p>
    }
  `,
  host: {
    class:
      'grid grid-cols-[64px_minmax(0,1fr)] items-start gap-3.5 border-b border-border py-[18px] sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:gap-[18px]',
  },
})
export class LigneAnnonce {
  readonly annonce = input.required<AnnonceModeration>();
  /** Seule la première annonce de la liste porte « Approuver » en bouton plein. */
  readonly principale = input(false);
  readonly enCours = input(false);
  readonly erreur = input<string | null>(null);
  readonly decider = output<DecisionModeration>();
  readonly badge = output<void>();

  protected readonly textes = TEXTES_ANNONCES;
  protected readonly volet = linkedSignal<AnnonceModeration, Volet>({
    source: this.annonce,
    computation: () => null,
  });
  protected readonly photo = computed(
    () => this.annonce().bien.medias.find((m) => m.type === 'photo')?.lien ?? null,
  );
  protected readonly couleur = computed(() => COULEURS[this.annonce().statut] ?? 'text-encre-3');
  protected readonly proprietaire = computed(() => {
    const p = this.annonce().bien.proprietaire;
    return p ? this.textes.par(p.prenom, p.nom) : this.textes.proprietaireInconnu;
  });
  protected readonly depuis = computed(() =>
    this.textes.depuis(dateCourte(this.annonce().updated_at)),
  );

  protected ouvrir(v: Volet): void {
    this.volet.update((actuel) => (actuel === v ? null : v));
  }
}
