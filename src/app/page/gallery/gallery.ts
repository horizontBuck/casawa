import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { PortfolioService } from '../../services/portfolio.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
})
export class Gallery implements OnInit {
  portfolios: any[] = [];
  filteredPortfolios: any[] = [];

  constructor(private portfolioService: PortfolioService, public router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadPortfolios();
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
}
