import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { messageErreur } from '../../../core/services/demarches';
import { SessionService } from '../../../core/session/session';
import { TEXTES_DEMARCHE } from '../textes';

export interface Confirmation {
  titre: string;
  texte: string;
  lien: string;
  libelleLien: string;
}

export type Blocage = 'connexion' | 'role' | null;

const CHEMIN_CONNEXION = '/login';

/** Envoi d'une démarche : vérifie le compte, envoie, garde l'erreur ou la confirmation. */
@Injectable()
export class EnvoiDemarche {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly enCours = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly blocage = signal<Blocage>(null);
  readonly confirmation = signal<Confirmation | null>(null);

  envoyer(requete: () => Observable<unknown>, confirmation: Confirmation): void {
    this.erreur.set(null);
    this.blocage.set(
      this.session.connecte() ? (this.session.estClient() ? null : 'role') : 'connexion',
    );
    if (this.blocage()) return;
    this.enCours.set(true);
    requete().subscribe({
      next: () => {
        this.enCours.set(false);
        this.confirmation.set(confirmation);
      },
      error: (e: unknown) => {
        this.enCours.set(false);
        this.erreur.set(messageErreur(e, TEXTES_DEMARCHE.erreurEnvoi));
      },
    });
  }

  seConnecter(): void {
    this.router.navigate([CHEMIN_CONNEXION], { queryParams: { retour: this.router.url } });
  }
}
