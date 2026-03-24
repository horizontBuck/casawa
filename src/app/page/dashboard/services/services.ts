import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServicesService } from '../../../services/services.service';
import { AuthPocketbaseService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-services',
  imports: [FormsModule, CommonModule],
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class Services implements OnInit {
  selectedFiles: File[] = [];
  previews: string[] = [];
  loading = false;
  items: string[] = [];
  newItem: string = '';
  descriptionItems: string[] = [];
  newDescriptionItem: string = '';
  lidescription: string[] = [];
  newLidescriptionItem: string = '';
  services: any[] = [];
  showForm = false;
  isEditing = false;
  imagesToDelete: string[] = []; // Track which existing images to delete

  // Form data for editing
  formData = {
    name: '',
    description: '',
    preitems:''
  };

  @ViewChild('servicesForm') servicesForm!: NgForm;

  editingService: any = null;

  constructor(private servicesService: ServicesService, public authService: AuthPocketbaseService,
     private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadServices();
  }

  async loadServices() {
    try {
      const services = await this.servicesService.getServices();
      this.services = services.map(service => ({
        ...service,
        items: typeof service['items'] === 'string' ? JSON.parse(service['items']) : service['items'],
        descriptionItems: typeof service['descriptionItems'] === 'string' ? JSON.parse(service['descriptionItems']) : service['descriptionItems'],
        lidescription: typeof service['lidescription'] === 'string' ? JSON.parse(service['lidescription']) : service['lidescription']
      }));
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading services:', error);
    }
  }

  onFileChange(event: any) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.selectedFiles.push(file);
      this.generatePreview(file);
    }
  }

  generatePreview(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previews.push(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  removeFile(index: number) {
    const file = this.selectedFiles[index];

    if (file.type === 'existing/image') {
      // For existing images, mark for deletion instead of removing from preview
      const imageName = file.name.replace('existing_', '');

      // Check if already marked for deletion
      const deleteIndex = this.imagesToDelete.indexOf(imageName);
      if (deleteIndex === -1) {
        // Mark for deletion
        this.imagesToDelete.push(imageName);
        Swal.fire({
          icon: 'warning',
          title: 'Imagen marcada para eliminar',
          text: 'Esta imagen será eliminada cuando guardes los cambios.',
          confirmButtonText: 'Entendido'
        });
      } else {
        // Unmark for deletion
        this.imagesToDelete.splice(deleteIndex, 1);
        Swal.fire({
          icon: 'info',
          title: 'Imagen desmarcada',
          text: 'Esta imagen ya no será eliminada.',
          confirmButtonText: 'OK'
        });
      }
      return;
    }

    // For new files, remove normally
    this.selectedFiles.splice(index, 1);
    this.previews.splice(index, 1);
  }

  addItem() {
    if (this.newItem.trim()) {
      this.items.push(this.newItem.trim());
      this.newItem = '';
    }
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
  }

  addDescriptionItem() {
    if (this.newDescriptionItem.trim()) {
      this.descriptionItems.push(this.newDescriptionItem.trim());
      this.newDescriptionItem = '';
    }
  }

  removeDescriptionItem(index: number) {
    this.descriptionItems.splice(index, 1);
  }

  addLidescriptionItem() {
    if (this.newLidescriptionItem.trim()) {
      this.lidescription.push(this.newLidescriptionItem.trim());
      this.newLidescriptionItem = '';
    }
  }

  removeLidescriptionItem(index: number) {
    this.lidescription.splice(index, 1);
  }

  toggleForm() {
    this.showForm = !this.showForm;
    this.isEditing = false;
    this.editingService = null;
    this.selectedFiles = [];
    this.previews = [];
    this.items = [];
    this.newItem = '';
    this.descriptionItems = [];
    this.newDescriptionItem = '';
    this.lidescription = [];
    this.newLidescriptionItem = '';
    this.formData = { name: '', description: '', preitems: ''};
  }

  async deleteService(service: any) {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar el servicio "${service.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await this.authService.pb.collection('serviceCasa').delete(service.id);
        Swal.fire('Eliminado!', 'El servicio ha sido eliminado.', 'success');
        this.loadServices(); // Reload the list
      } catch (error: any) {
        console.error('Error deleting service:', error);
        Swal.fire('Error', `No se pudo eliminar el servicio: ${error.message || 'Error desconocido'}`, 'error');
      }
    }
  }

  editService(service: any) {
    this.isEditing = true;
    this.editingService = service;
    this.showForm = true;

    // Clear current selections
    this.selectedFiles = [];
    this.previews = [];
    this.imagesToDelete = []; // Reset images to delete

    // Populate form data
    this.formData.name = service.name || '';
    this.formData.description = service.description || '';
    this.formData.preitems = service.preitems || '';

    // Populate items
    this.items = [...(service.items || [])];

    // Populate descriptionItems
    this.descriptionItems = [...(service.descriptionItems || [])];

    // Populate lidescription
    this.lidescription = [...(service.lidescription || [])];

    // Populate existing images as previews
    if (service.images && service.images.length > 0) {
      service.images.forEach((imageName: string) => {
        const imageUrl = this.authService.fileUrl(service, imageName);
        if (imageUrl) {
          this.previews.push(imageUrl);
          // Create a special marker for existing images
          const existingFile = new File(['existing'], `existing_${imageName}`, { type: 'existing/image' });
          this.selectedFiles.push(existingFile);
        }
      });
    }

    // Force change detection to update form
    this.cdr.detectChanges();

    // Set form values after change detection
    setTimeout(() => {
      if (this.servicesForm) {
        this.servicesForm.setValue({
          name: this.formData.name,
          description: this.formData.description
        });
      }
    });
  }

  cancelEdit() {
    this.isEditing = false;
    this.editingService = null;
    this.showForm = false;
    this.selectedFiles = [];
    this.previews = [];
    this.items = [];
    this.newItem = '';
    this.descriptionItems = [];
    this.newDescriptionItem = '';
    this.lidescription = [];
    this.newLidescriptionItem = '';
    this.formData = { name: '', description: '', preitems: '' };
    this.imagesToDelete = [];
  }

  async uploadService(form: NgForm) {
    if (form.invalid) return;

    // For editing, allow updating without new files if we have existing images
    const hasExistingImages = this.isEditing && this.editingService?.images?.length > 0;
    if (!this.selectedFiles.length && !hasExistingImages) return;

    try {
      this.loading = true;

      const { name, description } = form.value;

      if (this.isEditing && this.editingService) {
        // Update existing service
        console.log('Updating service:', { name, description, id: this.editingService.id });

        // Calculate remaining images after deletion
        const remainingImages = this.editingService.images.filter((img: string) =>
          !this.imagesToDelete.includes(img)
        );

        // Get only new files (not existing ones)
        const newFiles = this.selectedFiles.filter(file => file.type !== 'existing/image');

        const updateData: any = {
          name,
          description,
          preitems: this.formData.preitems,
          items: JSON.stringify(this.items),
          descriptionItems: JSON.stringify(this.descriptionItems),
          lidescription: JSON.stringify(this.lidescription)
        };

        if (newFiles.length > 0 || this.imagesToDelete.length > 0) {
          // Create form data for the update with files
          const formData = new FormData();
          formData.append('name', name);
          formData.append('description', description);
          formData.append('preitems', this.formData.preitems);
          formData.append('items', JSON.stringify(this.items));
          formData.append('descriptionItems', JSON.stringify(this.descriptionItems));
          formData.append('lidescription', JSON.stringify(this.lidescription));

          // Add remaining existing images (if any still exist)
          if (remainingImages.length > 0) {
            // Note: PocketBase handles existing files automatically when updating
            // We don't need to explicitly add existing files to FormData
          }

          // Add new files
          newFiles.forEach((file, index) => {
            formData.append('images', file);
          });

          console.log('Updating service with files:', {
            remainingImages: remainingImages.length,
            newFiles: newFiles.length,
            toDelete: this.imagesToDelete.length
          });

          await this.authService.pb.collection('serviceCasa').update(this.editingService.id, formData);
        } else {
          // Just update text fields
          await this.authService.pb.collection('serviceCasa').update(this.editingService.id, updateData);
        }

        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Servicio actualizado correctamente',
        });
      } else {
        // Create new service
        console.log('Creating new service:', { name, description, items: this.items, filesCount: this.selectedFiles.length });

        await this.servicesService.createService(
          name,
          description,
          this.formData.preitems,
          this.items,
          this.descriptionItems,
          this.lidescription,
          this.selectedFiles
        );

        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Servicio subido correctamente',
        });
      }

      // Reset form and close
      this.items = [];
      this.newItem = '';
      this.descriptionItems = [];
      this.newDescriptionItem = '';
      this.lidescription = [];
      this.newLidescriptionItem = '';
      this.formData = { name: '', description: '', preitems:'' };
      this.imagesToDelete = []; // Reset images to delete
      if (this.servicesForm) {
        this.servicesForm.resetForm();
      }

      this.loadServices(); // Reload list

      this.showForm = false; // Hide form
      this.isEditing = false;
      this.editingService = null;

    } catch (error) {
      console.error('Error saving service:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al guardar el servicio. Inténtalo de nuevo.',
      });
    } finally {
      this.loading = false;
    }
  }
}
