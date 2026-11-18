import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { AnnonceDetaillee } from '../../../core/modeles/annonce';
import { DemarchesService } from '../../../core/services/demarches';
import { TEXTES_DEMARCHE } from '../textes';
import { HEURES, dateHeure, prochainsJours } from '../../../core/format/creneaux';
import { EnvoiDemarche } from './envoi';
import { RetourEnvoi } from './retour-envoi';

const JOUR_DEFAUT = 1;
const HEURE_DEFAUT = 1;
const CHEMIN_VISITES = '/espace';

/** Onglet « Visiter » : cas « Demander une visite », qui inclut « Notifier le propriétaire ». */
@Component({
  selector: 'si-onglet-visite',
  imports: [NgIcon, HlmButton, HlmToggleGroupImports, RetourEnvoi],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span id="l-jour" class="text-encre-2 mb-2 block text-[0.8rem] font-semibold">{{
      textes.jour
    }}</span>
    <hlm-toggle-group
      type="single"
      variant="case"
      [spacing]="1.5"
      aria-labelledby="l-jour"
      class="grid w-full grid-cols-5"
      [value]="jour()"
      (valueChange)="jour.set($any($event) ?? jour())"
    >
      @for (j of jours; track j.valeur) {
        <button
          hlmToggleGroupItem
          [value]="j.valeur"
          class="h-auto flex-col gap-0 px-1 py-2 text-[0.85rem]"
        >
          {{ j.nomCourt }}<small class="text-encre-3 text-[0.74rem]">{{ j.date }}</small>
        </button>
      }
    </hlm-toggle-group>

    <span id="l-heure" class="text-encre-2 mt-4 mb-2 block text-[0.8rem] font-semibold">{{
      textes.heure
    }}</span>
    <hlm-toggle-group
      type="single"
      variant="case"
      [spacing]="1.5"
      aria-labelledby="l-heure"
      class="grid w-full grid-cols-3"
      [value]="heure()"
      (valueChange)="heure.set($any($event) ?? heure())"
    >
      @for (h of heures; track h.valeur) {
        <button hlmToggleGroupItem [value]="h.valeur" class="text-[0.85rem]">
          {{ h.libelle }}
        </button>
      }
    </hlm-toggle-group>

    <button
      hlmBtn
      size="grand"
      class="mt-5 h-[52px] w-full"
      [disabled]="envoi.enCours()"
      (click)="envoyer()"
    >
      <ng-icon name="siCle" />{{ envoi.enCours() ? textes.envoiEnCours : libelleBouton() }}
    </button>
    <si-retour-envoi />
    <p class="text-encre-3 mt-2.5 text-[0.82rem]">{{ textes.noteVisite }}</p>
  `,
})
export class OngletVisite implements OnInit {
  readonly annonce = input.required<AnnonceDetaillee>();
  protected readonly textes = TEXTES_DEMARCHE;
  protected readonly envoi = inject(EnvoiDemarche);
  private readonly demarches = inject(DemarchesService);
  protected readonly jours = prochainsJours();
  protected readonly heures = HEURES;
  protected readonly jour = signal(this.jours[JOUR_DEFAUT].valeur);
  protected readonly heure = signal(HEURES[HEURE_DEFAUT].valeur);

  private readonly choixJour = computed(
    () => this.jours.find((j) => j.valeur === this.jour()) ?? this.jours[0],
  );
  private readonly choixHeure = computed(
    () => HEURES.find((h) => h.valeur === this.heure()) ?? HEURES[0],
  );
  protected readonly libelleBouton = computed(() =>
    this.textes.visiterLe(
      `${this.choixJour().nomCourt} ${this.choixJour().date}`,
      this.choixHeure().libelle,
    ),
  );

  ngOnInit(): void {
    const repris = this.envoi.valeursReprises('visite');
    if (!repris) return;
    if (this.jours.some((j) => j.valeur === repris['jour'])) this.jour.set(String(repris['jour']));
    if (HEURES.some((h) => h.valeur === repris['heure'])) this.heure.set(String(repris['heure']));
  }

  protected envoyer(): void {
    const a = this.annonce();
    const gere = a.agent ?? a.bien.proprietaire;
    const quand = this.textes.quand(
      `${this.choixJour().nomCourt} ${this.choixJour().date}`,
      this.choixHeure().libelle,
    );
    this.envoi.envoyer(
      () =>
        this.demarches.demanderVisite({
          annonce_id: a.id,
          date_heure: dateHeure(this.jour(), this.heure()),
        }),
      {
        titre: this.textes.visiteDemandee,
        texte: this.textes.visiteTexte(quand, gere ? `${gere.prenom} ${gere.nom}` : ''),
        lien: CHEMIN_VISITES,
        libelleLien: this.textes.voirVisites,
      },
      { onglet: 'visite', valeurs: { jour: this.jour(), heure: this.heure() } },
    );
  }
}
