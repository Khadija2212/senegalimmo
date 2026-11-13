import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NotationService } from '../../services/notation';

@Component({
  selector: 'app-avis',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './avis.html',
  styleUrl: './avis.css'
})
export class Avis implements OnInit {
  data: any = null;
  isLoading = true;
  notFound = false;

  constructor(
    private route: ActivatedRoute,
    private notationService: NotationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.notFound = true;
      this.isLoading = false;
      return;
    }

    this.notationService.avis(id).subscribe({
      next: (res) => {
        this.data = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notFound = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  etoiles(n: number): string {
    const r = Math.round(n);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }
}