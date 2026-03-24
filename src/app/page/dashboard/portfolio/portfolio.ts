import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PortfolioService } from '../../../services/portfolio.service';
import { AuthPocketbaseService } from '../../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-portfolio',
  imports: [FormsModule, CommonModule],
  templateUrl: './portfolio.html',
  styleUrls: ['./portfolio.scss'], // Fix: styleUrl -> styleUrls
})
export class Portfolio implements OnInit {
  selectedFiles: File[] = [];
  previews: string[] = [];
  loading = false;
  portfolios: any[] = [];
  showForm = false;
  isEditing = false;

  // Form data for editing
  formData = {
    name: '',
    tag: ''
  };

  // Track which existing images to delete
  imagesToDelete: string[] = [];

  @ViewChild('portfolioForm') portfolioForm!: NgForm;

  constructor(public portfolioService: PortfolioService, public authService: AuthPocketbaseService,
     private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadPortfolios();
  }

  async loadPortfolios() {
    try {
      const portfolios = await this.portfolioService.getPortfolios();
      this.portfolios = portfolios.map(portfolio => ({
        ...portfolio,
        tag: typeof portfolio['tag'] === 'string' ? portfolio['tag'] : portfolio['tag']
      }));
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading portfolios:', error);
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

  toggleForm() {
    this.showForm = !this.showForm;
    this.isEditing = false;
    this.editingPortfolio = null;
    this.selectedFiles = [];
    this.previews = [];
    this.formData = { name: '', tag: '' };
    this.imagesToDelete = [];
  }

  async deletePortfolio(portfolio: any) {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar el portfolio "${portfolio.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await this.authService.pb.collection('potfolioCasa').delete(portfolio.id);
        Swal.fire('Eliminado!', 'El portfolio ha sido eliminado.', 'success');
        this.loadPortfolios(); // Reload the list
      } catch (error) {
        console.error('Error deleting portfolio:', error);
        Swal.fire('Error', 'No se pudo eliminar el portfolio.', 'error');
      }
    }
  }

  editPortfolio(portfolio: any) {
    this.isEditing = true;
    this.editingPortfolio = portfolio;
    this.showForm = true;

    // Clear current selections
    this.selectedFiles = [];
    this.previews = [];
    this.imagesToDelete = []; // Reset images to delete

    // Populate form data
    this.formData.name = portfolio.name || '';
    this.formData.tag = portfolio.tag || '';

    // Populate existing images as previews
    if (portfolio.images && portfolio.images.length > 0) {
      portfolio.images.forEach((imageName: string) => {
        const imageUrl = this.authService.fileUrl(portfolio, imageName);
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
      if (this.portfolioForm) {
        this.portfolioForm.setValue({
          name: this.formData.name,
          tag: this.formData.tag
        });
      }
    });
  }

  cancelEdit() {
    this.isEditing = false;
    this.editingPortfolio = null;
    this.showForm = false;
    this.selectedFiles = [];
    this.previews = [];
    this.formData = { name: '', tag: '' };
    this.imagesToDelete = [];
  }

  editingPortfolio: any = null;

  async uploadPortfolio(form: NgForm) {
    if (form.invalid) return;

    // For editing, allow updating without new files if we have existing images
    const hasExistingImages = this.isEditing && this.editingPortfolio?.images?.length > 0;
    if (!this.selectedFiles.length && !hasExistingImages) return;

    try {
      this.loading = true;

      const { name, tag } = form.value;

      const type = this.selectedFiles.some(f => f.type.startsWith('video/'))
        ? 'video'
        : 'img';

      if (this.isEditing && this.editingPortfolio) {
        // Update existing portfolio
        console.log('Updating portfolio:', { name, tag, id: this.editingPortfolio.id });

        // Calculate remaining images after deletion
        const remainingImages = this.editingPortfolio.images.filter((img: string) =>
          !this.imagesToDelete.includes(img)
        );

        // Get only new files (not existing ones)
        const newFiles = this.selectedFiles.filter(file => file.type !== 'existing/image');

        const updateData: any = {
          name,
          tag
        };

        if (newFiles.length > 0 || this.imagesToDelete.length > 0) {
          // Create form data for the update with files
          const formData = new FormData();
          formData.append('name', name);
          formData.append('tag', tag);

          // Add remaining existing images (if any still exist)
          if (remainingImages.length > 0) {
            // Note: PocketBase handles existing files automatically when updating
            // We don't need to explicitly add existing files to FormData
          }

          // Add new files
          newFiles.forEach((file, index) => {
            formData.append('images', file);
          });

          console.log('Updating portfolio with files:', {
            remainingImages: remainingImages.length,
            newFiles: newFiles.length,
            toDelete: this.imagesToDelete.length
          });

          await this.authService.pb.collection('potfolioCasa').update(this.editingPortfolio.id, formData);
        } else {
          // Just update text fields
          await this.authService.pb.collection('potfolioCasa').update(this.editingPortfolio.id, updateData);
        }

        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Portfolio actualizado correctamente',
        });
      } else {
        // Create new portfolio
        console.log('Creating new portfolio:', { name, tag, type, filesCount: this.selectedFiles.length });

        await this.portfolioService.createPortfolio(
          name,
          tag,
          type,
          this.selectedFiles
        );

        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Portfolio subido correctamente',
        });
      }

      // Reset form and close
      this.selectedFiles = [];
      this.previews = [];
      this.formData = { name: '', tag: '' };
      this.imagesToDelete = []; // Reset images to delete
      if (this.portfolioForm) {
        this.portfolioForm.resetForm();
      }

      this.loadPortfolios(); // Reload list

      this.showForm = false; // Hide form
      this.isEditing = false;
      this.editingPortfolio = null;

    } catch (error) {
      console.error('Error saving portfolio:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al guardar el portfolio. Inténtalo de nuevo.',
      });
    } finally {
      this.loading = false;
    }
  }
}