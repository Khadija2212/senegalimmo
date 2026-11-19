import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { map } from 'rxjs';
import { Conversation } from '../../core/modeles/messagerie';
import { AnnoncesService } from '../../core/services/annonces';
import { messageErreur } from '../../core/services/demarches';
import { MessagerieService } from '../../core/services/messagerie';
import { ESPACE_PAR_ROLE } from '../../core/session/garde-role';
import { SessionService } from '../../core/session/session';
import { FilMessages } from './fil-messages';
import { ListeConversations } from './liste-conversations';
import {
  EnteteFil,
  enteteBrouillon,
  enteteConversation,
  grouperMessages,
  totalNonLus,
  trouverConversation,
  versLigne,
} from './messagerie-vue';
import { derniereValeur, sondageVisible } from './sondage';
import { LIENS_MESSAGES, TEXTES_MESSAGES } from './textes';
import { ZoneEcriture } from './zone-ecriture';

const PERIODE_FIL_MS = 10_000;
const PERIODE_LISTE_MS = 30_000;

/** Messagerie : liste des conversations à gauche, fil ouvert à droite (l'un ou l'autre sur téléphone). */
@Component({
  selector: 'si-messagerie',
  imports: [RouterLink, NgIcon, HlmButton, ListeConversations, FilMessages, ZoneEcriture],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './messagerie.html',
  styleUrls: ['../../shared/espace/rubriques.css', '../../shared/espace/lien-texte.css'],
  host: { class: 'block' },
})
export class Messagerie {
  /** Paramètre « conversation » de l'adresse : la conversation ouverte. */
  readonly conversation = input<string>();
  /** Paramètres « a » et « annonce » : écrire à cette personne à propos de cette annonce. */
  readonly a = input<string>();
  readonly annonce = input<string>();

  protected readonly textes = TEXTES_MESSAGES;
  protected readonly liens = LIENS_MESSAGES;
  private readonly session = inject(SessionService);
  private readonly service = inject(MessagerieService);
  private readonly annonces = inject(AnnoncesService);
  private readonly router = inject(Router);
  private readonly moiId = computed(() => this.session.compte()?.id ?? '');

  protected readonly liste = rxResource({ stream: () => this.service.conversations() });
  protected readonly conversations = derniereValeur(this.liste);

  /** La conversation déjà ouverte avec la personne demandée par « a », s'il y en a une. */
  private readonly existante = computed(() => {
    const a = this.a();
    const liste = this.conversations();
    return a && liste ? trouverConversation(liste, a, this.annonce() ?? null) : null;
  });
  protected readonly idOuvert = computed(() => this.conversation() ?? this.existante()?.id ?? null);
  protected readonly brouillon = computed(
    () => !!this.a() && !this.idOuvert() && this.conversations() !== undefined,
  );
  protected readonly filVisible = computed(() => !!this.idOuvert() || this.brouillon());

  protected readonly fil = rxResource({
    params: () => this.idOuvert() ?? undefined,
    stream: ({ params: id }) => this.service.messages(id).pipe(map((page) => ({ id, page }))),
  });
  private readonly dernierFil = derniereValeur(this.fil);
  protected readonly groupes = computed(() => {
    const f = this.dernierFil();
    return f && f.id === this.idOuvert()
      ? grouperMessages(f.page.data, this.moiId(), new Date())
      : null;
  });

  protected readonly ouverte = computed<Conversation | null>(
    () => this.conversations()?.find((c) => c.id === this.idOuvert()) ?? null,
  );
  protected readonly entete = computed<EnteteFil | null>(() => {
    const c = this.ouverte();
    return c ? enteteConversation(c, this.moiId()) : this.enteteBrouillon();
  });

  /** En brouillon, l'annonce donne le titre du bien et le nom de la personne à qui l'on écrit. */
  private readonly annonceBrouillon = rxResource({
    params: () => (this.brouillon() ? this.annonce() : undefined),
    stream: ({ params: id }) => this.annonces.consulter(id),
  });
  private readonly enteteBrouillon = computed(() =>
    this.brouillon()
      ? enteteBrouillon(
          this.annonceBrouillon.hasValue() ? this.annonceBrouillon.value() : undefined,
          this.a() ?? '',
        )
      : null,
  );

  protected readonly lignes = computed(() =>
    (this.conversations() ?? []).map((c) =>
      versLigne(c, this.moiId(), new Date(), this.idOuvert()),
    ),
  );
  protected readonly resume = computed(() => {
    const liste = this.conversations();
    if (!liste?.length) return '';
    const ouverte = this.ouverte();
    return this.textes.resume(liste.length, totalNonLus(liste) - (ouverte?.non_lus ?? 0));
  });
  protected readonly estClient = this.session.estClient;
  protected readonly espace = computed(() => {
    const role = this.session.role();
    return role ? ESPACE_PAR_ROLE[role] : this.liens.accueil;
  });

  protected readonly envoiEnCours = signal(false);
  protected readonly erreurEnvoi = signal<string | null>(null);
  protected readonly envois = signal(0);

  constructor() {
    const doc = inject(DOCUMENT);
    sondageVisible(PERIODE_FIL_MS, doc)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.idOuvert() && !this.fil.isLoading()) this.fil.reload();
      });
    sondageVisible(PERIODE_LISTE_MS, doc)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (!this.liste.isLoading()) this.liste.reload();
      });
  }

  protected envoyer(contenu: string): void {
    const id = this.idOuvert();
    const a = this.a();
    this.envoiEnCours.set(true);
    this.erreurEnvoi.set(null);
    if (id) {
      this.service.envoyer(id, contenu).subscribe({
        next: () => this.apresEnvoi(() => this.fil.reload()),
        error: (e: unknown) => this.echecEnvoi(e),
      });
    } else if (a) {
      this.service
        .creer({ destinataire_id: a, annonce_id: this.annonce() ?? null, contenu })
        .subscribe({
          next: (r) => this.apresEnvoi(() => this.ouvrir(r.conversation.id)),
          error: (e: unknown) => this.echecEnvoi(e),
        });
    }
  }

  private apresEnvoi(suite: () => void): void {
    this.envoiEnCours.set(false);
    this.envois.update((n) => n + 1);
    suite();
    this.liste.reload();
  }

  private echecEnvoi(e: unknown): void {
    this.envoiEnCours.set(false);
    this.erreurEnvoi.set(messageErreur(e, this.textes.erreurEnvoi));
  }

  private ouvrir(id: string): void {
    this.router.navigate([], {
      queryParams: { conversation: id, a: null, annonce: null },
      replaceUrl: true,
    });
  }
}
