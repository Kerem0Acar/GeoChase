import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class Auth {

  private apiUrl = "http://localhost:8080/api/players";

  constructor(private http: HttpClient){}

  login(username: string, password: string){
    return this.http.post<any>(`${this.apiUrl}/login`, {username,password})
            .pipe(
              tap(response =>{
                if(response && response.token){
                  localStorage.setItem('jwt_token', response.token);
                  console.log('Token başarıyla kasaya kilitlendi!')
                }

              })
            )
  }
  
}
