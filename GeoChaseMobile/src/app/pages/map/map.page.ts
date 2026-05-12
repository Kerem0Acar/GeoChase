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
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';


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
  private activeZombies: any[] = [];
  private chaseInterval: any;

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
    private route: ActivatedRoute,
    private alertController: AlertController,
    private router: Router,
  ) {
    addIcons({ scanOutline, skullOutline });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['mode'] === 'zombie') {
        this.isZombieMode = true;
      }
    });
  }

  async ionViewDidEnter() {
    await this.initMapAndLocation();
  }

  ionViewWillLeave() {
    console.log('Harita sayfasından çıkılıyor, temizlik yapılıyor...');
    this.fullSystemShutdown();
  }

  fullSystemShutdown() {
    if(this.chaseInterval){
      clearInterval(this.chaseInterval);
      this.chaseInterval = null;

      if(this.zombieMarkers && this.zombieMarkers.length > 0){
        this.zombieMarkers.forEach(marker => this.map.removeLayer(marker));
      }

      this.zombieMarkers = [];
      this.activeZombies = [];

      this.isZombieMode = false;
    }
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
  // Önceki temizlik ve interval durdurma işlemleri aynı kalıyor
  if (this.chaseInterval) clearInterval(this.chaseInterval);
  this.zombieMarkers.forEach(marker => this.map.removeLayer(marker));
  this.zombieMarkers = [];
  this.activeZombies = [];

  // Zombileri haritaya yerleştir ve takip listesine ekle
  zombies.forEach(z => {

    // --- 🚀 YENİ: Zombi Türüne Göre İkon Belirleme ---
    let zombieIcon: L.DivIcon;
    let iconColor: string;
    let alertColor: string;

    switch (z.type) {
      case "Sıçrayan": // Kuş Uçuşu Gelen (Cyan Mavi, Titrek)
        iconColor = "#2affff"; // Parlak Cyan
        alertColor = "#00cccc"; // Koyu Cyan (Alert için)
        zombieIcon = L.divIcon({
          className: 'zombie-icon-leaper',
          html: `<div style="width: 20px; height: 20px; background-color: ${iconColor}; border: 2px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #000; font-size: 14px; font-weight: bold; animation: flicker-blue 1s infinite; box-shadow: 0 0 15px ${iconColor};">⚡</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        break;

      case "Avcı": // Sinsi (Mor, Yavaş)
        iconColor = "#7a2aff"; // Mor
        alertColor = "#5a1fcc";
        zombieIcon = L.divIcon({
          className: 'zombie-icon-stalker',
          html: `<div style="width: 18px; height: 18px; background-color: ${iconColor}; border: 2px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: bold; animation: stealth-purple 3s infinite; box-shadow: 0 0 10px ${iconColor};">👁</div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        break;

      default: // Sokak Gezgini (Kırmızı, Normal)
        iconColor = "#ff2a2a"; // Kırmızı
        alertColor = "#cc1a1a";
        zombieIcon = L.divIcon({
          className: 'zombie-icon-walker',
          html: `<div style="width: 16px; height: 16px; background-color: ${iconColor}; border: 2px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px; font-weight: bold; animation: pulse-red 1.5s infinite; box-shadow: 0 0 10px ${iconColor};">🧟</div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        break;
    }
    // ----------------------------------------------------

    const marker = L.marker([z.lat, z.lng], { icon: zombieIcon }).addTo(this.map);

    // Popup içeriğini de zombi rengine göre güncelliyoruz
    marker.bindPopup(`
      <div style="color: ${alertColor}; text-align: center; font-family: monospace;">
        <strong>⚠ ${z.type} ⚠</strong><br>
        Sana doğru geliyor!
      </div>
    `);

    this.zombieMarkers.push(marker);

    // Zombinin hareket aklını (State) kaydediyoruz (Aynı kalıyor)
    this.activeZombies.push({
      marker: marker,
      route: z.route || [],
      currentStep: 0,
      type: z.type
    });
  });

  // Kovalamaca Motorunu Ateşle!
  this.startChaseMotor();
}

  startChaseMotor() {
    // Süreyi 1 saniyeden 2 saniyeye (2000ms) çıkararak 'Tick Rate'i yavaşlatıyoruz
    this.chaseInterval = setInterval(() => {
      this.activeZombies.forEach((zombie) => {
        let currentPos = zombie.marker.getLatLng();
        let targetPos = L.latLng(this.userLat, this.userLng);

        if (
          zombie.route &&
          zombie.route.length > 0 &&
          zombie.currentStep < zombie.route.length
        ) {
          // A) SOKAK TAKİBİ: Rota noktalarını atlamadan sırayla git (Interval uzadığı için yavaşladı)
          const nextPoint = zombie.route[zombie.currentStep];
          zombie.marker.setLatLng([nextPoint.lat, nextPoint.lng]);
          zombie.currentStep++;
        } else {
          // B) KUŞ UÇUŞU (VEKTÖREL): Adım büyüklüğünü %10'dan %3'e düşürüyoruz
          // Bu, zombinin daha 'ağır' süzülmesini sağlar
          const moveLat =
            currentPos.lat + (targetPos.lat - currentPos.lat) * 0.03;
          const moveLng =
            currentPos.lng + (targetPos.lng - currentPos.lng) * 0.03;
          zombie.marker.setLatLng([moveLat, moveLng]);
        }

        // Temas kontrolü (Mesafe 10 metrenin altına inerse)
        const distance = this.map.distance(
          zombie.marker.getLatLng(),
          targetPos,
        );
        if (distance < 10) {
          this.handlePlayerCaught(zombie.type);
        }
      });
    }, 2000); // 2 saniyede bir adım
  }

  // Zombi oyuncuyu yakaladığında çalışacak protokol
  async handlePlayerCaught(zombieType: string) {
    // Motoru ve temizlik işlemlerini hemen durdur
    if (this.chaseInterval) clearInterval(this.chaseInterval);
    this.fullSystemShutdown();

    // Ekrana uyarı çıkart (Gelişmiş bir Alert kullanıyoruz)
    const alert = await this.alertController.create({
      header: 'YAKALANDIN!',
      subHeader: `${zombieType} tarafından pusuya düşürüldün.`,
      message: 'Güvenli bölgeye geri çekiliyorsun...',
      buttons: ['TAMAM'],
      cssClass: 'zombie-alert', // İstersen CSS ile kırmızı yapabilirsin
    });

    await alert.present();

    // Haritayı ve sistemleri sıfırla
    this.resetMapStatus();
  }

  resetMapStatus() {
    // Tüm zombi marker'larını haritadan sil
    this.zombieMarkers.forEach((m) => this.map.removeLayer(m));
    this.zombieMarkers = [];
    this.activeZombies = [];

    // Zombi modundan çık veya haritayı ilk haline döndür
    this.isZombieMode = false;
    // Kullanıcıyı ana sayfaya yolla veya haritayı temizle
    this.router.navigate(['/home']);
  }

  ngonDestroy() {
    if (this.chaseInterval) clearInterval(this.chaseInterval);
  }
}
