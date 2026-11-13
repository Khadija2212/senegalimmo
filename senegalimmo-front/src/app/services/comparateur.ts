import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComparateurService {
  private key = 'senegalimmo_comparateur';
  private biensSubject = new BehaviorSubject<any[]>([]);
  public biens$ = this.biensSubject.asObservable();

  constructor() {
    const saved = localStorage.getItem(this.key);
    if (saved) {
      try {
        this.biensSubject.next(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem(this.key);
      }
    }
  }

  getBiens(): any[] {
    return this.biensSubject.value;
  }

  isInComparison(bienId: number): boolean {
    return this.biensSubject.value.some(b => b.id === bienId);
  }

  toggle(bien: any): { added: boolean; message: string } {
    const list = [...this.biensSubject.value];
    const index = list.findIndex(b => b.id === bien.id);

    if (index > -1) {
      list.splice(index, 1);
      this.update(list);
      return { added: false, message: 'Bien retiré du comparateur.' };
    }

    if (list.length >= 3) {
      return { added: false, message: 'Vous ne pouvez comparer que 3 biens à la fois.' };
    }

    list.push(bien);
    this.update(list);
    return { added: true, message: 'Bien ajouté au comparateur.' };
  }

  remove(bienId: number): void {
    const list = this.biensSubject.value.filter(b => b.id !== bienId);
    this.update(list);
  }

  clear(): void {
    this.update([]);
  }

  private update(list: any[]): void {
    localStorage.setItem(this.key, JSON.stringify(list));
    this.biensSubject.next(list);
  }
}
