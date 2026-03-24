import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ServicesService } from '../../services/services.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header implements OnInit {
  phoneNumber: string = '9198855401';
  menuOpen: boolean = false;
  servicesDropdownOpen: boolean = false;
  services: any[] = [];
  showLoginModal: boolean = false;
  loginUsername: string = '';
  loginPassword: string = '';
  loginError: string = '';
  servicesLoading: boolean = false;
mobileMenuOpen = false;
mobileServicesOpen = false;
  constructor(
    public router: Router,
    private servicesService: ServicesService,
    private cdr: ChangeDetectorRef
  ){}

  ngOnInit() {
    this.loadServices();
  }
toggleMobileMenu() {
  this.mobileMenuOpen = !this.mobileMenuOpen;
}
toggleMobileServices(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  this.mobileServicesOpen = !this.mobileServicesOpen;
}
goToMobile(route: string) {
  this.mobileMenuOpen = false;
  this.mobileServicesOpen = false;

  this.router.navigateByUrl(route).then(() => {
    setTimeout(() => window.scrollTo(0, 0), 50);
  });
}

goToMobileService(serviceId: string) {
  this.mobileMenuOpen = false;
  this.mobileServicesOpen = false;

  this.router.navigate(['/servicesDetail'], {
    queryParams: { id: serviceId }
  }).then(() => {
    setTimeout(() => window.scrollTo(0, 0), 50);
  });
}
  async loadServices(retryCount = 0) {
    try {
      this.servicesLoading = true;
      this.services = await this.servicesService.getServices();
      console.log('Services loaded:', this.services);
      this.servicesLoading = false;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading services:', error);
      this.servicesLoading = false;

      // Retry once if it's the first attempt
      if (retryCount === 0) {
        console.log('Retrying to load services...');
        setTimeout(() => this.loadServices(1), 2000); // Retry after 2 seconds
      }

      this.cdr.detectChanges();
    }
  }

  refreshServices() {
    console.log('Manually refreshing services...');
    this.loadServices();
  }

  toggleMenu(event: MouseEvent) {
    this.menuOpen = !this.menuOpen;
    event.stopPropagation();
  }

  toggleServicesDropdown(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.servicesDropdownOpen = !this.servicesDropdownOpen;
  }

  closeServicesDropdown() {
    this.servicesDropdownOpen = false;
  }

  navigateAndCloseDropdown(route: string) {
    this.closeServicesDropdown();
    this.router.navigate([route]);
  }

  navigateToService(serviceId: string) {
    this.closeServicesDropdown();
    this.router.navigate(['/servicesDetail'], { queryParams: { id: serviceId } });
  }

  navigate(route: string) {
    this.closeServicesDropdown();
    this.router.navigate([route]);
  }

  openLoginModal() {
    console.log('Opening login modal');
    this.showLoginModal = true;
    this.loginUsername = '';
    this.loginPassword = '';
    this.loginError = '';
    this.cdr.detectChanges();
  }

  closeLoginModal() {
    console.log('Closing login modal');
    this.showLoginModal = false;
    this.loginError = '';
    this.cdr.detectChanges();
  }

  login() {
    console.log('Login attempt with:', this.loginUsername, this.loginPassword);
    const validUsername = 'admin@casainstall.com';
    const validPassword = 'casawall010203';

    if (this.loginUsername === validUsername && this.loginPassword === validPassword) {
      console.log('Login successful');
      this.closeLoginModal();
      this.router.navigate(['/homeDashboard']);
    } else {
      console.log('Login failed');
      this.loginError = 'Credenciales incorrectas. Inténtalo de nuevo.';
      this.cdr.detectChanges();
    }
  }

  sendSMS() {
    window.open(`sms:${this.phoneNumber}`, '_self');
  }

  makeCall() {
    window.open(`tel:${this.phoneNumber}`, '_self');
  }

 /*  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.menuOpen) {
      this.menuOpen = false;
    }
    if (this.servicesDropdownOpen) {
      this.servicesDropdownOpen = false;
    }
    // Note: Login modal handles its own outside clicks
  } */
@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent) {
  const target = event.target as HTMLElement;

  if (!target.closest('.search-trigger')) {
    this.menuOpen = false;
  }

  if (!target.closest('.submenu') && !target.closest('.desktop-services-item')) {
    this.servicesDropdownOpen = false;
  }

  if (!target.closest('.mobile-submenu') && !target.closest('.mobile-services-item')) {
    this.mobileServicesOpen = false;
  }
}
goTo(event: Event, route: string) {
  event.preventDefault();
  event.stopPropagation();

  this.menuOpen = false;
  this.servicesDropdownOpen = false;
  this.mobileServicesOpen = false;

  if (this.router.url === route) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  this.router.navigateByUrl(route).then((ok) => {
    console.log('navigateByUrl ->', route, ok);
    if (ok) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }, 50);
    }
  });
}
}
