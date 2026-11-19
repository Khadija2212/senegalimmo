import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { messageErreur } from '../../../core/services/demarches';
import { erreursParChamp } from '../../connexion/erreurs';
import { formulaireAnnonce, formulaireBien, valeursBien } from './formulaire';
import { ChampsAnnonce } from './champs-annonce';
import { ChampsBien } from './champs-bien';
import { ChoixPhotos } from './choix-photos';
import { Publication } from './publication';
import { TEXTES_PUBLIER } from './textes';

const CHEMIN_ESPACE = '/proprietaire';
/** Champs du MediaController : une erreur sur eux concerne une photo. */
const CHAMPS_PHOTO = ['fichier', 'type'];

/** Cas « Enregistrer un bien » puis « Publier une annonce », sur une seule page en trois étapes. */
@Component({
  selector: 'si-publier-bien',
  imports: [RouterLink, NgIcon, HlmButton, ChampsBien, ChampsAnnonce, ChoixPhotos],
  providers: [Publication],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './publier-bien.html',
  host: { class: 'block' },
})
export class PublierBien {
  protected readonly t = TEXTES_PUBLIER;
  protected readonly cheminEspace = CHEMIN_ESPACE;
  protected readonly publication = inject(Publication);
  private readonly router = inject(Router);

  protected readonly bien = formulaireBien();
  protected readonly annonce = formulaireAnnonce();
  protected readonly photos = signal<readonly File[]>([]);
  protected readonly alerte = signal<string | null>(null);
  protected readonly enCours = computed(() => this.publication.etape() !== null);
  protected readonly libelleEnvoi = computed(() => {
    switch (this.publication.etape()) {
      case 'bien':
        return this.t.envoiBien;
      case 'photos':
        return `${this.t.envoiPhotos}, ${this.publication.photosEnvoyees() + 1} / ${this.photos().length}`;
      case 'annonce':
        return this.t.envoiAnnonce;
      default:
        return this.t.publier;
    }
  });

  protected envoyer(): void {
    this.alerte.set(null);
    if (this.bien.invalid || this.annonce.invalid) {
      this.bien.markAllAsTouched();
      this.annonce.markAllAsTouched();
      this.alerte.set(this.t.verifierChamps);
      return;
    }
    const a = this.annonce.getRawValue();
    const location = a.type_transaction === 'location';
    this.publication
      .publier(valeursBien(this.bien), this.photos(), {
        type_transaction: a.type_transaction,
        prix: Number(a.prix),
        charges: location ? Number(a.charges ?? 0) : 0,
        caution: location ? Number(a.caution ?? 0) : 0,
      })
      .subscribe({
        next: () =>
          this.router.navigate([CHEMIN_ESPACE], {
            queryParams: { rubrique: 'biens', publie: 1 },
          }),
        error: (e: unknown) => this.afficherRefus(e),
      });
  }

  /** Erreurs Laravel champ par champ sous les champs ; les autres en tête de formulaire. */
  private afficherRefus(e: unknown): void {
    if (this.publication.bienId()) this.bien.disable();
    const parChamp = erreursParChamp(e);
    let place = false;
    for (const [champ, message] of Object.entries(parChamp)) {
      const controle = this.bien.get(champ) ?? this.annonce.get(champ);
      if (controle && controle.enabled) {
        controle.setErrors({ serveur: message });
        controle.markAsTouched();
        place = true;
      } else if (CHAMPS_PHOTO.includes(champ)) {
        this.alerte.set(message);
        place = true;
      }
    }
    if (!place) this.alerte.set(messageErreur(e, this.t.erreurEnvoi));
  }
}
