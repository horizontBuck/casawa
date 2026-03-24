import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ServicesService } from '../../services/services.service';
import { AuthPocketbaseService } from '../../services/auth.service';

@Component({
  selector: 'app-services-detail',
  imports: [CommonModule],
  templateUrl: './services-detail.html',
  styleUrl: './services-detail.scss',
})
export class ServicesDetail implements OnInit {
  service: any = null;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private servicesService: ServicesService,
    private authService: AuthPocketbaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadService(id);
      }
    });
  }

  async loadService(id: string) {
    try {
      const services = await this.servicesService.getServices();
      this.service = services.find(s => s.id === id);
      if (this.service && typeof this.service.items === 'string') {
        this.service.items = JSON.parse(this.service.items);
      }
      if (this.service && typeof this.service.descriptionItems === 'string') {
        this.service.descriptionItems = JSON.parse(this.service.descriptionItems);
      }
      if (this.service && typeof this.service.lidescription === 'string') {
        this.service.lidescription = JSON.parse(this.service.lidescription);
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading service:', error);
    }
  }

  getImageUrl(imageName: string): string {
    return this.authService.fileUrl(this.service, imageName) || '';
  }
}
