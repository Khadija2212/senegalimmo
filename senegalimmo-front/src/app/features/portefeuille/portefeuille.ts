import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { fcfa } from '../../core/format/fcfa';
import { FcfaPipe } from '../../core/format/fcfa.pipe';
import { PortefeuilleService } from '../../core/services/portefeuille';
import { ESPACE_PAR_ROLE } from '../../core/session/garde-role';
import { SessionService } from '../../core/session/session';
import { DemandeRetrait } from './demande-retrait';
import { Ton, ligneEcriture, ligneRetrait } from './portefeuille-vue';
import { TEXTES_PORTEFEUILLE } from './textes';

const LIGNES_SQUELETTE = [1, 2, 3, 4] as const;
const LOCALE = 'fr-FR';
const COULEURS: Readonly<Record<Ton, string>> = {
  ok: 'text-succes',
  attente: 'text-bleu-vif',
  non: 'text-refus',
  neutre: 'text-encre-3',
};

/** Cas « Consulter portefeuille » et « Demander un retrait », pour le propriétaire et l'agent. */
@Component({
  selector: 'si-portefeuille',
  imports: [RouterLink, NgIcon, HlmButton, FcfaPipe, DemandeRetrait],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './portefeuille.html',
  host: { class: 'block' },
})
export class Portefeuille {
  protected readonly t = TEXTES_PORTEFEUILLE;
  protected readonly couleurs = COULEURS;
  protected readonly squelette = LIGNES_SQUELETTE;
  private readonly service = inject(PortefeuilleService);
  private readonly session = inject(SessionService);

  protected readonly donnees = rxResource({ stream: () => this.service.charger() });
  protected readonly etat = computed(() => (this.donnees.hasValue() ? this.donnees.value() : null));
  protected readonly ecritures = computed(() => this.etat()?.ecritures.map(ligneEcriture) ?? []);
  protected readonly retraits = computed(() => this.etat()?.retraits.map(ligneRetrait) ?? []);
  protected readonly peutRetirer = computed(() => {
    const e = this.etat();
    return !!e && e.solde_disponible >= e.minimum;
  });
  protected readonly misAJour = computed(() => {
    const iso = this.etat()?.mis_a_jour_le;
    return iso
      ? this.t.misAJour(
          new Date(iso).toLocaleDateString(LOCALE, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        )
      : '';
  });
  protected readonly insuffisant = computed(() =>
    this.t.soldeInsuffisant(fcfa(this.etat()?.minimum ?? 0)),
  );
  protected readonly espace = computed(() => {
    const role = this.session.role();
    return role ? ESPACE_PAR_ROLE[role] : '/';
  });
  protected readonly reussite = signal<string | null>(null);

  protected retraitDemande(message: string): void {
    this.reussite.set(message);
    this.donnees.reload();
  }
}
