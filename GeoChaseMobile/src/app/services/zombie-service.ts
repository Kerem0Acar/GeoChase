import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ZombieService {
  private apiUrl = 'http://localhost:8080/api/zombies';

  constructor(private http: HttpClient) {}


  triggerAmbush(lat: number, lng: number, heading: number): Observable<any> {
    const payload = { lat, lng, heading };
    return this.http.post(`${this.apiUrl}/ambush`, payload);
  }

}
