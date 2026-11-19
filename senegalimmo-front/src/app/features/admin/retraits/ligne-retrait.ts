import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { fcfa } from '../../../core/format/fcfa';
import { RetraitAdmin, StatutRetrait } from '../../../core/modeles/admin';
import { dateCourte } from '../commun/dates';
import { TEXTES_RETRAITS } from './textes';

type Volet = 'approuver' | 'rejeter' | null;

const COULEURS: Readonly<Record<StatutRetrait, string>> = {
  demande: 'text-bleu-vif',
  approuve: 'text-bleu-vif',
  verse: 'text-succes',
  rejete: 'text-refus',
};

/** Un retrait : bénéficiaire, montant, méthode, numéro, puis décision. */
@Component({
  selector: 'si-ligne-retrait',
  imports: [HlmButton, HlmLabel, HlmTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../../../shared/espace/lien-texte.css', '../../../shared/espace/confirmer.css'],
  template: `
    @let r = retrait();
    <div class="min-w-0">
      <span class="text-encre-3 text-[0.78rem] font-semibold tracking-[0.06em] uppercase">
        {{ demandeLe() }}
      </span>
      <h3 class="mt-1 text-[1.02rem] leading-snug font-semibold">{{ beneficiaire() }}</h3>
      <p class="text-encre-2 mt-1 text-[0.9rem] tabular-nums">
        <b class="text-foreground font-semibold">{{ montant() }}</b
        >{{ textes.vers(methode(), r.numero_beneficiaire) }}
      </p>
      <p class="mt-2 text-[0.88rem]">
        <b class="font-semibold" [class]="couleur()">{{ textes.statuts[r.statut] }}</b>
        @if (explication(); as e) {
          <span class="text-encre-2 block sm:ml-1.5 sm:inline">{{ e }}</span>
        }
      </p>
    </div>

    @if (r.statut === 'demande' || r.statut === 'approuve') {
      <div class="flex flex-wrap items-start gap-x-4 gap-y-2 sm:flex-col sm:items-end">
        @if (r.statut === 'demande') {
          @if (principale()) {
            <button
              hlmBtn
              class="h-[42px] px-4 text-[0.9rem]"
              [attr.aria-expanded]="volet() === 'approuver'"
              (click)="ouvrir('approuver')"
            >
              {{ textes.approuver }}
            </button>
          } @else {
            <button
              type="button"
              class="lien-texte"
              [attr.aria-expanded]="volet() === 'approuver'"
              (click)="ouvrir('approuver')"
            >
              {{ textes.approuver }}
            </button>
          }
        }
        <button
          type="button"
          class="lien-texte danger"
          [attr.aria-expanded]="volet() === 'rejeter'"
          (click)="ouvrir('rejeter')"
        >
          {{ textes.rejeter }}
        </button>
      </div>
    }

    @switch (volet()) {
      @case ('approuver') {
        <div class="confirmer sm:col-span-2" role="alert">
          {{ textes.confirmerVersement(montant(), beneficiaire(), methode()) }}
          <button
            type="button"
            class="lien-texte text-alerte-texte"
            [disabled]="enCours()"
            (click)="approuver.emit()"
          >
            {{ textes.ouiVerser }}
          </button>
          <button type="button" class="lien-texte text-alerte-texte" (click)="volet.set(null)">
            {{ textes.nonGarder }}
          </button>
        </div>
      }
      @case ('rejeter') {
        <div class="rounded-cadre border-ciel bg-brume border p-[18px] sm:col-span-2">
          <label
            hlmLabel
            [for]="'motif-' + r.id"
            class="text-encre-2 mb-2 block text-[0.8rem] font-semibold"
            >{{ textes.labelMotif }}</label
          >
          <textarea
            hlmTextarea
            [id]="'motif-' + r.id"
            rows="2"
            class="w-full bg-white"
            [placeholder]="textes.placeholderMotif"
            [value]="motif()"
            (input)="motif.set($any($event.target).value)"
          ></textarea>
          <div class="mt-4 flex flex-wrap items-center gap-4">
            <button
              hlmBtn
              variant="trait"
              size="grand"
              class="h-11"
              [disabled]="enCours() || !motif().trim()"
              (click)="rejeter.emit(motif().trim())"
            >
              {{ textes.rejeterRetrait }}
            </button>
            <button type="button" class="lien-texte" (click)="volet.set(null)">
              {{ textes.fermer }}
            </button>
          </div>
        </div>
      }
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
export class LigneRetrait {
  readonly retrait = input.required<RetraitAdmin>();
  /** Seule la première demande porte « Approuver et verser » en bouton plein. */
  readonly principale = input(false);
  readonly enCours = input(false);
  readonly erreur = input<string | null>(null);
  readonly approuver = output<void>();
  readonly rejeter = output<string>();

  protected readonly textes = TEXTES_RETRAITS;
  protected readonly volet = linkedSignal<RetraitAdmin, Volet>({
    source: this.retrait,
    computation: () => null,
  });
  protected readonly motif = linkedSignal({ source: this.retrait, computation: () => '' });
  protected readonly couleur = computed(() => COULEURS[this.retrait().statut]);
  protected readonly montant = computed(() => fcfa(this.retrait().montant));
  protected readonly methode = computed(() => this.textes.methodes[this.retrait().methode]);
  protected readonly demandeLe = computed(() =>
    this.textes.demandeLe(dateCourte(this.retrait().demande_le)),
  );
  protected readonly beneficiaire = computed(() => {
    const u = this.retrait().portefeuille?.user;
    return u ? `${u.prenom} ${u.nom}` : this.textes.beneficiaireInconnu;
  });
  protected readonly explication = computed(() => {
    const r = this.retrait();
    const v = r.validateur;
    const par = v ? this.textes.par(`${v.prenom} ${v.nom}`) : '';
    switch (r.statut) {
      case 'approuve':
        return this.textes.enVersement + par;
      case 'verse':
        return this.textes.verseLe(dateCourte(r.traite_le), r.reference_paytech);
      case 'rejete':
        return r.motif_rejet ? this.textes.rejeteMotif(r.motif_rejet) : null;
      default:
        return null;
    }
  });

  protected ouvrir(v: Volet): void {
    this.volet.update((actuel) => (actuel === v ? null : v));
  }
}
