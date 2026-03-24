import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServicesService } from '../../services/services.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer implements OnInit {
  services: any[] = [];

  constructor(
    public router: Router,
    private servicesService: ServicesService
  ){}

  async ngOnInit() {
    await this.loadServices();
  }

  async loadServices() {
    try {
      this.services = await this.servicesService.getServices();
      console.log('Footer services loaded:', this.services);
    } catch (error) {
      console.error('Error loading services in footer:', error);
    }
  }

  navigateToService(serviceId: string) {
    this.router.navigate(['/servicesDetail'], { queryParams: { id: serviceId } });
  }
}
