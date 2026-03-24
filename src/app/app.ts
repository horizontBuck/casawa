import { Component, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { Header } from "./components/header/header";
import { Footer } from "./components/footer/footer";
import { ScriptService } from './services/script.service';
import { Calculator } from './page/calculator/calculator';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Header,
    Footer,
    CommonModule,
    Calculator
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = signal('casawa');
  layoutStyle: string = "default";
  deviceInfo: any = null
  phoneNumber: string = '9198855401';
  email: string = 'admin@casainstall.com';
  menuOpen: boolean = false;

  @ViewChild('calculator') calculator: any;

  

  constructor(
        public router: Router,
        public script: ScriptService
  ) 
  {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.layoutStyle = this.router.url === '/home' ? 'default' : 'dark';
      }
    });
    this.script.load(
      
      'jquery',
      'viewport',
      'niceSelect',
      'waypoints',
      'counterup',
      'swiper',
      'meanMenu',
      'magnificPopup',
      'wow',
      'main',
      

    )
      .then(() => {
         console.log('Todos los scripts se cargaron correctamente');
      })
      .catch(error => console.log(error));
      

    
  }
  toggleMenu() {
      this.menuOpen = !this.menuOpen;
    }
  
    sendSMS() {
      window.open(`sms:${this.phoneNumber}`, '_self');
    }
  
    makeCall() {
      window.open(`tel:${this.phoneNumber}`, '_self');
    }
    sendEmail() {
      window.open(`mailto:${this.email}`, '_self');
    }
    openCalculator() {
    if (this.calculator) {
      // We'll need to implement the showModal method in the Calculator component
      this.calculator.showModal();
    }
  }

}
