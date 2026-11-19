import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { AnnonceDetaillee } from '../../../core/modeles/annonce';
import { DemarchesService } from '../../../core/services/demarches';
import { TEXTES_DEMARCHE } from '../textes';
import { EnvoiDemarche } from './envoi';
import { RetourEnvoi } from './retour-envoi';

const DUREES_MOIS = [12, 24, 36] as const;
const CHEMIN_DEMANDES = '/demandes';

/** Onglet « Demander la location » : cas « Demander une location » du client. */
@Component({
  selector: 'si-onglet-location',
  imports: [NgIcon, HlmButton, HlmInput, HlmLabel, HlmSelectImports, HlmTextarea, RetourEnvoi],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-2 gap-2.5">
      <div>
        <label
          hlmLabel
          for="f-entree"
          class="text-encre-2 mb-2 block text-[0.8rem] font-semibold"
          >{{ textes.entree }}</label
        >
        <input
          hlmInput
          id="f-entree"
          type="date"
          class="h-11 w-full bg-white"
          [min]="minimum"
          [value]="entree()"
          (change)="entree.set($any($event.target).value)"
        />
      </div>
      <div>
        <span id="l-duree" class="text-encre-2 mb-2 block text-[0.8rem] font-semibold">{{
          textes.duree
        }}</span>
        <hlm-select
          [value]="duree()"
          [itemToString]="libelleDuree"
          (valueChange)="$event && duree.set($event)"
        >
          <hlm-select-trigger aria-labelledby="l-duree" class="h-11 w-full bg-white"
            ><hlm-select-value
          /></hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            @for (d of durees; track d) {
              <hlm-select-item [value]="d">{{ libelleDuree(d) }}</hlm-select-item>
            }
          </hlm-select-content>
        </hlm-select>
      </div>
    </div>
    <label
      hlmLabel
      for="f-message"
      class="text-encre-2 mt-4 mb-2 block text-[0.8rem] font-semibold"
      >{{ textes.messageProprietaire }}</label
    >
    <textarea
      hlmTextarea
      id="f-message"
      rows="3"
      class="w-full bg-white"
      [placeholder]="textes.placeholderLocation"
      [value]="message()"
      (input)="message.set($any($event.target).value)"
    ></textarea>

    <button
      hlmBtn
      size="grand"
      class="mt-5 h-[52px] w-full"
      [disabled]="envoi.enCours()"
      (click)="envoyer()"
    >
      <ng-icon name="siContrat" />{{
        envoi.enCours() ? textes.envoiEnCours : textes.envoyerDemande
      }}
    </button>
    <si-retour-envoi />
    <p class="text-encre-3 mt-2.5 text-[0.82rem]">{{ textes.noteLocation }}</p>
  `,
})
export class OngletLocation implements OnInit {
  readonly annonce = input.required<AnnonceDetaillee>();
  protected readonly textes = TEXTES_DEMARCHE;
  protected readonly envoi = inject(EnvoiDemarche);
  private readonly demarches = inject(DemarchesService);
  protected readonly durees = DUREES_MOIS;
  protected readonly minimum = versIso(demain());
  protected readonly entree = signal(versIso(premierDuMoisSuivant()));
  protected readonly duree = signal<number>(DUREES_MOIS[0]);
  protected readonly message = signal('');
  protected readonly libelleDuree = (d: number): string => `${d} ${this.textes.mois}`;

  ngOnInit(): void {
    const repris = this.envoi.valeursReprises('demande');
    if (!repris) return;
    const entree = String(repris['entree'] ?? '');
    if (entree >= this.minimum) this.entree.set(entree);
    const duree = Number(repris['duree']);
    if ((DUREES_MOIS as readonly number[]).includes(duree)) this.duree.set(duree);
    this.message.set(String(repris['message'] ?? ''));
  }

  protected envoyer(): void {
    const a = this.annonce();
    const qui = a.bien.proprietaire
      ? `${a.bien.proprietaire.prenom} ${a.bien.proprietaire.nom}`
      : '';
    this.envoi.envoyer(
      () =>
        this.demarches.demanderLocation({
          annonce_id: a.id,
          date_entree_souhaitee: this.entree(),
          duree_mois: this.duree(),
          message: this.message() || undefined,
        }),
      {
        titre: this.textes.demandeEnvoyee,
        texte: this.textes.demandeTexte(qui),
        lien: CHEMIN_DEMANDES,
        libelleLien: this.textes.voirDemandes,
      },
      {
        onglet: 'demande',
        valeurs: { entree: this.entree(), duree: this.duree(), message: this.message() },
      },
    );
  }
}

function demain(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
}

function premierDuMoisSuivant(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

function versIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
