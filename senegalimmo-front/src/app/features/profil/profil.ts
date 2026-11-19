import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HlmButton } from '@spartan-ng/helm/button';
import { ProfilCompte } from '../../core/modeles/profil';
import { ProfilService } from '../../core/services/profil';
import { InfosProfil } from './infos-profil';
import { MotDePasse } from './mot-de-passe';
import { PieceIdentite } from './piece-identite';
import { demandePiece } from './profil-vue';
import { TEXTES_PROFIL } from './textes';

/** Cas « Gérer son profil », commun aux quatre rôles : informations, pièce, mot de passe. */
@Component({
  selector: 'si-profil',
  imports: [HlmButton, InfosProfil, PieceIdentite, MotDePasse],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profil.html',
  host: { class: 'block' },
})
export class Profil {
  protected readonly textes = TEXTES_PROFIL;
  private readonly service = inject(ProfilService);

  protected readonly compte = rxResource({ stream: () => this.service.charger() });
  protected readonly avecPiece = computed(() =>
    this.compte.hasValue() ? demandePiece(this.compte.value().role) : false,
  );
  protected readonly introPiece = computed(() =>
    this.compte.hasValue() && this.compte.value().role === 'proprietaire'
      ? this.textes.pieceIntroProprietaire
      : this.textes.pieceIntroClient,
  );

  protected remplacer(c: ProfilCompte): void {
    this.compte.set(c);
  }
}
