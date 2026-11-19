import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmRadioGroupImports } from '@spartan-ng/helm/radio-group';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { Bail, TypeEtatDesLieux } from '../../core/modeles/contrats';
import { ContratsService } from '../../core/services/contrats';
import { messageErreur } from '../../core/services/demarches';
import { TEXTES_CONTRATS } from './textes';
import { lire } from '../../core/ressources/lire';

/** Formulaire du propriétaire : type, observations, compteurs et photos déjà rangées sur le bien. */
@Component({
  selector: 'si-form-etat-des-lieux',
  imports: [HlmButton, HlmInput, HlmLabel, HlmRadioGroupImports, HlmTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './form-etat-des-lieux.html',
  styleUrl: '../../shared/espace/lien-texte.css',
  host: { class: 'block rounded-cadre border border-border p-4 sm:p-6' },
})
export class FormEtatDesLieux {
  protected readonly lire = lire;
  readonly bail = input.required<Bail>();
  readonly types = input.required<readonly TypeEtatDesLieux[]>();
  readonly cree = output<void>();
  readonly fermer = output<void>();

  protected readonly textes = TEXTES_CONTRATS;
  private readonly service = inject(ContratsService);

  protected readonly photos = rxResource({
    params: () => this.bail().bien.id,
    stream: ({ params }) => this.service.photosDuBien(params),
  });
  protected readonly type = linkedSignal(() => this.types()[0]);
  protected readonly observations = signal('');
  protected readonly releve = signal('');
  protected readonly choisies = signal<readonly string[]>([]);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected libelle(t: TypeEtatDesLieux): string {
    return t === 'entree' ? this.textes.etatEntree : this.textes.etatSortie;
  }

  protected choisirType(t: unknown): void {
    const trouve = this.types().find((x) => x === t);
    if (trouve) this.type.set(trouve);
  }

  protected basculerPhoto(id: string, cochee: boolean): void {
    this.choisies.update((ids) => (cochee ? [...ids, id] : ids.filter((x) => x !== id)));
  }

  protected enregistrer(): void {
    this.enCours.set(true);
    this.erreur.set(null);
    this.service
      .creerEtatDesLieux(this.bail().id, {
        type: this.type(),
        observations: this.observations().trim() || null,
        releve_compteurs: this.releve().trim() || null,
        photos: [...this.choisies()],
      })
      .subscribe({
        next: () => {
          this.enCours.set(false);
          this.cree.emit();
        },
        error: (e: unknown) => {
          this.enCours.set(false);
          this.erreur.set(messageErreur(e, this.textes.erreurAction));
        },
      });
  }
}
