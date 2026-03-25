import { Component, OnInit, ViewChild, TemplateRef, ViewContainerRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton
} from '@ionic/angular/standalone';
import * as L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonButton, 
    CommonModule, FormsModule
  ]
})
export class MapPage implements OnInit {

  map: any;
  userMarker: any;


  @ViewChild('questPopupTemplate', { static: true }) questPopupTemplate!: TemplateRef<any>;

  constructor(
    private viewContainerRef: ViewContainerRef // Şablonu "çizmek (render)" için gereken motor
  ) { }

  ngOnInit() {
  }

  async ionViewDidEnter() {
    await this.loadMapWithUserLocation();
  }

  async loadMapWithUserLocation() {
    try {
      console.log('GPS Uydularına bağlanılıyor...');
      
      const position = await Geolocation.getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      if (this.map) {
        this.map.remove();
      }

      this.map = L.map('mapId').setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      const userIcon = L.divIcon({
        className: 'user-radar-marker', // CSS'te bu sınıfa animasyon vereceğiz
        html: `
          <div class="radar-pulse"></div>
          <div class="radar-core"></div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20] // Tam merkeze oturtmak için
      });

      // Senin konumunu bu canlı radar ikonla haritaya ekliyoruz
      this.userMarker = L.marker([lat, lng], {icon: userIcon}).addTo(this.map)
        .bindPopup("<b>Ajan Sensin!</b><br>Bölge taranıyor...")
        .openPopup();

      const adjectives = ['Kayıp', 'Gizli', 'Şifreli', 'Karanlık', 'Efsanevi', 'Kritik', 'Hayalet'];
      const nouns = ['Veri Terminali', 'Kripto Anahtarı', 'Siber Kasa', 'Sinyal Vericisi', 'Sunucu Çekirdeği'];
      const questCount = 5; 
      const maxRadius = 0.015; 

      for (let i = 0; i < questCount; i++) {
        const questName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
        const randomLat = lat + (Math.random() - 0.5) * maxRadius;
        const randomLng = lng + (Math.random() - 0.5) * maxRadius;
        const distanceInMeters = Math.round(this.map.distance([lat, lng], [randomLat, randomLng]));


        let diff = 'Kolay';
        let points = 50;
        let color = '#2dd36f'; 

        if (distanceInMeters > 800) {
          diff = 'Çok Zor';
          points = 200;
          color = '#eb445a'; 
        } else if (distanceInMeters > 400) {
          diff = 'Orta';
          points = 100;
          color = '#ffc409'; 
        }

        const questData = {
          title: questName,
          distance: distanceInMeters,
          difficulty: diff,
          points: points,
          color: color
        };

        const popupView = this.viewContainerRef.createEmbeddedView(
          this.questPopupTemplate, 
          { quest: questData } 
        );

        const popupElement = popupView.rootNodes[0] as HTMLElement;

       const questIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="marker-pin-wrapper">
              <div class="marker-pin" style="background: ${color};"></div>
              <span class="marker-text" style="color: #333; text-shadow: 1px 1px 2px #fff;">Görev</span>
            </div>
          `,
          iconSize: [40, 50],
          iconAnchor: [20, 50]
        });

        // İşaretçiyi haritaya eklerken questIcon'u veriyoruz!
        L.marker([randomLat, randomLng], {icon: questIcon}).addTo(this.map)
          .bindPopup(popupElement); 
      }

    } catch (error) {
      console.error('Konum alınırken hata oluştu:', error);
      alert('Sinyal yok!');
    }
  }
}