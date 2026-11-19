import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { CanalNotification, CompteAdmin, NotificationAdmin } from '../../../core/modeles/admin';
import { AdminService } from '../../../core/services/admin';
import { Role } from '../../../core/session/session';
import { ChoixBascules } from '../commun/choix-bascules';
import { SuiviActions } from '../commun/suivi-actions';
import { TEXTES_ADMIN } from '../textes';
import { ChoisirCompte } from './choisir-compte';
import { TEXTES_NOTIFICATION } from './textes';

/** Bornes du backend (NotificationAdminController::envoyer). */
const TITRE_MAX = 150;
const CONTENU_MAX = 1000;
const CLE_ENVOI = 'envoi';

type Mode = 'role' | 'compte';

/** Rubrique « Envoyer une notification » : à un compte ou à tout un rôle, sur un canal. */
@Component({
  selector: 'si-envoyer-notification',
  imports: [HlmButton, HlmInput, HlmLabel, HlmTextarea, ChoixBascules, ChoisirCompte],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/espace/lien-texte.css',
  template: `
    <section aria-labelledby="t-notification">
      <h2 id="t-notification" class="font-display text-[1.55rem] leading-tight font-semibold">
        {{ textes.titre }}
      </h2>
      <p class="text-encre-2 mt-1.5 text-[0.92rem]">{{ textes.intro }}</p>

      @if (envoyees() !== null) {
        <div class="border-border mt-5 rounded-cadre border p-[18px]" role="status">
          <p class="text-succes font-semibold">{{ textes.envoyee(envoyees()!) }}</p>
          <button type="button" class="lien-texte mt-3" (click)="recommencer()">
            {{ textes.nouvelle }}
          </button>
        </div>
      } @else {
        <div class="mt-5 max-w-[640px]">
          <span class="text-encre-2 mb-2 block text-[0.8rem] font-semibold">{{
            textes.destinataires
          }}</span>
          <si-choix-bascules
            [choix]="textes.modes"
            [valeur]="mode()"
            [libelle]="textes.destinataires"
            (choisir)="mode.set($any($event))"
          />
          <div class="mt-4">
            @if (mode() === 'role') {
              <si-choix-bascules
                [choix]="textes.roles"
                [valeur]="role()"
                [libelle]="textes.role"
                (choisir)="role.set($any($event))"
              />
            } @else if (compte(); as c) {
              <p class="text-[0.92rem]">
                <span class="text-encre-2">{{ textes.compteChoisi }} : </span>
                <b class="font-semibold break-all">{{
                  textes.choisir(c.prenom + ' ' + c.nom, c.email)
                }}</b>
              </p>
              <button type="button" class="lien-texte mt-2" (click)="compte.set(null)">
                {{ textes.changer }}
              </button>
            } @else {
              <si-choisir-compte (choisir)="compte.set($event)" />
            }
          </div>

          <span class="text-encre-2 mt-5 mb-2 block text-[0.8rem] font-semibold">{{
            textes.canal
          }}</span>
          <si-choix-bascules
            [choix]="textes.canaux"
            [valeur]="canal()"
            [libelle]="textes.canal"
            (choisir)="canal.set($any($event))"
          />

          <label
            hlmLabel
            for="f-titre-notif"
            class="text-encre-2 mt-5 mb-2 block text-[0.8rem] font-semibold"
            >{{ textes.labelTitre }}</label
          >
          <input
            hlmInput
            id="f-titre-notif"
            class="h-11 w-full bg-white"
            [maxLength]="titreMax"
            [value]="titre()"
            (input)="titre.set($any($event.target).value)"
          />
          <label
            hlmLabel
            for="f-contenu-notif"
            class="text-encre-2 mt-4 mb-2 block text-[0.8rem] font-semibold"
            >{{ textes.labelContenu }}</label
          >
          <textarea
            hlmTextarea
            id="f-contenu-notif"
            rows="5"
            class="w-full bg-white"
            [maxLength]="contenuMax"
            aria-describedby="f-contenu-reste"
            [value]="contenu()"
            (input)="contenu.set($any($event.target).value)"
          ></textarea>
          <p id="f-contenu-reste" class="text-encre-3 mt-1.5 text-[0.8rem]" aria-live="polite">
            {{ textes.restants(contenuMax - contenu().length) }}
          </p>

          <button
            hlmBtn
            size="grand"
            class="mt-5 h-[52px] w-full sm:w-auto"
            [disabled]="actions.enCours() === cleEnvoi || !valide()"
            (click)="envoyer()"
          >
            {{ actions.enCours() === cleEnvoi ? textes.envoiEnCours : textes.envoyer }}
          </button>
          @if (actions.erreur(cleEnvoi); as e) {
            <p class="text-destructive mt-3 text-[0.85rem]" role="alert">{{ e }}</p>
          }
        </div>
      }
    </section>
  `,
  host: { class: 'block' },
})
export class EnvoyerNotification {
  protected readonly textes = TEXTES_NOTIFICATION;
  protected readonly titreMax = TITRE_MAX;
  protected readonly contenuMax = CONTENU_MAX;
  protected readonly cleEnvoi = CLE_ENVOI;
  private readonly service = inject(AdminService);
  protected readonly actions = new SuiviActions(TEXTES_ADMIN.erreurAction);

  protected readonly mode = signal<Mode>('role');
  protected readonly role = signal<Role>('client');
  protected readonly compte = signal<CompteAdmin | null>(null);
  protected readonly canal = signal<CanalNotification>('push');
  protected readonly titre = signal('');
  protected readonly contenu = signal('');
  protected readonly envoyees = signal<number | null>(null);

  protected readonly valide = computed(
    () =>
      !!this.titre().trim() &&
      !!this.contenu().trim() &&
      (this.mode() === 'role' || this.compte() !== null),
  );

  protected envoyer(): void {
    const n: NotificationAdmin = {
      canal: this.canal(),
      titre: this.titre().trim(),
      contenu: this.contenu().trim(),
      ...(this.mode() === 'compte' ? { compte_id: this.compte()?.id } : { role: this.role() }),
    };
    this.actions.lancer(CLE_ENVOI, this.service.envoyerNotification(n), (r) =>
      this.envoyees.set(r.envoyees),
    );
  }

  protected recommencer(): void {
    this.titre.set('');
    this.contenu.set('');
    this.envoyees.set(null);
  }
}
