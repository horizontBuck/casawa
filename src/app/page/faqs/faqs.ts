import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-faqs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faqs.html',
  styleUrl: './faqs.scss',
})
export class Faqs {
isBrowser: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, public router: Router) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
 ngOnInit(): void {
        if (!this.isBrowser) return;

      window.scrollTo(0, 0);
  }
  ngAfterViewInit(): void {
      if (!this.isBrowser) return;

    window.scrollTo(0, 0);
  }
}
