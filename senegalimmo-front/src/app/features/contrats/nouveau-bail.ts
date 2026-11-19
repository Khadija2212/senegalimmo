import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { fcfa } from '../../core/format/fcfa';
import { ContratsService } from '../../core/services/contrats';
import { messageErreur } from '../../core/services/demarches';
import { jour } from './etat';
import { LIENS_CONTRATS, TEXTES_CONTRATS } from './textes';

/** Bornes de BailController::store et valeur par défaut de Proprietaire::creerBail. */
const JOUR_MAX = 28;
const JOUR_PAR_DEFAUT = 5;
const JOURS = Array.from({ length: JOUR_MAX }, (_, i) => i + 1);

/** Le propriétaire prépare le bail d'une demande de location acceptée, puis l'envoie en signature. */
@Component({
  selector: 'si-nouveau-bail',
  imports: [RouterLink, NgIcon, HlmButton, HlmSelectImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nouveau-bail.html',
  styleUrls: ['../../shared/espace/lien-texte.css', '../../shared/espace/rubriques.css'],
  host: { class: 'block' },
})
export class NouveauBail {
  /** Paramètre d'adresse « demande » : identifiant de la demande de location acceptée. */
  readonly demande = input<string>('');

  protected readonly textes = TEXTES_CONTRATS;
  protected readonly cheminContrats = LIENS_CONTRATS.contrats;
  protected readonly jours = JOURS;
  private readonly service = inject(ContratsService);
  private readonly router = inject(Router);

  protected readonly demandes = rxResource({ stream: () => this.service.demandesLocation() });
  protected readonly choisie = computed(
    () => this.demandes.value()?.find((d) => d.id === this.demande()) ?? null,
  );
  protected readonly recap = computed((): readonly (readonly [string, string])[] => {
    const d = this.choisie();
    if (!d) return [];
    const a = d.annonce;
    return [
      [this.textes.loyer, fcfa(a.prix)],
      [this.textes.charges, fcfa(a.charges)],
      [this.textes.caution, a.caution ? fcfa(a.caution) : this.textes.cautionSans],
      [this.textes.entree, jour(d.date_entree_souhaitee)],
      [this.textes.duree, this.textes.dureeMois(d.duree_mois)],
    ];
  });
  protected readonly jourEcheance = signal(JOUR_PAR_DEFAUT);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly libelleJour = (j: number): string => this.textes.leJour(j);

  protected choisirJour(j: unknown): void {
    if (typeof j === 'number' && JOURS.includes(j)) this.jourEcheance.set(j);
  }

  protected creer(): void {
    const d = this.choisie();
    if (!d) return;
    this.enCours.set(true);
    this.erreur.set(null);
    this.service.creerBail(d.id, this.jourEcheance()).subscribe({
      next: (bail) => this.router.navigate([this.cheminContrats, bail.id]),
      error: (e: unknown) => {
        this.enCours.set(false);
        this.erreur.set(messageErreur(e, this.textes.erreurAction));
      },
    });
  }
}
