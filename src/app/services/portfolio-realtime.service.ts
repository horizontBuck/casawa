import { Injectable, OnDestroy } from '@angular/core';
import PocketBase, { RecordSubscription } from 'pocketbase';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Portfolio } from '../models/portfolio.interface';

// Actualizamos la interfaz para extender de RecordSubscription
export interface RealtimePortfolioEvent extends Omit<RecordSubscription<Portfolio>, 'action'> {
  action: 'create' | 'update' | 'delete';
  record: Portfolio;
}

@Injectable({
  providedIn: 'root',
})
export class RealtimePortfolioService implements OnDestroy {
  private pb: PocketBase;
  private readonly COLLECTION = 'potfolioCasa';
  private isSubscribed = false;

  // Subject para la lista completa de portfolios
  private portfoliosSubject = new BehaviorSubject<Portfolio[]>([]);
  public portfolios$: Observable<Portfolio[]> = this.portfoliosSubject.asObservable();

  // Subject para eventos en tiempo real individuales
  private eventsSubject = new Subject<RealtimePortfolioEvent>();
  public events$: Observable<RealtimePortfolioEvent> = this.eventsSubject.asObservable();

  // Subject para errores
  private errorSubject = new Subject<Error>();
  public errors$: Observable<Error> = this.errorSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);

  public get isLoading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  constructor() {
    this.pb = new PocketBase('https://db.buckapi.site:8091');

    this.pb.authStore.onChange((token, model) => {
      if (!token && this.isSubscribed) {
        console.warn('[RealtimePortfolioService] Sesión expirada, suscripciones pausadas');
        this.unsubscribeAll();
      }
    });
    this.subscribe();
  }

  async subscribe(autoLoad: boolean = true): Promise<void> {
    if (this.isSubscribed) {
      console.log('[RealtimePortfolioService] Ya está suscrito');
      return;
    }

    try {
      // ✅ Validación estricta de autenticación
      if (!this.pb.authStore.isValid) {
        const error = new Error('Autenticación requerida para suscripción realtime');
        console.warn('[RealtimePortfolioService]', error.message);
        this.errorSubject.next(error);
        return;
      }

      // ✅ Suscribirse a eventos realtime
      this.pb.collection(this.COLLECTION).subscribe('*', (event: RecordSubscription<Portfolio>) => {
        if (['create', 'update', 'delete'].includes(event.action)) {
          const mappedEvent: RealtimePortfolioEvent = {
            ...event,
            action: event.action as 'create' | 'update' | 'delete'
          };
          console.log('[Realtime] Evento recibido:', mappedEvent.action, mappedEvent.record.id);
          this.eventsSubject.next(mappedEvent);
          this.handleRealtimeEvent(mappedEvent);
        }
      });

      this.isSubscribed = true;
      console.log('[RealtimePortfolioService] ✓ Suscripción activa');

      if (autoLoad) {
        await this.loadPortfolios();
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
      console.log('[RealtimePortfolioService] ✗ Suscripción cancelada');
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private handleRealtimeEvent(event: RealtimePortfolioEvent): void {
    const currentPortfolios = this.portfoliosSubject.value;

    switch (event.action) {
      case 'create':
        // Agregar al inicio (más reciente primero)
        this.portfoliosSubject.next([event.record, ...currentPortfolios]);
        break;

      case 'update':
        // Buscar y actualizar el registro usando event.record.id
        const updatedList = currentPortfolios.map(portfolio =>
          portfolio.id === event.record.id ? event.record : portfolio
        );
        this.portfoliosSubject.next(updatedList);
        break;

      case 'delete':
        // Eliminar usando event.record.id
        this.portfoliosSubject.next(
          currentPortfolios.filter(portfolio => portfolio.id !== event.record.id)
        );
        console.log(`[Realtime] Portfolio ${event.record.id} eliminado de la lista local`);
        break;
    }
  }

  /**
   * Cargar lista completa de portfolios
   */
  async loadPortfolios(sort: string = '-created'): Promise<void> {
    try {
      const records = await this.pb
        .collection(this.COLLECTION)
        .getFullList<Portfolio>(200, { sort });

      console.log(`[RealtimePortfolioService] Cargados ${records.length} portfolios`);
      this.portfoliosSubject.next(records);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Obtener portfolios con paginación
   */
  async getPortfoliosPaginated(
    page: number = 1,
    perPage: number = 50,
    sort: string = '-created',
    filter?: string
  ): Promise<{ items: Portfolio[], totalItems: number, totalPages: number }> {
    try {
      const response = await this.pb.collection(this.COLLECTION).getList(page, perPage, {
        sort,
        filter
      });

      return {
        items: response.items as Portfolio[],
        totalItems: response.totalItems,
        totalPages: response.totalPages
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Obtener un portfolio por ID
   */
  async getPortfolioById(id: string): Promise<Portfolio> {
    try {
      const record = await this.pb.collection(this.COLLECTION).getOne<Portfolio>(id);
      return record;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Obtener URL de archivo
   */
  getFileUrl(record: Portfolio, fileName: string): string {
    return this.pb.files.getUrl(record, fileName);
  }

  /**
   * Desuscribirse de todos los eventos
   */
  unsubscribeAll(): void {
    try {
      this.pb.collection(this.COLLECTION).unsubscribe();
      this.isSubscribed = false;
      console.log('[RealtimePortfolioService] ✗ Suscripciones eliminadas');
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
      console.log('[RealtimePortfolioService] ✓ Autenticación exitosa');
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
    this.portfoliosSubject.next([]);
    console.log('[RealtimePortfolioService] ✓ Sesión cerrada');
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
    console.error('[RealtimePortfolioService] Error:', err);
    this.errorSubject.next(err);
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
    this.portfoliosSubject.complete();
    this.eventsSubject.complete();
    this.errorSubject.complete();
  }
}
