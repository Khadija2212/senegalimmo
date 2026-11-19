import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { catchError, of } from 'rxjs';
import { ActionAnnonce, ProprietaireService } from '../../../core/services/proprietaire';
import { SuiviActions } from '../agir';
import { ChargementRubrique } from '../chargement';
import { LIENS_PROPRIETAIRE, TEXTES_PROPRIETAIRE } from '../textes';
import { LigneBien, lignesBiens } from './biens-vue';
import { LigneBienComposant } from './ligne-bien';

/** Rubrique « Mes biens » : biens, annonces, mise en avant, et le bouton « Publier un bien ». */
@Component({
  selector: 'si-rubrique-biens',
  imports: [RouterLink, NgIcon, HlmButton, LigneBienComposant, ChargementRubrique],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/espace/rubriques.css',
  host: { class: 'block' },
  template: `
    @if (lignes(); as liste) {
      <section aria-labelledby="t-biens">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="t-biens"
              class="font-display flex items-baseline gap-3 text-[1.55rem] leading-tight font-semibold"
            >
              {{ textes.rubriqueBiens }}
              <small class="text-encre-3 font-sans text-[0.85rem] font-medium">{{
                liste.length
              }}</small>
            </h2>
            @if (liste.length) {
              <p class="text-encre-2 mt-1.5 text-[0.92rem]">{{ textes.biensIntro }}</p>
            }
          </div>
          @if (liste.length) {
            <a hlmBtn size="grand" class="h-[46px]" [routerLink]="liens.publier">{{
              textes.publierBien
            }}</a>
          }
        </div>
        @if (liste.length) {
          <div class="border-border mt-3.5 border-t">
            @for (l of liste; track l.bienId) {
              <si-ligne-bien
                [ligne]="l"
                [options]="options.hasValue() ? options.value() : null"
                [enCours]="suivi.enCours() === l.bienId"
                [erreur]="suivi.erreurs()[l.bienId] ?? null"
                (agir)="agir(l, $event)"
                (mettreEnAvant)="mettreEnAvant(l, $event)"
              />
            }
          </div>
        } @else {
          <div class="vide">
            <ng-icon name="siImmeuble" size="32" class="text-bleu" />
            <div>
              <h3 class="font-display text-[1.4rem] leading-tight font-semibold">
                {{ textes.biensVideTitre }}
              </h3>
              <p class="text-encre-2 mt-1.5 max-w-[52ch]">{{ textes.biensVideTexte }}</p>
              <a hlmBtn size="grand" class="mt-[18px] h-[46px]" [routerLink]="liens.publier">{{
                textes.publierBien
              }}</a>
            </div>
          </div>
        }
      </section>
    } @else {
      <si-chargement-rubrique [erreur]="!!donnees.error()" (reessayer)="donnees.reload()" />
    }
  `,
})
export class RubriqueBiens {
  /** Une annonce a changé de statut : les indicateurs du bandeau changent. */
  readonly modifie = output<void>();

  protected readonly textes = TEXTES_PROPRIETAIRE;
  protected readonly liens = LIENS_PROPRIETAIRE;
  private readonly service = inject(ProprietaireService);
  protected readonly suivi = new SuiviActions(TEXTES_PROPRIETAIRE.erreurAction);
  protected readonly donnees = rxResource({ stream: () => this.service.patrimoine() });
  /** Les options premium sont secondaires : sans elles, la liste reste utilisable. */
  protected readonly options = rxResource({
    stream: () => this.service.optionsPremium().pipe(catchError(() => of([]))),
  });
  protected readonly lignes = computed(() => {
    if (!this.donnees.hasValue()) return null;
    const d = this.donnees.value();
    return lignesBiens(d.biens, d.annonces);
  });

  protected agir(l: LigneBien, action: ActionAnnonce): void {
    if (!l.annonceId) return;
    this.suivi.lancer(l.bienId, this.service.agirSurAnnonce(l.annonceId, action), () => {
      this.donnees.reload();
      this.modifie.emit();
    });
  }

  protected mettreEnAvant(l: LigneBien, optionId: string): void {
    if (!l.annonceId) return;
    this.suivi.lancer(l.bienId, this.service.mettreEnAvant(l.annonceId, optionId), () =>
      this.donnees.reload(),
    );
  }
}
