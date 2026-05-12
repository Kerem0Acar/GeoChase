import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner, IonIcon
} from '@ionic/angular/standalone';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { Geolocation } from '@capacitor/geolocation';
import { trigger, transition, style, animate } from '@angular/animations';
import { Quest } from 'src/app/services/quest';
import { ZombieService } from 'src/app/services/zombie-service';
import { addIcons } from 'ionicons';
import { scanOutline, skullOutline } from 'ionicons/icons';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
    CommonModule,
    FormsModule,
    IonIcon,
  ],
  // 🚀 İŞTE SİHİRLİ DOKUNUŞ: Animasyon kuralını buraya ekledik!
  animations: [
    trigger('fadeAlert', [
      // 🟢 GİRİŞ ANİMASYONU (:enter - void => *)
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }), // Şeffaf ve biraz aşağıda başla
        animate(
          '400ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ), // 400ms'de yerine otur
      ]),
      // 🔴 ÇIKIŞ ANİMASYONU (:leave - * => void)
      transition(':leave', [
        style({ opacity: 1 }), // Tam görünür başla
        animate(
          '600ms ease-in-out',
          style({ opacity: 0, transform: 'translateY(-10px)' }),
        ), // 600ms'de (smooth!) yukarı eriyerek yok ol
      ]),
    ]),
  ],
})
export class MapPage implements OnInit {
  map: any;
  userMarker: any;
  private routingControl: any;
  private zombieMarkers: L.Marker[] = []; // Haritadaki zombi iğnelerini tutmak için dizi
  isZombieMode = false;

  // 🚀 ÇOKLU GÖREV İÇİN YENİ DEĞİŞKENLER
  activeQuests: any[] = []; // Haritadaki tüm görevlerin listesi (ACTIVE veya PENDING)
  questMarkers: any[] = []; // Haritadaki Leaflet iğnelerini tuttuğumuz dizi (silmek için)
  selectedQuest: any = null; // Oyuncunun haritadan tıkladığı o anki görev

  userLat: number = 0;
  userLng: number = 0;
  isScanning: boolean = false;
  showSignalsAlert: boolean = false;
  isFadingOut: boolean = false;

  // UI'ı anında güncellemek için ChangeDetectorRef (cdr) eklendi!
  constructor(
    private questService: Quest,
    private cdr: ChangeDetectorRef,
    private zombieService: ZombieService,
    private route: ActivatedRoute
  ) {
    addIcons({ scanOutline, skullOutline });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'zombie') {
        this.isZombieMode = true;
      }
    });
  }

  async ionViewDidEnter() {
    await this.initMapAndLocation();
  }

  // 1. HARİTAYI VE RADARI BAŞLAT
  async initMapAndLocation() {
    try {
      console.log('GPS Uydularına bağlanılıyor...');

      const position = await Geolocation.getCurrentPosition();
      this.userLat = position.coords.latitude;
      this.userLng = position.coords.longitude;

      if (this.map) this.map.remove();

      this.map = L.map('mapId', { zoomControl: false }).setView(
        [this.userLat, this.userLng],
        15,
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(this.map);

      const userIcon = L.divIcon({
        className: 'user-radar-marker',
        html: `
          <div class="radar-pulse"></div>
          <div class="radar-core"></div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      this.userMarker = L.marker([this.userLat, this.userLng], {
        icon: userIcon,
      })
        .addTo(this.map)
        .bindPopup('<b>Ajan Sensin!</b><br>Bölge taranıyor...')
        .openPopup();

      // RADAR KURULDUKTAN SONRA SUNUCUYA SOR
      this.loadMyActiveQuests();
    } catch (error) {
      console.error('Konum alınırken hata oluştu:', error);
      alert('Sinyal yok! GPS açtığından emin ol.');
    }
  }

  // Aktif (Kabul Edilmiş) bir görev var mı kontrolü
  get isQuestAccepted(): boolean {
    return (
      this.activeQuests.length === 1 && this.activeQuests[0].status === 'ACTIVE'
    );
  }

  // 2. MEVCUT GÖREVLERİ YÜKLE (PENDING veya ACTIVE)
  loadMyActiveQuests() {
    this.questService.getMyQuests().subscribe({
      next: (quests: any[]) => {
        // Hem aktif olanları hem de bekleyenleri listeye al
        this.activeQuests = quests.filter((q) => q.status === 'ACTIVE');

        if (this.activeQuests.length > 0) {
          // Eğer tek bir ACTIVE görev varsa, onu otomatik seçili yap
          const active = this.activeQuests.find((q) => q.status === 'ACTIVE');
          if (active) {
            this.selectedQuest = active;
          }
          this.drawAllQuestMarkers();
        }
      },
      error: (err: any) => console.error('Görevler yüklenemedi:', err),
    });
  }

  // 3. SAHA TARAMASI YAP (5 GÖREV ÜRETİR)
  scanForQuests() {
    this.isScanning = true;
    this.questService.generateQuest(this.userLat, this.userLng).subscribe({
      next: (newQuests: any[]) => {
        this.activeQuests = newQuests;
        this.selectedQuest = null;
        this.drawAllQuestMarkers();
        this.isScanning = false;

        // 🚀 İŞTE SİHİR BURADA: Kartı göster, 3.5 saniye sonra gizle!
        this.showSignalsAlert = true;
        this.isFadingOut = false; // Başlangıçta tam görünür

        setTimeout(() => {
          // 1. Aşama: 3.5 saniye sonra CSS "erime" animasyonunu başlat
          this.isFadingOut = true;

          setTimeout(() => {
            // 2. Aşama: Erime bittikten sonra (600ms) kartı ekrandan tamamen sil
            this.showSignalsAlert = false;
            this.isFadingOut = false;
          }, 600);
        }, 3500);

        // Haritayı hizalama
        const bounds = L.latLngBounds([[this.userLat, this.userLng]]);
        newQuests.forEach((q) => {
          if (q.targetLatitude && q.targetLongitude) {
            bounds.extend([q.targetLatitude, q.targetLongitude]);
          }
        });
        this.map.fitBounds(bounds, { padding: [50, 50] });
      },
      error: (err: any) => {
        alert(err.error || 'Saha taraması başarısız!');
        this.isScanning = false;
      },
    });
  }

  // 🚀 YENİ METOT: HARİTAYA 5 İĞNEYİ BİRDEN ÇİZ VE TIKLAMA ÖZELLİĞİ EKLE
  drawAllQuestMarkers() {
    // Önce eski iğneleri haritadan tamamen temizle
    this.questMarkers.forEach((m) => this.map.removeLayer(m));
    this.questMarkers = [];

    this.activeQuests.forEach((quest) => {
      // Zorluğa göre renk belirle (Zor=Kırmızı, Orta=Sarı, Kolay=Yeşil)
      const color =
        quest.difficulty === 'Zor'
          ? '#eb445a'
          : quest.difficulty === 'Orta'
            ? '#ffc409'
            : '#2dd36f';

      const questIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="marker-pin-wrapper">
            <div class="marker-pin" style="background: ${color};"></div>
            <span class="marker-text" style="color: #333; text-shadow: 1px 1px 2px #fff;">${quest.difficulty || 'Hedef'}</span>
          </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 50],
      });

      // İğneyi oluştur ve haritaya ekle
      const marker = L.marker([quest.targetLatitude, quest.targetLongitude], {
        icon: questIcon,
      })
        .addTo(this.map)
        .on('click', () => {
          // TIKLAMA OLAYI: İğneye tıklanınca o görevi seç ve Angular'ı uyar
          this.selectedQuest = quest;
          this.cdr.detectChanges(); // UI'ı anında güncelle!
          this.map.setView([quest.targetLatitude, quest.targetLongitude], 16); // Kamerayı iğneye yaklaştır
        });

      this.questMarkers.push(marker); // Silmek için listeye ekle
    });
  }

  // 🚀 YENİ METOT: SEÇİLİ GÖREVİ KABUL ET
  acceptSelectedQuest() {
    if (!this.selectedQuest) return;

    this.questService.acceptQuest(this.selectedQuest.id).subscribe({
      next: () => {
        alert('Görev Kabul Edildi! Hedefe doğru ilerle.');
        this.selectedQuest.status = 'ACTIVE';

        // Diğer çöpe giden (PENDING) görevleri listemizden temizle
        this.activeQuests = [this.selectedQuest];

        // Haritayı güncelle (Diğer 4 iğne yok olacak)
        this.drawAllQuestMarkers();
        this.map.setView([this.userLat, this.userLng], 15);
      },
      error: (err: any) => alert(err.error || 'Görev kabul edilemedi.'),
    });
    this.drawRouteToQuest(); // Görevi kabul eder etmez rotayı çiz!
  }

  // 4. GÖREVİ TAMAMLAMAYI DENE
  tryCompleteQuest() {
    if (!this.selectedQuest) return;

    Geolocation.getCurrentPosition()
      .then((pos) => {
        this.questService
          .completeQuest(
            this.selectedQuest.id,
            pos.coords.latitude,
            pos.coords.longitude,
          )
          .subscribe({
            next: (responseMessage: string) => {
              alert(responseMessage);
              this.clearQuest();
            },
            error: (err: any) => {
              alert(err.error || 'Görev tamamlanamadı.');
            },
          });
      })
      .catch((err) => alert('Güncel konum alınamadı!'));
  }

  // 5. GÖREVİ İPTAL ET
  abandonQuest() {
    if (!this.selectedQuest) return;

    if (confirm('Görevi iptal etmek istediğine emin misin?')) {
      this.questService.abandonQuest(this.selectedQuest.id).subscribe({
        next: () => {
          alert('Görev iptal edildi.');
          this.clearQuest();
        },
        error: (err: any) => alert('İptal işlemi başarısız.'),
      });

      if (this.routingControl) {
        this.map.removeControl(this.routingControl);
        this.routingControl = null;
      }
    }
  }

  // EKRAN TEMİZLEYİCİ
  clearQuest() {
    this.activeQuests = [];
    this.selectedQuest = null;
    if (this.questMarkers.length > 0) {
      this.questMarkers.forEach((m) => this.map.removeLayer(m));
      this.questMarkers = [];
    }
    this.map.setView([this.userLat, this.userLng], 15);
  }

  drawRouteToQuest() {
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
    }

    if (this.selectedQuest && this.userLat && this.userLng) {
      const routingOptions: any = {
        waypoints: [
          L.latLng(this.userLat, this.userLng),
          L.latLng(
            this.selectedQuest.targetLatitude,
            this.selectedQuest.targetLongitude,
          ),
        ],
        lineOptions: {
          styles: [{ color: '#2dd36f', opacity: 0.8, weight: 6 }],
        },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false,
      };

      this.routingControl = (L as any).Routing.control(routingOptions).addTo(
        this.map,
      );
    }
  }

  scanForThreats() {
    if (!this.userLat || !this.userLng) return;

    const currentHeading = 0;

    this.zombieService
      .triggerAmbush(this.userLat, this.userLng, currentHeading)
      .subscribe({
        next: (response: any) => {
          // BAŞARILI DURUM: Gelen verinin içini görmek için:
          alert('Radar Yanıtı: ' + JSON.stringify(response));
          this.drawZombiesOnMap(response.zombies);
        },
        error: (err) => {
          // HATA DURUMU: Hatanın gerçek sebebini görmek için:
          alert('Bağlantı Hatası: ' + JSON.stringify(err.error || err.message));
        },
      });
  }

  drawZombiesOnMap(zombies: any[]) {
    // 1. Önce eski zombileri haritadan temizle (Hareket ediyormuş hissi vermek için)
    this.zombieMarkers.forEach((marker) => this.map.removeLayer(marker));
    this.zombieMarkers = [];

    // 2. Siberpunk tarzı parlayan kırmızı zombi ikonu tasarımı
    const cyberZombieIcon = L.divIcon({
      className: 'cyber-zombie-icon',
      html: `<div style="
        width: 16px;
        height: 16px;
        background-color: #ff2a2a;
        border: 2px solid #fff;
        border-radius: 50%;
        box-shadow: 0 0 15px #ff2a2a, 0 0 30px #ff2a2a;
        animation: pulse 1.5s infinite;"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8], // İkonun tam merkezini koordinata oturtur
    });

    zombies.forEach((z) => {
      const marker = L.marker([z.lat, z.lng], { icon: cyberZombieIcon }).addTo(
        this.map,
      );

      // Üzerine tıklanınca çıkacak uyarı ekranı
      marker.bindPopup(`
        <div style="color: red; text-align: center; font-family: monospace;">
          <strong>⚠ BİYOLOJİK TEHDİT ⚠</strong><br>
          Sınıf: ${z.type}
        </div>
      `);

      this.zombieMarkers.push(marker);
    });
  }
}
