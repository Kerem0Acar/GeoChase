import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonItem, IonLabel, IonInput, IonButton, IonIcon 
} from '@ionic/angular/standalone';
import { Auth } from '../services/auth'; // Kendi auth servisinin yolunu kontrol et
import { addIcons } from 'ionicons';
import { fingerPrintOutline, personOutline, lockClosedOutline, mailOutline } from 'ionicons/icons';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonBackButton, IonItem, IonLabel, IonInput, IonButton, IonIcon,
    CommonModule, FormsModule
  ]
})
export class RegisterPage implements OnInit {

  username = '';
  password = '';
  email = '';
  

  constructor(private authService: Auth, private router: Router) { 
    addIcons({fingerPrintOutline,personOutline,mailOutline,lockClosedOutline});
  }

  ngOnInit() { }

  register() {
    if (!this.username || !this.password || !this.email) {
      alert("Lütfen tüm alanları doldur Ajan!");
      return;
    }

    const registerData = {
      username: this.username,
      password: this.password,
      email: this.email
    };

    // 🛠️ NOT: authService içinde bir register() metodun olmalı.
    this.authService.register(registerData).subscribe({
      next: (res) => {
        alert("Kayıt Başarılı! Artık Karargaha giriş yapabilirsin.");
        this.router.navigate(['/main']); // Giriş sayfasına geri yolla
      },
      error: (err) => {
        alert("Kayıt başarısız oldu: " + (err.error || 'Bilinmeyen hata'));
      }
    });
  }
}