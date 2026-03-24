import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OnInit, AfterViewInit } from '@angular/core';
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact implements OnInit, AfterViewInit {
isBrowser: boolean = false;
form = {
    name: '',
    email: '',
    phone: '',
    zipcode: '',
    service: '',
    projectType: '',
    message: ''
  };
  constructor(@Inject(PLATFORM_ID) private platformId: Object, public router: Router, private http: HttpClient) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
 ngOnInit(): void {
        if (!this.isBrowser) return;

      window.scrollTo(0, 0);
  }
 
  ngAfterViewInit(): void {
  if (!this.isBrowser) return;
    window.scrollTo(0, 0);

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
