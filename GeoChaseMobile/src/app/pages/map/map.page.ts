import { Component, OnInit } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner // Yeni HUD için eklendi
} from '@ionic/angular/standalone';
import * as L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';
// GERÇEK BACKEND SERVİSİMİZ
import { Quest } from 'src/app/services/quest';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, 
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner, // HUD bileşenleri
    CommonModule, FormsModule
  ]
})
export class MapPage implements OnInit {

  map: any;
  userMarker: any;
  questMarker: any; // Haritadaki gerçek görev iğnesi

  userLat: number = 0;
  userLng: number = 0;

  activeQuest: any = null; // Backend'den gelecek görev burada duracak
  isScanning: boolean = false; // "Saha Taraması" butonu yüklenme animasyonu için

  // Servisimizi constructor içine enjekte ettik
  constructor(private questService: Quest) { }

  ngOnInit() {
  }

  async ionViewDidEnter() {
    await this.initMapAndLocation();
  }

  // 1. HARİTAYI VE OYUNCU RADARINI BAŞLAT
  async initMapAndLocation() {
    try {
      console.log('GPS Uydularına bağlanılıyor...');
      
      const position = await Geolocation.getCurrentPosition();
      this.userLat = position.coords.latitude;
      this.userLng = position.coords.longitude;
      
      if (this.map) {
        this.map.remove();
      }

      this.map = L.map('mapId', { zoomControl: false }).setView([this.userLat, this.userLng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      const userIcon = L.divIcon({
        className: 'user-radar-marker',
        html: `
          <div class="radar-pulse"></div>
          <div class="radar-core"></div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20] 
      });

      this.userMarker = L.marker([this.userLat, this.userLng], {icon: userIcon}).addTo(this.map)
        .bindPopup("<b>Ajan Sensin!</b><br>Bölge taranıyor...")
        .openPopup();

      // RADAR KURULDUKTAN SONRA SUNUCUYA SOR: "Aktif görevim var mı?"
      this.loadMyActiveQuest();

    } catch (error) {
      console.error('Konum alınırken hata oluştu:', error);
      alert('Sinyal yok! GPS açtığından emin ol.');
    }
  }

  // 2. BACKEND'DEN AKTİF GÖREVİ GETİR
  loadMyActiveQuest() {
    this.questService.getMyQuests().subscribe({
      next: (quests: any[]) => {
        const active = quests.find(q => q.status === 'ACTIVE');
        if (active) {
          this.activeQuest = active; // Görevi değişkene at (Ekranda HUD çıkacak)
          
          // Eğer backend koordinat döndüyse haritaya iğne çiz
          if(active.targetLatitude && active.targetLongitude) {
             this.drawQuestMarker(active.targetLatitude, active.targetLongitude);
          }
        }
      },
      
      error: (err: any) => console.error('Görevler yüklenemedi:', err)
    });
  }

  // 3. YENİ GÖREV ÜRET (Saha Taraması Yap Butonuna Basılınca Çalışır)
  scanForQuests() {
    this.isScanning = true;
    this.questService.generateQuest(this.userLat, this.userLng).subscribe({
      next: (newQuest: any) => {
        this.activeQuest = newQuest;
        this.drawQuestMarker(newQuest.targetLatitude, newQuest.targetLongitude);
        this.isScanning = false;
        
        // Haritayı hem seni hem de görevi içine alacak şekilde genişlet/ortala
        const bounds = L.latLngBounds([
          [this.userLat, this.userLng],
          [newQuest.targetLatitude, newQuest.targetLongitude]
        ]);
        this.map.fitBounds(bounds, { padding: [50, 50] });
      },
      error: (err: { error: any; }) => {
        alert(err.error || 'Saha taraması başarısız!');
        this.isScanning = false;
      }
    });
  }

  // 4. GÖREVİ TAMAMLAMAYI DENE (Hedefe Ulaştım Butonuna Basılınca)
  tryCompleteQuest() {
    // Tamamlarken anlık konumu tekrar alıyoruz ki oyuncu yürüdüyse algılayabilelim
    Geolocation.getCurrentPosition().then(pos => {
      const currentLat = pos.coords.latitude;
      const currentLng = pos.coords.longitude;

      this.questService.completeQuest(this.activeQuest.id, currentLat, currentLng).subscribe({
        next: (responseMessage: string) => {
          alert(responseMessage); // "Congrats! Earning Point: 50..."
          this.clearQuest(); // Görevi ekrandan sil
        },
        error: (err: { error: any; }) => {
          // 50 metreden uzaksak backend'den dönen hatayı göster ("Remaining distance: 150m")
          alert(err.error || 'Görev tamamlanamadı.');
        }
      });
    }).catch(err => alert("Güncel konum alınamadı!"));
  }

  // 5. GÖREVİ İPTAL ET
  abandonQuest() {
    if(confirm("Görevi iptal etmek istediğine emin misin?")) {
      this.questService.abandonQuest(this.activeQuest.id).subscribe({
        next: () => {
          alert("Görev iptal edildi.");
          this.clearQuest();
        },
        error: (err: any) => alert("İptal işlemi başarısız.")
      });
    }
  }

  // HARİTAYA KIRMIZI GÖREV İĞNESİ ÇİZME YARDIMCISI
  drawQuestMarker(lat: number, lng: number) {
    if (this.questMarker) this.map.removeLayer(this.questMarker);
    
    const questIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="marker-pin-wrapper">
          <div class="marker-pin" style="background: #eb445a;"></div>
          <span class="marker-text" style="color: #333; text-shadow: 1px 1px 2px #fff;">Hedef</span>
        </div>
      `,
      iconSize: [40, 50],
      iconAnchor: [20, 50]
    });

    this.questMarker = L.marker([lat, lng], {icon: questIcon}).addTo(this.map);
  }

  // EKRAN TEMİZLEYİCİ (Görev bitince veya iptal edilince çalışır)
  clearQuest() {
    this.activeQuest = null;
    if (this.questMarker) {
      this.map.removeLayer(this.questMarker);
      this.questMarker = null;
    }
    // Haritayı tekrar senin konumuna yakınlaştır
    this.map.setView([this.userLat, this.userLng], 15);
  }
}