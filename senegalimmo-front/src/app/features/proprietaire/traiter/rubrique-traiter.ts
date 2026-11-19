import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { Observable } from 'rxjs';
import { ProprietaireService } from '../../../core/services/proprietaire';
import { SuiviActions } from '../agir';
import { ChargementRubrique } from '../chargement';
import { TEXTES_PROPRIETAIRE } from '../textes';
import { LigneRequete } from './ligne-requete';
import { Requete, grouperRequetes } from './requetes-vue';

/** Rubrique « À traiter » : demandes de location, offres d'achat et visites reçues. */
@Component({
  selector: 'si-rubrique-traiter',
  imports: [RouterLink, NgIcon, HlmButton, LigneRequete, ChargementRubrique],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/espace/rubriques.css',
  host: { class: 'block' },
  template: `
    @if (groupes(); as g) {
      <section aria-labelledby="t-traiter">
        <h2
          id="t-traiter"
          class="font-display flex items-baseline gap-3 text-[1.55rem] leading-tight font-semibold"
        >
          {{ textes.rubriqueTraiter }}
          <small class="text-encre-3 font-sans text-[0.85rem] font-medium">{{
            g.aTraiter.length
          }}</small>
        </h2>
        @if (g.aTraiter.length) {
          <p class="text-encre-2 mt-1.5 text-[0.92rem]">{{ textes.traiterIntro }}</p>
          <div class="border-border mt-3.5 border-t">
            @for (r of g.aTraiter; track r.cle) {
              <si-ligne-requete
                [requete]="r"
                [principale]="$first"
                [enCours]="suivi.enCours() === r.cle"
                [erreur]="suivi.erreurs()[r.cle] ?? null"
                (accepter)="accepter(r)"
                (refuser)="refuser(r, $event)"
              />
            }
          </div>
        } @else {
          <div class="vide">
            <ng-icon name="siCle" size="32" class="text-bleu" />
            <div>
              <h3 class="font-display text-[1.4rem] leading-tight font-semibold">
                {{ textes.traiterVideTitre }}
              </h3>
              <p class="text-encre-2 mt-1.5 max-w-[52ch]">{{ textes.traiterVideTexte }}</p>
              <a
                hlmBtn
                size="grand"
                class="mt-[18px] h-[46px]"
                routerLink="."
                [queryParams]="{ rubrique: 'biens' }"
                >{{ textes.voirMesBiens }}</a
              >
            </div>
          </div>
        }
      </section>
      @if (g.traitees.length) {
        <details class="group mt-11">
          <summary
            class="border-border text-encre-2 flex cursor-pointer list-none items-center gap-2.5 border-t py-3 font-semibold"
          >
            <ng-icon name="siBas" size="18" class="transition-transform group-open:rotate-180" />{{
              textes.dejaTraitees
            }}
            <small class="text-encre-3 text-[0.85rem]">{{ g.traitees.length }}</small>
          </summary>
          <div class="border-border border-t opacity-85">
            @for (r of g.traitees; track r.cle) {
              <si-ligne-requete
                [requete]="r"
                [enCours]="suivi.enCours() === r.cle"
                [erreur]="suivi.erreurs()[r.cle] ?? null"
              />
            }
          </div>
        </details>
      }
    } @else {
      <si-chargement-rubrique [erreur]="!!donnees.error()" (reessayer)="donnees.reload()" />
    }
  `,
})
export class RubriqueTraiter {
  /** Une réponse a été donnée : les indicateurs du bandeau changent. */
  readonly modifie = output<void>();

  protected readonly textes = TEXTES_PROPRIETAIRE;
  private readonly service = inject(ProprietaireService);
  protected readonly suivi = new SuiviActions(TEXTES_PROPRIETAIRE.erreurAction);
  protected readonly donnees = rxResource({ stream: () => this.service.recues() });
  protected readonly groupes = computed(() => {
    const d = this.donnees.hasValue() ? this.donnees.value() : null;
    return d ? grouperRequetes(d.demandes, d.offres, d.visites) : null;
  });

  protected accepter(r: Requete): void {
    const requete: Observable<unknown> =
      r.genre === 'visite'
        ? this.service.confirmerVisite(r.id)
        : r.genre === 'location'
          ? this.service.accepterDemande(r.id)
          : this.service.accepterOffre(r.id);
    this.suivi.lancer(r.cle, requete, () => this.recharger());
  }

  protected refuser(r: Requete, motif: string): void {
    const requete: Observable<unknown> =
      r.genre === 'visite'
        ? this.service.refuserVisite(r.id, motif)
        : r.genre === 'location'
          ? this.service.refuserDemande(r.id, motif)
          : this.service.refuserOffre(r.id, motif);
    this.suivi.lancer(r.cle, requete, () => this.recharger());
  }

  private recharger(): void {
    this.donnees.reload();
    this.modifie.emit();
  }
}
