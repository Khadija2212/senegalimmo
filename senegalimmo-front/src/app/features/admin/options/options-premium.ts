import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { FcfaPipe } from '../../../core/format/fcfa.pipe';
import { OptionPremium, SaisieOption } from '../../../core/modeles/admin';
import { AdminService } from '../../../core/services/admin';
import { ErreurChargement } from '../commun/erreur-chargement';
import { SqueletteRegistre } from '../commun/squelette-registre';
import { SuiviActions } from '../commun/suivi-actions';
import { TEXTES_ADMIN } from '../textes';
import { FormulaireOption } from './formulaire-option';
import { TEXTES_OPTIONS } from './textes';
import { lire } from '../../../core/ressources/lire';

/** Clé du formulaire de création ; une modification prend l'identifiant de l'option. */
const NOUVELLE = 'nouvelle';

/** Rubrique « Options premium » : lister, créer, modifier, activer ou désactiver. */
@Component({
  selector: 'si-options-premium',
  imports: [NgIcon, HlmButton, FcfaPipe, ErreurChargement, SqueletteRegistre, FormulaireOption],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../../../shared/espace/rubriques.css', '../../../shared/espace/lien-texte.css'],
  template: `
    <section aria-labelledby="t-options">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="t-options" class="font-display text-[1.55rem] leading-tight font-semibold">
          {{ textes.titre }}
        </h2>
        @if (edition() !== nouvelle) {
          <button hlmBtn size="grand" class="h-11" (click)="edition.set(nouvelle)">
            {{ textes.creer }}
          </button>
        }
      </div>
      <p class="text-encre-2 mt-1.5 max-w-[70ch] text-[0.92rem]">{{ textes.intro }}</p>
      @if (edition() === nouvelle) {
        <si-formulaire-option
          class="mt-4"
          [ident]="nouvelle"
          [enCours]="actions.enCours() === nouvelle"
          [erreur]="actions.erreur(nouvelle)"
          (enregistrer)="creer($event)"
          (fermer)="edition.set(null)"
        />
      }

      @if (liste.isLoading() && !liste.hasValue()) {
        <si-squelette-registre />
      } @else if (liste.error()) {
        <si-erreur-chargement (reessayer)="liste.reload()" />
      } @else if (lire(liste); as l) {
        @if (l.length) {
          <ul class="border-border mt-3.5 border-t">
            @for (o of l; track o.id) {
              <li
                class="border-border grid grid-cols-1 items-start gap-3 border-b py-[18px] sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-[18px]"
              >
                <div class="min-w-0">
                  <h3 class="text-[1.02rem] leading-snug font-semibold">{{ o.libelle }}</h3>
                  <p class="text-encre-2 mt-1 text-[0.9rem] tabular-nums">
                    <b class="text-foreground font-semibold">{{ o.prix | fcfa }}</b
                    >, {{ textes.duree(o.duree_jours) }}
                  </p>
                  <p class="mt-2 text-[0.88rem]">
                    <b class="font-semibold" [class]="o.active ? 'text-succes' : 'text-encre-3'">{{
                      o.active ? textes.active : textes.desactivee
                    }}</b>
                    <span class="text-encre-2 ml-1.5">{{
                      o.active ? textes.enVente : textes.horsVente
                    }}</span>
                  </p>
                </div>
                <div class="flex flex-wrap gap-4 sm:justify-end">
                  <button
                    type="button"
                    class="lien-texte"
                    [attr.aria-expanded]="edition() === o.id"
                    (click)="edition.set(edition() === o.id ? null : o.id)"
                  >
                    {{ textes.modifier }}
                  </button>
                  <button
                    type="button"
                    class="lien-texte"
                    [class.danger]="o.active"
                    [disabled]="actions.enCours() === o.id"
                    (click)="basculer(o)"
                  >
                    {{ o.active ? textes.desactiver : textes.activer }}
                  </button>
                </div>
                @if (edition() === o.id) {
                  <si-formulaire-option
                    class="sm:col-span-2"
                    [option]="o"
                    [ident]="o.id"
                    [enCours]="actions.enCours() === o.id"
                    [erreur]="actions.erreur(o.id)"
                    (enregistrer)="modifier(o, $event)"
                    (fermer)="edition.set(null)"
                  />
                } @else if (actions.erreur(o.id); as e) {
                  <p class="text-destructive text-[0.85rem] sm:col-span-2" role="alert">{{ e }}</p>
                }
              </li>
            }
          </ul>
        } @else if (edition() !== nouvelle) {
          <div class="vide">
            <ng-icon name="siHaut" size="32" class="text-bleu" />
            <div>
              <h3 class="font-display text-[1.4rem] leading-tight font-semibold">
                {{ textes.videTitre }}
              </h3>
              <p class="text-encre-2 mt-1.5 max-w-[52ch]">{{ textes.videTexte }}</p>
              <button type="button" class="lien-texte mt-4" (click)="edition.set(nouvelle)">
                {{ textes.creer }}
              </button>
            </div>
          </div>
        }
      }
    </section>
  `,
  host: { class: 'block' },
})
export class OptionsPremium {
  protected readonly lire = lire;
  protected readonly textes = TEXTES_OPTIONS;
  protected readonly nouvelle = NOUVELLE;
  private readonly service = inject(AdminService);
  protected readonly actions = new SuiviActions(TEXTES_ADMIN.erreurAction);

  /** Formulaire ouvert : « nouvelle », l'identifiant d'une option, ou aucun. */
  protected readonly edition = signal<string | null>(null);
  protected readonly liste = rxResource({ stream: () => this.service.optionsPremium() });

  protected creer(o: SaisieOption): void {
    this.actions.lancer(NOUVELLE, this.service.creerOption(o), () => this.terminer());
  }

  protected modifier(o: OptionPremium, saisie: SaisieOption): void {
    this.actions.lancer(o.id, this.service.modifierOption(o.id, saisie), () => this.terminer());
  }

  protected basculer(o: OptionPremium): void {
    this.actions.lancer(o.id, this.service.modifierOption(o.id, { active: !o.active }), () =>
      this.liste.reload(),
    );
  }

  private terminer(): void {
    this.edition.set(null);
    this.liste.reload();
  }
}
