import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
  IonText, IonBackButton, IonButtons, IonSpinner, IonButton } from '@ionic/angular/standalone';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonButton, 
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
    IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
    IonText, IonBackButton, IonButtons, IonSpinner, CommonModule
  ]
})
export class ProfilePage implements OnInit {
  
  playerProfile: any = null;

  constructor(private authService: Auth, private router: Router) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.playerProfile = data;
      },
      error: (err) => {
        console.error("Profil çekilirken hata oluştu: ", err);
      }
    });
  }

  // 📊 XP BAR HESAPLAYICI
  getXpProgress(): number {
    if (!this.playerProfile || this.playerProfile.score === undefined) return 0;
    
    const score = this.playerProfile.score;
    const level = this.playerProfile.level || 1;

    let minScore = 0;
    let maxScore = 500;

    if (level === 1) { minScore = 0; maxScore = 500; } 
    else if (level === 2) { minScore = 500; maxScore = 1000; } 
    else if (level === 3) { minScore = 1000; maxScore = 2000; } 
    else { return 100; }

    const progress = ((score - minScore) / (maxScore - minScore)) * 100;
    return Math.min(Math.max(progress, 0), 100); 
  }

  // 🎯 HEDEF SKOR GÖSTERİCİ
  getNextLevelScore(): number | string {
    if (!this.playerProfile) return 500;
    const level = this.playerProfile.level || 1;

    if (level === 1) return 500;
    if (level === 2) return 1000;
    if (level === 3) return 2000;
    return 'MAX';
  }

  logout(){
    if(confirm("Karargahtan çıkış yapmak istediğine emin misin?")){
      localStorage.removeItem('jwt_token');
      this.router.navigate(['/login']);
    }
  }

}