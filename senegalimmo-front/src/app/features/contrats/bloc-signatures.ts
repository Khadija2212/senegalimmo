import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { Contrat, Signature } from '../../core/modeles/contrats';
import { ContratsService } from '../../core/services/contrats';
import { messageErreur } from '../../core/services/demarches';
import { doitSigner, etatSignature, peutRelancer, roleDans } from './contrats-vue';
import { COULEUR_TON } from './etat';
import { TEXTES_CONTRATS } from './textes';

/** État des signatures, signature du compte connecté et relance de l'autre partie. */
@Component({
  selector: 'si-bloc-signatures',
  imports: [HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../shared/espace/lien-texte.css',
  host: { class: 'block' },
  template: `
    <h2 id="t-signatures" class="font-display text-[1.55rem] leading-tight font-semibold">
      {{ textes.signatures }}
    </h2>
    <p class="text-encre-2 mt-1.5 text-[0.92rem]">{{ textes.signaturesIntro }}</p>
    <ul class="border-border mt-3.5 border-t">
      @for (s of contrat().signatures; track s.id) {
        <li class="border-border flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b py-3.5">
          <span class="min-w-0 flex-1 font-semibold">
            {{ nom(s) }}
            <span class="text-encre-3 font-normal">{{ role(s) }}</span>
          </span>
          <b class="text-[0.9rem] font-semibold" [class]="couleur(s)">{{ etat(s).libelle }}</b>
          @if (relancable(s)) {
            @if (relancees().includes(s.id)) {
              <span class="text-encre-2 text-[0.85rem]">{{ textes.relanceEnvoyee }}</span>
            } @else {
              <button type="button" class="lien-texte" [disabled]="enCours()" (click)="relancer(s)">
                {{ textes.relancer }}
              </button>
            }
          }
        </li>
      }
    </ul>

    @if (aSigner()) {
      <form class="mt-5" (submit)="$event.preventDefault(); signer()">
        <label class="flex cursor-pointer items-start gap-3 text-[0.95rem]">
          <input
            type="checkbox"
            class="accent-bleu mt-1 size-4 shrink-0"
            [checked]="lu()"
            (change)="lu.set($any($event.target).checked)"
          />
          <span>{{ textes.jaiLu }}</span>
        </label>
        <button
          hlmBtn
          size="grand"
          type="submit"
          class="mt-4 h-[46px]"
          [disabled]="!lu() || enCours()"
        >
          {{ enCours() ? textes.signatureEnCours : textes.signerContrat }}
        </button>
      </form>
    }
    @if (erreur(); as e) {
      <p class="text-destructive mt-3 text-[0.88rem]" role="alert">{{ e }}</p>
    }
  `,
})
export class BlocSignatures {
  readonly contrat = input.required<Contrat>();
  readonly compteId = input.required<string>();
  /** Le contrat à jour, renvoyé par l'API après la signature. */
  readonly signe = output<Contrat>();

  protected readonly textes = TEXTES_CONTRATS;
  private readonly service = inject(ContratsService);

  protected readonly aSigner = computed(() => doitSigner(this.contrat(), this.compteId()));
  /** Case « J'ai lu » : décochée à chaque nouveau contrat. */
  protected readonly lu = linkedSignal({ source: this.contrat, computation: () => false });
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly relancees = signal<readonly string[]>([]);

  protected nom(s: Signature): string {
    if (s.signataire_id === this.compteId()) return this.textes.vous;
    return s.signataire ? `${s.signataire.prenom} ${s.signataire.nom}` : '';
  }

  protected role(s: Signature): string {
    return s.signataire ? roleDans(this.contrat(), s.signataire.role) : '';
  }

  protected etat(s: Signature): ReturnType<typeof etatSignature> {
    return etatSignature(s);
  }

  protected couleur(s: Signature): string {
    return COULEUR_TON[etatSignature(s).ton];
  }

  protected relancable(s: Signature): boolean {
    return peutRelancer(this.contrat(), s, this.compteId());
  }

  protected signer(): void {
    if (!this.lu()) return;
    this.lancer();
    this.service.signer(this.contrat().id).subscribe({
      next: (c) => {
        this.enCours.set(false);
        this.signe.emit(c);
      },
      error: (e: unknown) => this.echec(e),
    });
  }

  protected relancer(s: Signature): void {
    this.lancer();
    this.service.relancer(s.id).subscribe({
      next: () => {
        this.enCours.set(false);
        this.relancees.update((ids) => [...ids, s.id]);
      },
      error: (e: unknown) => this.echec(e),
    });
  }

  private lancer(): void {
    this.enCours.set(true);
    this.erreur.set(null);
  }

  private echec(e: unknown): void {
    this.enCours.set(false);
    this.erreur.set(messageErreur(e, this.textes.erreurAction));
  }
}
