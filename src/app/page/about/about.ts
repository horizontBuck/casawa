import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
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
