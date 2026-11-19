import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { ENVIRONNEMENT } from '../config/environnement';
import {
  AdministrateurConnecte,
  AnnonceModeration,
  CompteAdmin,
  DecisionModeration,
  DecisionRetrait,
  EnvoiNotification,
  FiltresComptes,
  FiltresTransactions,
  IndicateursAdmin,
  LienPiece,
  NotificationAdmin,
  NouvelleRegle,
  OptionPremium,
  Page,
  RegleCommission,
  RetraitAdmin,
  SaisieOption,
  SignalementAdmin,
  StatutAnnonce,
  StatutRetrait,
  StatutSignalement,
  Transactions,
} from '../modeles/admin';

export interface AccueilAdmin {
  moi: AdministrateurConnecte;
  indicateurs: IndicateursAdmin;
}

/** Paramètres d'adresse sans les champs vides. */
function parametres(valeurs: Readonly<Record<string, string | number | undefined>>): HttpParams {
  let p = new HttpParams();
  for (const [cle, valeur] of Object.entries(valeurs)) {
    if (valeur !== undefined && valeur !== '') p = p.set(cle, String(valeur));
  }
  return p;
}

/** Appels de l'espace d'administration, chacun réservé par le backend au niveau qui le couvre. */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly api = ENVIRONNEMENT.apiUrl;
  private readonly admin = `${ENVIRONNEMENT.apiUrl}/admin`;

  accueil(): Observable<AccueilAdmin> {
    return forkJoin({
      moi: this.http.get<AdministrateurConnecte>(`${this.api}/moi`),
      indicateurs: this.http.get<IndicateursAdmin>(`${this.api}/tableau-de-bord`),
    });
  }

  annonces(statut: StatutAnnonce, page: number): Observable<Page<AnnonceModeration>> {
    return this.http.get<Page<AnnonceModeration>>(`${this.admin}/annonces`, {
      params: parametres({ statut, page }),
    });
  }

  moderer(id: string, decision: DecisionModeration): Observable<AnnonceModeration> {
    return this.http.post<AnnonceModeration>(`${this.admin}/annonces/${id}/moderer`, { decision });
  }

  attribuerBadge(id: string): Observable<AnnonceModeration> {
    return this.http.post<AnnonceModeration>(`${this.admin}/annonces/${id}/badge`, {});
  }

  comptes(f: FiltresComptes): Observable<Page<CompteAdmin>> {
    return this.http.get<Page<CompteAdmin>>(`${this.admin}/comptes`, {
      params: parametres({ role: f.role, q: f.q, page: f.page }),
    });
  }

  suspendre(id: string): Observable<CompteAdmin> {
    return this.http.post<CompteAdmin>(`${this.admin}/comptes/${id}/suspendre`, {});
  }

  reactiver(id: string): Observable<CompteAdmin> {
    return this.http.post<CompteAdmin>(`${this.admin}/comptes/${id}/reactiver`, {});
  }

  validerAgent(id: string, accepte: boolean): Observable<CompteAdmin> {
    return this.http.post<CompteAdmin>(`${this.admin}/agents/${id}/valider`, { accepte });
  }

  /** Lien signé, valable quelques minutes, vers la pièce d'identité. */
  pieceIdentite(id: string): Observable<LienPiece> {
    return this.http.get<LienPiece>(`${this.admin}/comptes/${id}/piece-identite`);
  }

  verifierIdentite(id: string): Observable<CompteAdmin> {
    return this.http.post<CompteAdmin>(`${this.admin}/proprietaires/${id}/verifier-identite`, {});
  }

  signalements(statut: StatutSignalement, page: number): Observable<Page<SignalementAdmin>> {
    return this.http.get<Page<SignalementAdmin>>(`${this.admin}/signalements`, {
      params: parametres({ statut, page }),
    });
  }

  traiterSignalement(id: string, resolution: string): Observable<SignalementAdmin> {
    return this.http.post<SignalementAdmin>(`${this.admin}/signalements/${id}/traiter`, {
      resolution,
    });
  }

  retraits(statut: StatutRetrait | undefined): Observable<RetraitAdmin[]> {
    return this.http.get<RetraitAdmin[]>(`${this.admin}/retraits`, {
      params: parametres({ statut }),
    });
  }

  traiterRetrait(id: string, decision: DecisionRetrait, motif?: string): Observable<RetraitAdmin> {
    return this.http.post<RetraitAdmin>(`${this.admin}/retraits/${id}/traiter`, {
      decision,
      motif,
    });
  }

  transactions(f: FiltresTransactions): Observable<Transactions> {
    return this.http.get<Transactions>(`${this.admin}/transactions`, {
      params: parametres({ statut: f.statut, du: f.du, au: f.au, page: f.page }),
    });
  }

  reglesCommission(): Observable<RegleCommission[]> {
    return this.http.get<RegleCommission[]>(`${this.admin}/regles-commission`);
  }

  ajouterRegle(r: NouvelleRegle): Observable<RegleCommission> {
    return this.http.post<RegleCommission>(`${this.admin}/regles-commission`, r);
  }

  optionsPremium(): Observable<OptionPremium[]> {
    return this.http.get<OptionPremium[]>(`${this.admin}/options-premium`);
  }

  creerOption(o: SaisieOption): Observable<OptionPremium> {
    return this.http.post<OptionPremium>(`${this.admin}/options-premium`, o);
  }

  modifierOption(id: string, o: Partial<SaisieOption>): Observable<OptionPremium> {
    return this.http.put<OptionPremium>(`${this.admin}/options-premium/${id}`, o);
  }

  envoyerNotification(n: NotificationAdmin): Observable<EnvoiNotification> {
    return this.http.post<EnvoiNotification>(`${this.admin}/notifications`, n);
  }
}
