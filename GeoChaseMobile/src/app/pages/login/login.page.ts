import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonItem, IonLabel, IonInput, IonButton 
} from '@ionic/angular/standalone';
import { Auth } from 'src/app/services/auth';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonItem, IonLabel, IonInput, IonButton,
    CommonModule, FormsModule
  ]
})
export class LoginPage implements OnInit {

  username = '';
  password = '';

  constructor(
    private authService: Auth,
    private router: Router
  ) { }

  ngOnInit() {
  }

  // Butona tıklandığında çalışacak fonksiyon
  onLogin() {
    console.log("Login requets has been sending...");

    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        console.log("Login succesfully! Response of server: ", response);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.log("Login is denied! Error: "+err);
        alert("Please checkout your informations!")
      }
    })
  }



}