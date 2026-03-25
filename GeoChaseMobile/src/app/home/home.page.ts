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

  // 🌐 MOD 1: Harita
  goToMap() {
    this.router.navigate(['/map']);
  }

  // ⚔️ MOD 2 & 3: Gelecek Modlar İçin
  comingSoon(modeName: string) {
    alert(`🚨 ${modeName} modu şu an geliştirme aşamasında Ajan!`);
  }

  getXpProgress(): number {
    if (!this.playerProfile || this.playerProfile.score === undefined) return 0;
    
    const score = this.playerProfile.score;
    const level = this.playerProfile.level || 1;

    let minScore = 0;
    let maxScore = 500;

    // Senin backend'deki if-else mantığının Frontend'deki karşılığı
    if (level === 1) { 
      minScore = 0; 
      maxScore = 500; 
    } 
    else if (level === 2) { 
      minScore = 500; 
      maxScore = 1000; 
    } 
    else if (level === 3) { 
      minScore = 1000; 
      maxScore = 2000; 
    } 
    else { 
      return 100; // Level 4 veya üstü (Maksimum Seviye) bar hep full kalır
    }

    // Seviye içindeki ilerlemeyi yüzdelik olarak hesapla
    const progress = ((score - minScore) / (maxScore - minScore)) * 100;
    return Math.min(Math.max(progress, 0), 100); // %0 ile %100 arasında tutar
  }

  // 🎯 HEDEF SKOR GÖSTERİCİ (UI'da sonraki seviyeye ne kadar kaldığını yazmak için)
  getNextLevelScore(): number | string {
    if (!this.playerProfile) return 500;
    const level = this.playerProfile.level || 1;

    if (level === 1) return 500;
    if (level === 2) return 1000;
    if (level === 3) return 2000;
    return 'MAX';
  }

}