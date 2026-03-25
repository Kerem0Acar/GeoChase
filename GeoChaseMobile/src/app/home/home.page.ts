import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
  IonText, IonSpinner
} from '@ionic/angular/standalone';
import { Auth } from '../services/auth';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
    IonText, IonSpinner, CommonModule
  ],
})
export class HomePage implements OnInit {

  playerProfile: any = null;

  constructor(private authService: Auth, private router: Router) {}

  ngOnInit() {
    this.loadProfile();
  }

  // Haritadan ana sayfaya dönüldüğünde yeni kazanılan puanları çeker
  ionViewWillEnter() {
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

  // 📊 YENİ: XP BAR HESAPLAYICI (playerProfile.score kullanılarak)
  getXpProgress(): number {
    if (!this.playerProfile || this.playerProfile.score === undefined) return 0;
    
    const currentScore = this.playerProfile.score;
    const requiredScoreForNextLevel = 500; // Şimdilik 500'de bir seviye atlıyor sayalım
    const scoreInCurrentLevel = currentScore % requiredScoreForNextLevel;
    
    return (scoreInCurrentLevel / requiredScoreForNextLevel) * 100;
  }

  // 🌐 MOD 1: Harita
  goToMap() {
    this.router.navigate(['/map']);
  }

  // ⚔️ MOD 2 & 3: Gelecek Modlar İçin
  comingSoon(modeName: string) {
    alert(`🚨 ${modeName} modu şu an geliştirme aşamasında Ajan!`);
  }
}