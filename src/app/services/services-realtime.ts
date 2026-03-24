import { Injectable, OnDestroy } from '@angular/core';
import PocketBase, { RecordSubscription } from 'pocketbase';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Service } from '../models/service.interface';
import { Services } from '../page/dashboard/services/services';

// Actualizamos la interfaz para extender de RecordSubscription
export interface RealtimeEvent extends Omit<RecordSubscription<Service>, 'action'> {
  action: 'create' | 'update' | 'delete';
  record: Service;
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeServiceService implements OnDestroy {
  private pb: PocketBase;
  private readonly COLLECTION = 'serviceCasa';
  private isSubscribed = false;
  
  // Subject para la lista completa de inspecciones
  private servicesSubject = new BehaviorSubject<Service[]>([]);
  public services$: Observable<Service[]> = this.servicesSubject.asObservable();
  
  // Subject para eventos en tiempo real individuales
  private eventsSubject = new Subject<RealtimeEvent>();
  public events$: Observable<RealtimeEvent> = this.eventsSubject.asObservable();
  
  // Subject para errores
  private errorSubject = new Subject<Error>();
  public errors$: Observable<Error> = this.errorSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);

  public get isLoading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  /**
   * Elimina una inspección por su ID
   * @param id ID de la inspección a eliminar
   * @returns Promesa que se resuelve cuando se completa la eliminación
 
 * @param id ID de la inspección a eliminar (record.id de PocketBase)
 * @returns Promesa que se resuelve cuando se completa la eliminación
 */
async deleteInspection(id: string): Promise<void> {
  try {
    await this.pb.collection(this.COLLECTION).delete(id);
   
    console.log(`[RealtimeServicesService] Inspección ${id} eliminada exitosamente`);
    
  } catch (error) {
    console.error('[RealtimeServicesService] Error al eliminar:', error);
    this.errorSubject.next(error instanceof Error ? error : new Error(String(error)));
    throw error; // Propagar el error para que el componente lo maneje
  }
}


  constructor() {
    this.pb = new PocketBase('https://db.buckapi.site:8091');
    
    this.pb.authStore.onChange((token, model) => {
      if (!token && this.isSubscribed) {
        console.warn('[RealtimeServicesService] Sesión expirada, suscripciones pausadas');
        this.unsubscribeAll();
      }
    });
    this.subscribe();
  }

async subscribe(autoLoad: boolean = true): Promise<void> {
  if (this.isSubscribed) {
    console.log('[RealtimeServicesService] Ya está suscrito');
    return;
  }

  try {
    // ✅ Validación estricta de autenticación
    if (!this.pb.authStore.isValid) {
      const error = new Error('Autenticación requerida para suscripción realtime');
      console.warn('[RealtimeServicesService]', error.message);
      this.errorSubject.next(error);
      return;
    }

    // ✅ Suscribirse a eventos realtime
    this.pb.collection(this.COLLECTION).subscribe('*', (event: RecordSubscription<Service>) => {
      if (['create', 'update', 'delete'].includes(event.action)) {
        const mappedEvent: RealtimeEvent = {
          ...event,
          action: event.action as 'create' | 'update' | 'delete'
        };
        console.log('[Realtime] Evento recibido:', mappedEvent.action, mappedEvent.record.id);
        this.eventsSubject.next(mappedEvent);
        this.handleRealtimeEvent(mappedEvent);
      }
    });

    this.isSubscribed = true;
    console.log('[RealtimeServicesService] ✓ Suscripción activa');

    if (autoLoad) {
      await this.loadInspections();
    }
  } catch (error) {
    this.handleError(error as Error);
    throw error;
  }
}

// ✅ Método para cancelar suscripción manualmente (útil para testing o logout)
unsubscribe(): void {
  try {
    this.pb.collection(this.COLLECTION).unsubscribe();
    this.isSubscribed = false;
    console.log('[RealtimeServicesService] ✗ Suscripción cancelada');
  } catch (error) {
    this.handleError(error as Error);
  }
}

private handleRealtimeEvent(event: RealtimeEvent): void {
  const currentServices = this.servicesSubject.value;

  switch (event.action) {
    case 'create':
      // Agregar al inicio (más reciente primero)
      this.servicesSubject.next([event.record, ...currentServices]);
      break;

    case 'update':
      // Buscar y actualizar el registro usando event.record.id (estándar PocketBase)
      const updatedList = currentServices.map(insp =>
        insp.id === event.record.id ? event.record : insp
      );
      this.servicesSubject.next(updatedList);
      break;

    case 'delete':
      // ✅ Eliminar usando event.record.id (NO id_inspeccion)
      this.servicesSubject.next(
        currentServices.filter(insp => insp.id !== event.record.id)
      );
      console.log(`[Realtime] Inspección ${event.record.id} eliminada de la lista local`);
      break;
  }
}
  /**
   * Cargar lista completa de inspecciones
   */
  async loadInspections(sort: string = '-created'): Promise<void> {
    try {
      const records = await this.pb
        .collection(this.COLLECTION)
        .getFullList<Service>(200, { sort });
      
      console.log(`[RealtimeServicesService] Cargadas ${records.length} inspecciones`);
      this.servicesSubject.next(records);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Obtener inspecciones con paginación
   */
  async getServicesPaginated(
    page: number = 1,
    perPage: number = 50,
    sort: string = '-created',
    filter?: string
  ): Promise<{ items: Service[], totalItems: number, totalPages: number }> {
    try {
      const response = await this.pb.collection(this.COLLECTION).getList(page, perPage, {
        sort,
        filter
      });
      
      return {
        items: response.items as Service[],
        totalItems: response.totalItems,
        totalPages: response.totalPages
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Obtener una inspección por ID
   */
  async getServicesById(id: string): Promise<Service> {
    try {
      const record = await this.pb.collection(this.COLLECTION).getOne<Service>(id);
      return record;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Desuscribirse de todos los eventos
   */
  unsubscribeAll(): void {
    try {
      this.pb.collection(this.COLLECTION).unsubscribe();
      this.isSubscribed = false;
      console.log('[RealtimeServicesService] ✗ Suscripciones eliminadas');
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Verificar si está suscrito actualmente
   */
  isCurrentlySubscribed(): boolean {
    return this.isSubscribed;
  }

  /**
   * Autenticar usuario (deberías hacer esto desde un servicio de autenticación)
   */
  async authenticate(email: string, password: string): Promise<void> {
    try {
      await this.pb.collection('users').authWithPassword(email, password);
      console.log('[RealtimeServicesService] ✓ Autenticación exitosa');
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.unsubscribeAll();
    this.pb.authStore.clear();
    this.servicesSubject.next([]);
    console.log('[RealtimeServicesService] ✓ Sesión cerrada');
  }

  /**
   * Verificar si hay usuario autenticado
   */
  isAuthenticated(): boolean {
    return this.pb.authStore.isValid;
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser() {
    return this.pb.authStore.model;
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: any): void {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[RealtimeServicesService] Error:', err);
    this.errorSubject.next(err);
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
    this.servicesSubject.complete();
    this.eventsSubject.complete();
    this.errorSubject.complete();
  }
}