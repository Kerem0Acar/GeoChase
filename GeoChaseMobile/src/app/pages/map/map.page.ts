import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton 
} from '@ionic/angular/standalone';
// Leaflet kütüphanesini 'L' kısaltmasıyla içeri alıyoruz
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
    CommonModule, FormsModule
  ]
})
export class MapPage implements OnInit {

  map: any;

  constructor() { }

  ngOnInit() {
  }

  ionViewDidEnter(){
    this.initMap()
  }

  initMap(){
    this.map = L.map('mapId').setView([38.7205, 35.4826], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    L.marker([38.7205, 35.4826]).addTo(this.map)
      .bindPopup("<b>Karargah</b><br>Streets Waiting For You!")
      .openPopup();

  }

}
