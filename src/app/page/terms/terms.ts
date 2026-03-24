import { CommonModule } from '@angular/common';
import { Component, OnInit, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms.html',
  styleUrl: './terms.scss',
})
export class Terms {
 isBrowser: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
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
