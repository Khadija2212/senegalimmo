import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { BienAssigne, Mandat } from '../../core/modeles/agent';
import { AgentService } from '../../core/services/agent';
import { SaisieAnnonce } from './formulaire-annonce';
import { LigneBien } from './ligne-bien';
import {
  FILTRES_BIEN,
  FiltreBien,
  LigneBien as Ligne,
  compterParFiltre,
  libelleFiltre,
  lignesBiens,
} from './registres-vue';
import { SuiviActions } from './suivi-actions';
import { TEXTES_AGENT } from './textes';

/** Cas « Consulter biens assignés », étendu par « Filtrer par statut » et « Publier annonce ». */
@Component({
  selector: 'si-rubrique-biens',
  imports: [NgIcon, LigneBien],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../../shared/espace/rubriques.css', '../../shared/espace/lien-texte.css'],
  template: `
    <h2 class="font-display text-[1.55rem] leading-tight font-semibold">
      {{ textes.rubriqueBiens }}
    </h2>
    <p class="text-encre-2 mt-1.5 text-[0.92rem]">{{ textes.biensIntro }}</p>

    @if (!biens().length) {
      <div class="vide">
        <ng-icon name="siImmeuble" size="32" class="text-bleu" />
        <div>
          <h3 class="font-display text-[1.4rem] leading-tight font-semibold">
            {{ textes.biensVides }}
          </h3>
          <p class="text-encre-2 mt-1.5 max-w-[52ch]">{{ textes.biensVidesTexte }}</p>
          <button type="button" class="lien-texte mt-4" (click)="voirMandats.emit()">
            {{ textes.voirMandats }}
          </button>
        </div>
      </div>
    } @else {
      <div
        class="border-border mt-5 flex overflow-x-auto rounded-champ border"
        role="group"
        [attr.aria-label]="textes.filtreStatut"
      >
        @for (f of filtres(); track f.valeur) {
          <button
            type="button"
            class="bascule shrink-0"
            [attr.aria-pressed]="filtre() === f.valeur"
            (click)="filtre.set(f.valeur)"
          >
            {{ f.libelle }}<span class="text-encre-3 text-[0.82rem] tabular-nums">{{ f.n }}</span>
          </button>
        }
      </div>

      <div class="border-border mt-3.5 border-t">
        @for (l of lignes(); track l.bien.id) {
          <si-ligne-bien
            [ligne]="l"
            [principale]="l.bien.id === principale()"
            [enCours]="suivi.enCours() === l.bien.id"
            [erreur]="suivi.erreurs()[l.bien.id] ?? null"
            (publier)="publier(l, $event)"
          />
        } @empty {
          <p class="text-encre-2 py-6 text-[0.92rem]">{{ textes.aucunBienStatut }}</p>
        }
      </div>
    }
  `,
  host: { class: 'block' },
})
export class RubriqueBiens {
  readonly biens = input.required<readonly BienAssigne[]>();
  readonly mandats = input.required<readonly Mandat[]>();
  readonly modifie = output<void>();
  /** Lien de l'état vide vers les mandats. */
  readonly voirMandats = output<void>();

  protected readonly textes = TEXTES_AGENT;
  protected readonly suivi = new SuiviActions(TEXTES_AGENT.erreurAction);
  protected readonly filtre = signal<FiltreBien>('tous');
  private readonly service = inject(AgentService);

  /** Seuls les statuts présents sont proposés, en plus de « Tous » et du filtre choisi. */
  protected readonly filtres = computed(() => {
    const n = compterParFiltre(this.biens());
    const choisi = this.filtre();
    return FILTRES_BIEN.filter((f) => f === 'tous' || f === choisi || n[f] > 0).map((f) => ({
      valeur: f,
      libelle: libelleFiltre(f),
      n: n[f],
    }));
  });
  protected readonly lignes = computed(() =>
    lignesBiens(this.biens(), this.mandats(), this.filtre()),
  );
  protected readonly principale = computed(
    () => this.lignes().find((l) => !l.annonce)?.bien.id ?? null,
  );

  protected publier(l: Ligne, s: SaisieAnnonce): void {
    this.suivi.agir(l.bien.id, this.service.publierAnnonce({ ...s, bien_id: l.bien.id }), () =>
      this.modifie.emit(),
    );
  }
}
