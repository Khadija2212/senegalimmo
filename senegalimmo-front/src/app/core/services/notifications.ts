import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ENVIRONNEMENT } from '../config/environnement';
import { Notification, ReponseNotifications } from '../modeles/notifications';

/** Notifications reçues par le compte connecté, quel que soit son rôle. */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${ENVIRONNEMENT.apiUrl}/notifications`;

  lister(page = 1): Observable<ReponseNotifications> {
    return this.http.get<ReponseNotifications>(this.url, { params: { page } });
  }

  marquerLue(id: string): Observable<Notification> {
    return this.http.post<Notification>(`${this.url}/${id}/lire`, {});
  }

  toutLire(): Observable<unknown> {
    return this.http.post(`${this.url}/tout-lire`, {});
  }
}
