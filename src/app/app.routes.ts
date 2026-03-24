import { Routes } from '@angular/router';
import { authGuard } from '../auth.guard';
import { Home } from './page/home/home';
import { Terms } from './page/terms/terms';
import { Contact } from './page/contact/contact';
import { About } from './page/about/about';
import { Gallery } from './page/gallery/gallery';
import { Policy } from './page/policy/policy';
import { Faqs } from './page/faqs/faqs';
import { Calculator } from './page/calculator/calculator';



export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./page/home/home').then(c => c.Home),
    title: 'Casawallpaper',
    data: {
      description: 'Transform your space with expert wallpaper installations.',
      canonical: '/',
    },
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./page/terms/terms').then(c => c.Terms),
    title: 'Terms & Conditions',
    data: {
      description: 'Read our terms and conditions for using our services.',
      canonical: '/terms',
    },
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./page/contact/contact').then(c => c.Contact),
    title: 'Contact Us',
    data: {
      description: 'Read our contact page for using our services.',
      canonical: '/contact',
    },
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./page/about/about').then(c => c.About),
    title: 'About Us',
    data: {
      description: 'Read our about page for using our services.',
      canonical: '/about',
    },
  },
  {
    path: 'gallery',
    loadComponent: () =>
      import('./page/gallery/gallery').then(c => c.Gallery),
    title: 'Gallery',
    data: {
      description: 'Read our gallery page for using our services.',
      canonical: '/gallery',
    },
  },
  {
    path: 'policy',
    loadComponent: () =>
      import('./page/policy/policy').then(c => c.Policy),
    title: 'Policy',
    data: {
      description: 'Read our policy page for using our services.',
      canonical: '/policy',
    },
  },
  {
    path: 'faqs',
    loadComponent: () =>
      import('./page/faqs/faqs').then(c => c.Faqs),
    title: 'FAQs',
    data: {
      description: 'Read our FAQs page for using our services.',
      canonical: '/faqs',
    },
  },
  {
    path: 'calculator',
    loadComponent: () =>
      import('./page/calculator/calculator').then(c => c.Calculator),
    title: 'Calculator',
    data: {
      description: 'Read our calculator page for using our services.',
      canonical: '/calculator',
    },
  },
  
  {
    path: 'portfolioDashboard',
    loadComponent: () =>
      import('./page/dashboard/portfolio/portfolio').then(c => c.Portfolio),
    title: 'Portfolio',
    data: {
      description: 'Read our portfolio page for using our services.',
      canonical: '/portfolio',
    },
  },
  {
    path: 'servicesDashboard',
    loadComponent: () =>
      import('./page/dashboard/services/services').then(c => c.Services),
    title: 'Services',
    data: {
      description: 'Read our services page for using our services.',
      canonical: '/services',
    },
  },
  {
    path: 'aboutDashboard',
    loadComponent: () =>
      import('./page/dashboard/about/about').then(c => c.About),
    title: 'About',
    data: {
      description: 'Read our about page for using our services.',
      canonical: '/about',
    },
  },
  {
    path: 'homeDashboard',
    loadComponent: () =>
      import('./page/dashboard/home/home').then(c => c.Home),
    title: 'Dashboard',
    data: {
      description: 'Read our contact page for using our services.',
      canonical: '/contact',
    },
  },
  {
    path: 'servicesDetail',
    loadComponent: () =>
      import('./page/services-detail/services-detail').then(c => c.ServicesDetail),
    title: 'Service Detail',
    data: {
      description: 'Service detail page.',
      canonical: '/servicesDetail',
    },
  },
   
  {
    path: '**',
    redirectTo: 'home'
  }
];