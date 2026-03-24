import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PortfolioService } from '../../services/portfolio.service';
import { ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';
declare var Swiper: any;
declare var WOW: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  ngFormRequest: FormGroup;
  submitted = false;
  public isError = false;
  phoneNumber: string = '9198855401';
  menuOpen: boolean = false;
  isBrowser: boolean = false;
  heroSwiper: any;
  projectSwiper: any;
  testimonialSwiper: any;
  portfolios: any[] = [];
  filteredPortfolios: any[] = [];
form = {
    name: '',
    email: '',
    phone: '',
    zipcode: '',
    service: '',
    projectType: '',
    message: ''
  };
  constructor(public router: Router, private formBuilder: FormBuilder, @Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient, private portfolioService: PortfolioService, private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    {
      this.ngFormRequest = this.formBuilder.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern('^\\d{10}$')]],
        zipcode: ['', Validators.required],
        servicesType: ['', Validators.required],
        projectType: ['', Validators.required],
        area: ['', Validators.required],
        message: ['', Validators.required],
      });
    }
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    window.scrollTo(0, 0);
    this.loadPortfolios();
    this.ngFormRequest = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^\\d{10}$')]],
      zipcode: ['', Validators.required],
      servicesType: ['', Validators.required],
      projectType: ['', Validators.required],
      area: ['', Validators.required],
      message: ['', Validators.required],
    });
  }
  initScripts() {
    window.addEventListener('scroll', () => {
      console.log(window.scrollY);
    });
    this.initScripts();
    
  }

  get f(): { [key: string]: AbstractControl } {
    return this.ngFormRequest.controls;
  }

  toggleMenu(event: MouseEvent) {
    this.menuOpen = !this.menuOpen;
    event.stopPropagation();
  }

  sendSMS() {
    window.open(`sms:${this.phoneNumber}`, '_self');
  }

  makeCall() {
    window.open(`tel:${this.phoneNumber}`, '_self');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.menuOpen) {
      const clickedInside = (event.target as HTMLElement).closest('.fab');
      if (!clickedInside) {
        this.menuOpen = false;
      }
    }
  }


ngAfterViewInit(): void {
  if (!this.isBrowser) return;

  setTimeout(() => {
    this.initSwipers();
  }, 0);
   setTimeout(() => {
    document.querySelectorAll('.nice-select .option')
      .forEach(opt => {
        opt.addEventListener('click', (e: any) => {
          const value = e.target.innerText;

          if (e.target.closest('.nice-select')?.previousElementSibling?.innerText?.includes('Service')) {
            this.form.service = value;
          } else {
            this.form.projectType = value;
          }
        });
      });
  }, 0);
}
ngOnDestroy(): void {
  this.heroSwiper?.destroy(true, true);
  this.projectSwiper?.destroy(true, true);
  this.testimonialSwiper?.destroy(true, true);
}

initSwipers() {
  if (this.heroSwiper) this.heroSwiper.destroy(true, true);
  if (this.projectSwiper) this.projectSwiper.destroy(true, true);
  if (this.testimonialSwiper) this.testimonialSwiper.destroy(true, true);

  this.heroSwiper = new Swiper('.hero-slider', {
    loop: true,
    autoplay: { delay: 5000 },
    effect: 'fade'
  });

  this.projectSwiper = new Swiper('.project-slider', {
    loop: true,
    autoplay: { delay: 5000 },
    slidesPerView: 3,
    spaceBetween: 30,
    breakpoints: {
      0: { slidesPerView: 1 },
      768: { slidesPerView: 2 },
      1200: { slidesPerView: 3 }
    }
  });

  this.testimonialSwiper = new Swiper('.testimonial-slider', {
    loop: true,
    navigation: {
      nextEl: '.array-next',
      prevEl: '.array-prev'
    }
  });
}

async loadPortfolios() {
  try {
    this.portfolios = await this.portfolioService.getPortfolios();
    this.filteredPortfolios = this.portfolios;
    this.cdr.detectChanges();
  } catch (error) {
    console.error('Error loading portfolios:', error);
  }
}

  getImageUrl(portfolio: any): string {
    if (portfolio.images && portfolio.images.length > 0) {
      return this.portfolioService.fileUrl(portfolio, portfolio.images[0]) || '';
    }
    return '';
  }

  filterPortfolios(type: string): void {
    if (type === 'all') {
      this.filteredPortfolios = this.portfolios;
    } else {
      this.filteredPortfolios = this.portfolios.filter(portfolio => portfolio.tag === type);
    }
  }

  viewImage(portfolio: any, index: number = 0): void {
    const images = portfolio.images || [];
    if (images.length === 0) return;

    const imageUrl = this.portfolioService.fileUrl(portfolio, images[index]);
    const title = images.length > 1 ? `${portfolio.name} (${index + 1}/${images.length})` : portfolio.name;

    const config: any = {
      title: title,
      imageUrl: imageUrl,
      imageAlt: portfolio.name,
      showCloseButton: true,
      showConfirmButton: false,
      width: '80%',
    };

    if (images.length > 1) {
      config.showConfirmButton = index < images.length - 1;
      config.confirmButtonText = 'Next';
      config.showDenyButton = index > 0;
      config.denyButtonText = 'Previous';
    }

    Swal.fire(config).then((result) => {
      if (result.isConfirmed && index < images.length - 1) {
        this.viewImage(portfolio, index + 1);
      } else if (result.isDenied && index > 0) {
        this.viewImage(portfolio, index - 1);
      }
    });
  }

  onIsError(): void {
    this.isError = true;
  }

  sendContact() {
  this.http.post(
    'https://casawallpaper.com/api/send-contact.php',
    this.form
  ).subscribe({
    next: () => {
      alert('Message sent successfully');
      this.form = {
        name: '',
        email: '',
        phone: '',
        zipcode: '',
        service: '',
        projectType: '',
        message: ''
      };
    },
    error: (err) => {
      console.error(err);
      alert('Error sending message');
    }
  });
}
}
