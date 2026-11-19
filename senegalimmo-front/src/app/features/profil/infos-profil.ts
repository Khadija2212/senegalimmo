import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { ModificationProfil, ProfilCompte } from '../../core/modeles/profil';
import { messageErreur } from '../../core/services/demarches';
import { ProfilService } from '../../core/services/profil';
import { SessionService } from '../../core/session/session';
import { erreursParChamp } from '../connexion/erreurs';
import { messageChamp } from './erreurs';
import {
  TYPES_PHOTO,
  controlerFichier,
  dateSaisie,
  etatValidation,
  initiales,
  photoAffichable,
} from './profil-vue';
import { TEXTES_PROFIL } from './textes';

/** Même règle que ProfilController : « + » facultatif, puis 9 à 15 chiffres ou espaces. */
const TELEPHONE = /^\+?[0-9 ]{9,15}$/;
const MAX_NOM = 100;
const MAX_PROFESSION = 120;
const MAX_ADRESSE = 255;
const MAX_CARTE = 60;

function datePassee(c: AbstractControl<string>): ValidationErrors | null {
  return c.value && new Date(c.value) >= new Date(new Date().toDateString())
    ? { future: true }
    : null;
}

/** Bloc « Vos informations » : identité, photo et champs propres au rôle, POST /profil. */
@Component({
  selector: 'si-infos-profil',
  imports: [ReactiveFormsModule, HlmButton, HlmInput, HlmLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './infos-profil.html',
  styleUrl: '../../shared/espace/lien-texte.css',
  host: { class: 'block min-w-0' },
})
export class InfosProfil {
  readonly compte = input.required<ProfilCompte>();
  readonly enregistre = output<ProfilCompte>();

  protected readonly textes = TEXTES_PROFIL;
  protected readonly message = messageChamp;
  private readonly service = inject(ProfilService);
  private readonly session = inject(SessionService);

  protected readonly enCours = signal(false);
  protected readonly succes = signal(false);
  protected readonly alerte = signal<string | null>(null);
  protected readonly photo = signal<File | null>(null);
  protected readonly erreurPhoto = signal<string | null>(null);
  protected readonly apercu = signal<string | null>(null);

  protected readonly role = computed(() => this.compte().role);
  protected readonly validation = computed(() => etatValidation(this.compte().statut_validation));
  protected readonly image = computed(
    () => this.apercu() ?? photoAffichable(this.compte().photo_lien),
  );
  protected readonly lettres = computed(() => initiales(this.compte().prenom, this.compte().nom));

  protected readonly form = new FormGroup({
    prenom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(MAX_NOM)],
    }),
    nom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(MAX_NOM)],
    }),
    telephone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(TELEPHONE)],
    }),
    date_naissance: new FormControl('', { nonNullable: true, validators: [datePassee] }),
    profession: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(MAX_PROFESSION)],
    }),
    adresse: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(MAX_ADRESSE)],
    }),
    agence: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(MAX_PROFESSION)],
    }),
    numero_carte_professionnelle: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(MAX_CARTE)],
    }),
  });

  constructor() {
    effect(() => this.form.reset(valeursInitiales(this.compte())));
    inject(DestroyRef).onDestroy(() => this.remplacerApercu(null));
  }

  protected choisirPhoto(evenement: Event): void {
    const champ = evenement.target as HTMLInputElement;
    const f = champ.files?.[0];
    champ.value = '';
    if (!f) return;
    const refus = controlerFichier(f, TYPES_PHOTO, this.textes.typeImage);
    this.erreurPhoto.set(refus);
    if (refus) return;
    this.photo.set(f);
    this.remplacerApercu(URL.createObjectURL(f));
  }

  protected envoyer(): void {
    this.alerte.set(null);
    this.succes.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enCours.set(true);
    this.service.modifier(this.modification()).subscribe({
      next: (c) => {
        this.enCours.set(false);
        this.photo.set(null);
        this.enregistre.emit(c);
        this.succes.set(true);
        void this.session.charger();
      },
      error: (e: unknown) => {
        this.enCours.set(false);
        this.afficherRefus(e);
      },
    });
  }

  /** Seuls les champs du rôle partent : le backend refuserait les autres. */
  private modification(): ModificationProfil {
    const v = this.form.getRawValue();
    const photo = this.photo();
    const telephone = v.telephone.trim();
    const base: ModificationProfil = {
      prenom: v.prenom.trim(),
      nom: v.nom.trim(),
      ...(telephone ? { telephone } : {}),
      ...(photo ? { photo } : {}),
    };
    switch (this.role()) {
      case 'client':
        return { ...base, date_naissance: v.date_naissance, profession: v.profession };
      case 'proprietaire':
        return { ...base, adresse: v.adresse };
      case 'agent':
        return {
          ...base,
          agence: v.agence,
          numero_carte_professionnelle: v.numero_carte_professionnelle,
        };
      default:
        return base;
    }
  }

  private afficherRefus(e: unknown): void {
    const parChamp = erreursParChamp(e);
    if (parChamp['photo']) this.erreurPhoto.set(parChamp['photo']);
    const champs = Object.keys(parChamp).filter((c) => c in this.form.controls);
    for (const champ of champs) {
      const controle = this.form.get(champ);
      controle?.setErrors({ serveur: parChamp[champ] });
      controle?.markAsTouched();
    }
    if (!champs.length && !parChamp['photo']) {
      this.alerte.set(messageErreur(e, this.textes.erreurEnvoi));
    }
  }

  private remplacerApercu(url: string | null): void {
    const ancien = this.apercu();
    if (ancien) URL.revokeObjectURL(ancien);
    this.apercu.set(url);
  }
}

type ValeursInfos = InfosProfil['form']['value'];

function valeursInitiales(c: ProfilCompte): ValeursInfos {
  return {
    prenom: c.prenom,
    nom: c.nom,
    telephone: c.telephone ?? '',
    date_naissance: dateSaisie(c.date_naissance),
    profession: c.profession ?? '',
    adresse: c.adresse ?? '',
    agence: c.agence ?? '',
    numero_carte_professionnelle: c.numero_carte_professionnelle ?? '',
  };
}
