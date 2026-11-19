export type CanalNotification = 'push' | 'sms' | 'email';

export interface Notification {
  id: string;
  compte_id: string;
  canal: CanalNotification;
  titre: string;
  contenu: string;
  envoyee_le: string | null;
  lue_le: string | null;
  created_at: string;
}

export interface PageNotifications {
  data: Notification[];
  current_page: number;
  last_page: number;
  total: number;
}

/** Réponse de GET /notifications : le nombre de non lues et une page de notifications. */
export interface ReponseNotifications {
  non_lues: number;
  notifications: PageNotifications;
}
