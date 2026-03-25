import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Quest {
  // Backend'in çalıştığı adres
  private apiUrl = 'http://localhost:8080/api/quests';

  constructor(private http: HttpClient) { }

  // 🛡️ JWT Token'ı isteklere ekleyen yardımcı metot
  private getHeaders(): HttpHeaders {
    // İŞTE SİHİRLİ DOKUNUŞ: 'token' yerine F12'de bulduğumuz 'jwt_token' yazıyoruz!
    let token = localStorage.getItem('jwt_token'); 
    
    // (Opsiyonel Güvenlik): Eğer token stringify ile kaydedildiyse baştaki/sondaki tırnakları temizle
    if (token && token.startsWith('"') && token.endsWith('"')) {
      token = token.substring(1, token.length - 1);
    }
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  generateQuest(lat: number, lng: number): Observable<any> {
    const body = { 
      userLatitude: lat, 
      userLongitude: lng 
    };
    return this.http.post(`${this.apiUrl}/generate`, body, { headers: this.getHeaders() });
  }

  // 🎯 Görevi Tamamlamayı Dene (Haversine ile mesafeyi ölçer)
  completeQuest(questId: number, lat: number, lng: number): Observable<any> {
    const body = { 
      userLatitude: lat, 
      userLongitude: lng 
    };
    return this.http.post(`${this.apiUrl}/${questId}/complete`, body, { 
      headers: this.getHeaders(), 
      responseType: 'text' 
    });
  }

  // ❌ Görevi İptal Et
  abandonQuest(questId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${questId}/abandon`, {}, { 
      headers: this.getHeaders(), 
      responseType: 'text' 
    });
  }

  // 📜 Geçmiş ve Aktif Görevlerimi Getir
  getMyQuests(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-quests`, { headers: this.getHeaders() });
  }
}