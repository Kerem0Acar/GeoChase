import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
  IonText
} from '@ionic/angular/standalone';
import { Auth } from '../services/auth';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, 
    IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
    IonText, CommonModule
  ],
})
export class HomePage implements OnInit{

  playerProfile: any = null;

  constructor(private authService: Auth) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile(){
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.playerProfile = data;
        console.log("Profile has come successfully: "+data);
      },
      error: (err) =>{
        console.error("There is a problem while gethering profile: "+ err)
      }
    })
  }
}
