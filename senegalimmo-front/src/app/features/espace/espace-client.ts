import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { Observable } from 'rxjs';
import { messageErreur } from '../../core/services/demarches';
import { EspaceClientService } from '../../core/services/espace-client';
import { SelectionService } from '../../core/services/selection';
import { SessionService } from '../../core/session/session';
import { BarreComparer } from '../accueil/barre-comparer/barre-comparer';
import { Demarche, grouperDemarches, resumer } from './demarches-vue';
import { LigneDemarche } from './ligne-demarche';
import { ListeFavoris } from './liste-favoris';
import { LIENS_ESPACE, Rubrique, TEXTES_ESPACE } from './textes';

/** Espace client : démarches en cours, favoris, raccourcis vers messages, contrats, paiements. */
@Component({
  selector: 'si-espace-client',
  imports: [RouterLink, NgIcon, HlmButton, LigneDemarche, ListeFavoris, BarreComparer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './espace-client.html',
  styleUrl: './espace-client.css',
  host: { class: 'block' },
})
export class EspaceClient {
  /** Paramètre « rubrique » de l'adresse : démarches ou favoris. */
  readonly rubrique = input<Rubrique>('demarches');

  protected readonly textes = TEXTES_ESPACE;
  protected readonly liens = LIENS_ESPACE;
  protected readonly session = inject(SessionService);
  private readonly service = inject(EspaceClientService);
  private readonly selection = inject(SelectionService);
  private readonly router = inject(Router);

  protected readonly donnees = rxResource({ stream: () => this.service.charger() });
  protected readonly actionEnCours = signal<string | null>(null);
  protected readonly erreurs = signal<Readonly<Record<string, string>>>({});

  protected readonly groupes = computed(() => {
    const d = this.donnees.value();
    return d ? grouperDemarches(d.visites, d.demandes, d.offres) : null;
  });
  protected readonly vide = computed(() => {
    const g = this.groupes();
    return !!g && !g.faire.length && !g.attente.length && !g.termine.length;
  });
  protected readonly nombreDemarches = computed(() => {
    const g = this.groupes();
    return g ? g.faire.length + g.attente.length + g.termine.length : 0;
  });
  protected readonly salut = computed(() => {
    const prenom = this.session.compte()?.prenom ?? '';
    return this.vide() ? this.textes.bienvenue(prenom) : this.textes.bonjour(prenom);
  });
  protected readonly resume = computed(() => {
    const g = this.groupes();
    if (!g) return '';
    return this.vide() ? this.textes.compteNeuf : resumer(g);
  });
  /** La seule action en bouton plein : la première démarche « À faire » qui a un lien. */
  protected readonly principale = computed(
    () => this.groupes()?.faire.find((d) => d.lien)?.cle ?? null,
  );

  protected choisir(r: Rubrique): void {
    this.router.navigate([], {
      queryParams: { rubrique: r === 'demarches' ? null : r },
      replaceUrl: true,
    });
  }

  protected reprogrammer(d: Demarche, dateHeure: string): void {
    this.agir(d, this.service.reprogrammerVisite(d.id, dateHeure));
  }

  protected annuler(d: Demarche): void {
    this.agir(d, this.service.annulerVisite(d.id));
  }

  protected retirer(d: Demarche): void {
    this.agir(d, this.service.retirerOffre(d.id));
  }

  protected retirerFavori(id: string): void {
    this.selection.retirerFavori(id).subscribe(() => this.donnees.reload());
  }

  private agir(d: Demarche, requete: Observable<unknown>): void {
    this.actionEnCours.set(d.cle);
    this.erreurs.update((tout) => sansCle(tout, d.cle));
    requete.subscribe({
      next: () => {
        this.actionEnCours.set(null);
        this.donnees.reload();
      },
      error: (e: unknown) => {
        this.actionEnCours.set(null);
        this.erreurs.update((tout) => ({
          ...tout,
          [d.cle]: messageErreur(e, this.textes.erreurAction),
        }));
      },
    });
  }
}

function sansCle(tout: Readonly<Record<string, string>>, cle: string): Record<string, string> {
  return Object.fromEntries(Object.entries(tout).filter(([k]) => k !== cle));
}
