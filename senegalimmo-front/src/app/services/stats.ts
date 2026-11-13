import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  constructor(private http: HttpClient) {}

  get(): Observable<any> {
    return this.http.get<any>('http://127.0.0.1:8000/api/stats');
  }
}