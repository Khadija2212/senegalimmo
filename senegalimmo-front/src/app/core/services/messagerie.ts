import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ENVIRONNEMENT } from '../config/environnement';
import {
  Conversation,
  ConversationCreee,
  Message,
  NouvelleConversation,
  PageMessages,
} from '../modeles/messagerie';

/** Échanger par messagerie : conversations du compte connecté et leurs messages. */
@Injectable({ providedIn: 'root' })
export class MessagerieService {
  private readonly http = inject(HttpClient);
  private readonly url = `${ENVIRONNEMENT.apiUrl}/conversations`;

  conversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(this.url);
  }

  /** Lire les messages les marque comme lus côté serveur. */
  messages(conversationId: string): Observable<PageMessages> {
    return this.http.get<PageMessages>(`${this.url}/${conversationId}/messages`);
  }

  envoyer(conversationId: string, contenu: string): Observable<Message> {
    return this.http.post<Message>(`${this.url}/${conversationId}/messages`, { contenu });
  }

  /** Ouvre (ou retrouve) la conversation et y dépose le premier message. */
  creer(n: NouvelleConversation): Observable<ConversationCreee> {
    return this.http.post<ConversationCreee>(this.url, n);
  }
}
