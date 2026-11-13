import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategorieService } from '../../../services/categorie';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-categories-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './categories-admin.html',
  styleUrls: ['./categories-admin.css']
})
export class CategoriesAdmin implements OnInit {
  categories: any[] = [];
  catForm!: FormGroup;
  editingCat: any = null;
  message = '';
  error = '';

  constructor(
    private fb: FormBuilder,
    private catService: CategorieService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const u = this.auth.getCurrentUser();
    if (!u || u.role !== 'administrateur') {
      this.router.navigate(['/login']);
      return;
    }

    this.initForm();
    this.loadCategories();
  }

  private initForm(): void {
    this.catForm = this.fb.group({
      nom: ['', Validators.required],
      icone: [''],
      description: [''],
    });
  }

  loadCategories(): void {
    this.catService.getAll().subscribe({
      next: (data) => {
        this.categories = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur de chargement.';
        this.cdr.detectChanges();
      }
    });
  }

  saveCat(): void {
    if (this.catForm.invalid) return;

    this.message = '';
    this.error = '';

    if (this.editingCat) {
      this.catService.update(this.editingCat.id, this.catForm.value).subscribe({
        next: () => {
          this.message = 'Catégorie modifiée avec succès.';
          this.cancelEdit();
          this.loadCategories();
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de la modification.';
        }
      });
    } else {
      this.catService.create(this.catForm.value).subscribe({
        next: () => {
          this.message = 'Catégorie ajoutée avec succès.';
          this.catForm.reset();
          this.loadCategories();
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de l\'ajout.';
        }
      });
    }
  }

  editCat(c: any): void {
    this.editingCat = c;
    this.catForm.patchValue({
      nom: c.nom,
      icone: c.icone || '',
      description: c.description || '',
    });
  }

  cancelEdit(): void {
    this.editingCat = null;
    this.catForm.reset();
  }

  deleteCat(c: any): void {
    if (!confirm(`Supprimer la catégorie « ${c.nom} » ?`)) return;

    this.catService.delete(c.id).subscribe({
      next: () => {
        this.message = 'Catégorie supprimée.';
        this.loadCategories();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur de suppression.';
      }
    });
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
