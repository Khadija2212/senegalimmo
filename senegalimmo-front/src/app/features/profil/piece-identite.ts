import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HlmButton } from '@spartan-ng/helm/button';
import { ProfilCompte } from '../../core/modeles/profil';
import { messageErreur } from '../../core/services/demarches';
import { ProfilService } from '../../core/services/profil';
import { erreursParChamp } from '../connexion/erreurs';
import { TYPES_PIECE, controlerFichier, etatPiece } from './profil-vue';
import { TEXTES_PROFIL } from './textes';

/** Bloc « Pièce d'identité » du client et du propriétaire : état, envoi, consultation. */
@Component({
  selector: 'si-piece-identite',
  imports: [HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../shared/espace/lien-texte.css',
  template: `
    @if (piece.isLoading() && !piece.hasValue()) {
      <div class="bg-brume h-5 w-48 animate-pulse rounded" aria-busy="true"></div>
    } @else if (piece.error()) {
      <p class="text-[0.92rem]" role="alert">
        <span class="text-encre-2">{{ textes.etatIndisponible }}</span>
        <button type="button" class="lien-texte ml-2" (click)="piece.reload()">
          {{ textes.reessayer }}
        </button>
      </p>
    } @else {
      <p class="text-[0.92rem]">
        <b class="font-semibold" [class]="etat().couleur">{{ etat().libelle }}</b>
        <span class="text-encre-2 block sm:ml-1.5 sm:inline">{{ etat().explication }}</span>
      </p>
      @if (lien(); as lien) {
        <p class="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <a class="lien-texte" [href]="lien.url" target="_blank" rel="noopener noreferrer">{{
            textes.voirPiece
          }}</a>
          <span class="text-encre-3 text-[0.8rem]">{{ textes.lienValable }}</span>
        </p>
      }
    }

    <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
      <input
        id="p-piece"
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        class="sr-only"
        aria-describedby="p-piece-aide"
        (change)="choisir($event)"
      />
      <label for="p-piece" class="lien-texte">{{
        fichier() ? textes.remplacerFichier : textes.choisirFichier
      }}</label>
      @if (fichier(); as f) {
        <span class="text-encre-2 min-w-0 truncate text-[0.88rem]">{{
          textes.fichierChoisi(f.name)
        }}</span>
      }
    </div>
    @if (erreur(); as m) {
      <p class="text-destructive mt-1.5 text-[0.82rem]" role="alert">{{ m }}</p>
    } @else {
      <p id="p-piece-aide" class="text-encre-3 mt-1.5 text-[0.8rem]">{{ textes.pieceAide }}</p>
    }
    @if (fichier()) {
      <button
        hlmBtn
        size="grand"
        type="button"
        class="mt-4 h-[46px]"
        [disabled]="enCours()"
        (click)="envoyer()"
      >
        {{ enCours() ? textes.envoiEnCours : textes.envoyerPiece }}
      </button>
    }
    @if (succes()) {
      <p class="text-succes mt-3 text-[0.9rem] font-semibold" role="status">
        {{ textes.pieceEnvoyee }}
      </p>
    }
  `,
})
export class PieceIdentite {
  readonly compte = input.required<ProfilCompte>();

  protected readonly textes = TEXTES_PROFIL;
  private readonly service = inject(ProfilService);

  /** Le lien signé de la pièce actuelle ; null quand aucune n'a été envoyée. */
  protected readonly piece = rxResource({ stream: () => this.service.pieceIdentite() });
  protected readonly fichier = signal<File | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly enCours = signal(false);
  protected readonly succes = signal(false);

  protected readonly lien = computed(() => (this.piece.hasValue() ? this.piece.value() : null));
  protected readonly etat = computed(() => etatPiece(this.compte(), !!this.lien()));

  protected choisir(evenement: Event): void {
    const champ = evenement.target as HTMLInputElement;
    const f = champ.files?.[0];
    champ.value = '';
    if (!f) return;
    this.succes.set(false);
    const refus = controlerFichier(f, TYPES_PIECE, this.textes.typePiece);
    this.erreur.set(refus);
    this.fichier.set(refus ? null : f);
  }

  protected envoyer(): void {
    const f = this.fichier();
    if (!f) return;
    this.enCours.set(true);
    this.erreur.set(null);
    this.service.televerserPiece(f).subscribe({
      next: () => {
        this.enCours.set(false);
        this.fichier.set(null);
        this.succes.set(true);
        this.piece.reload();
      },
      error: (e: unknown) => {
        this.enCours.set(false);
        this.erreur.set(erreursParChamp(e)['fichier'] ?? messageErreur(e, this.textes.erreurEnvoi));
      },
    });
  }
}
