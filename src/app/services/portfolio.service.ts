import { Injectable } from '@angular/core';
import { AuthPocketbaseService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class PortfolioService {
  constructor(private authService: AuthPocketbaseService) {}

  // 1️⃣ Subir archivos a colección media (o la que tengas)
  async uploadFiles(files: File[]): Promise<string[]> {
    const uploadedIds: string[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      // ⚠️ Cambia 'media' por tu colección de archivos
      const record = await this.authService.pb.collection('images').create(formData);

      uploadedIds.push(record.id);
    }

    return uploadedIds;
  }

  // 2️⃣ Crear el portfolio

  async createPortfolio(
    name: string,
    tag: 'residencial' | 'comercial',
    type: 'img' | 'video',
    files: File[]
  ) {
    const formData = new FormData();

    formData.append('name', name);
    formData.append('tag', tag);
    formData.append('type', type);

    console.log('FormData antes de append files:', { name, tag, type, filesCount: files.length });

    // 🔥 MULTIPLES ARCHIVOS
    files.forEach((file, index) => {
      formData.append('images', file);
      console.log(`Appending file ${index}:`, file.name);
    });

    console.log('Enviando a colección potfolioCasa');
    const result = await this.authService.pb.collection('potfolioCasa').create(formData);
    console.log('Respuesta de PB:', result);
    return result;
  }

  async getPortfolios() {
    return await this.authService.pb.collection('potfolioCasa').getFullList({
      sort: '-created',
    });
  }

  fileUrl(record: any, fileName: string): string | null {
    return this.authService.pb.files.getUrl(record, fileName);
  }
}