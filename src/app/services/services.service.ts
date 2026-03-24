import { Injectable } from '@angular/core';
import { AuthPocketbaseService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ServicesService {
  constructor(private authService: AuthPocketbaseService) {}

  async createService(
    name: string,
    description: string,
    preitems: string,
    items: string[],
    descriptionItems: string[],
    lidescription: string[],
    files: File[]
  ) {
    const formData = new FormData();

    formData.append('name', name);
    formData.append('description', description);
    formData.append('preitems', preitems);
    formData.append('items', JSON.stringify(items));
    formData.append('descriptionItems', JSON.stringify(descriptionItems));
    formData.append('lidescription', JSON.stringify(lidescription));

    console.log('FormData antes de append files:', { name, description, preitems, items, descriptionItems, lidescription, filesCount: files.length });

    files.forEach((file, index) => {
      formData.append('images', file);
      console.log(`Appending file ${index}:`, file.name);
    });

    console.log('Enviando a colección serviceCasa');
    const result = await this.authService.pb.collection('serviceCasa').create(formData);
    console.log('Respuesta de PB:', result);
    return result;
  }

  async getServices() {
    return await this.authService.pb.collection('serviceCasa').getFullList({
      sort: '-name',
    });
  }
}
