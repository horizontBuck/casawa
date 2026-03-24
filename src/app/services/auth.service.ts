import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import PocketBase, { RecordModel } from 'pocketbase';
export type UserType = 'root' | 'admin' | 'socio';
export interface RegisterMinimalPayload {
  username: string;
  email: string;
  phone: string;
  type: UserType;
  dni?: string;
  avatar?: string | Blob;
  password?: string; // 👈 nuevo campo opcional
}

@Injectable({ providedIn: 'root' })
export class AuthPocketbaseService {
  public pb: PocketBase;
  // Solo un constructor y router inyectado correctamente
  public randomPassword(len = 18): string {
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_-+=';
    return Array.from(bytes, b => chars[b % chars.length]).join('');
  }
  async login(email: string, password: string) {
    try {
      const authData = await this.pb.collection('users').authWithPassword(email, password);
      
      const role = authData.record['role'] || 'user';
      const companyId = authData.record['companyId'] || '';
      // Guarda la sesión
      localStorage.setItem('token', this.pb.authStore.token);
      localStorage.setItem('companyId', companyId);
      localStorage.setItem('role', role);
      localStorage.setItem('user', JSON.stringify(authData.record));

      return authData;
    } catch (err) {
      throw err;
    }
  }

  constructor(private router: Router) {
    this.pb = new PocketBase('https://db.buckapi.site:8091');
  }

  logout() {
    this.pb.authStore.clear();
    localStorage.clear();
      localStorage.removeItem('user');
    // Navigation is handled by the component
  }


  get companyId() {
    return localStorage.getItem('companyId');
  }

 /*  get role() {
    return localStorage.getItem('role');
  } */
get role(): string | null {
  return this.user?.['role'] ?? null;
}

  get isSuperAdmin() {
    return this.role === 'root';
  }

get user(): any | null {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}


 async getUsers() {
    try {
      const records = await this.pb.collection('users').getFullList({
        sort: '-created',
      });
      return records;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
  get isLoggedIn(): boolean {
    // Verifica que el token exista y sea válido
    const token = this.pb.authStore.token;
    const isValid = this.pb.authStore.isValid;
      if (!this.pb.authStore.isValid) {
    this.logout();
    return false;
  }
  return true;
  }
hasRole(roles: string[]): boolean {
  if (!this.user || !this.user.role) return false;
  return roles.includes(this.user.role);
}

  fileUrl(record: RecordModel | null | undefined, fileName?: string, thumb?: string): string | null {
    if (!record || !fileName) return null;
    return this.pb.files.getUrl(record, fileName, thumb ? { thumb } : undefined);
  }

  async registerMinimal(payload: RegisterMinimalPayload): Promise<RecordModel> {
    const password = payload.password ?? this.randomPassword();

    const rolwMap: Record<UserType, 'root' | 'admin' | 'socio'> = {
      admin: 'admin',
      socio: 'socio',
      root: 'root',
    };
    const rolwValue = rolwMap[payload.type];
    const isActive = payload.type === 'root';

    const data: Record<string, any> = {
      email: payload.email,
      emailVisibility: true,
      password,
      passwordConfirm: password,
      username: payload.username,
      name: payload.username,
      phone: Number(payload.phone),
      dni: payload.dni ?? '',
      type: payload.type,
      role: rolwValue,
      status: payload.type === 'root' ? 'active' : 'inactive',
      active: payload.type === 'root',
      estado: payload.type === 'root' ? 'incompleto' : 'activo', // 👈 incluido aquí
    };

    if (payload.avatar instanceof Blob) {
      data['avatar'] = payload.avatar;
    }

    console.log('Payload a enviar:', data);
    const record = await this.pb.collection('users').create(data);

    if (isActive) {
      await this.pb.collection('users').authWithPassword(payload.email, password);
    }

    return record; // ✅ Solo un registro, sin errores
  }

  async requestPasswordReset(email: string) {
    await this.pb.collection('users').requestPasswordReset(email);
  }


  getCurrentUserId(): string | null {
    return this.pb.authStore.model?.id ?? null;
  }
  async updateMyFields(patch: Partial<RecordModel>): Promise<RecordModel> {
    const id = this.getCurrentUserId();
    if (!id) throw new Error('No hay usuario autenticado.');
    const rec = await this.pb.collection('users').update(id, patch);
    this.pb.authStore.save(this.pb.authStore.token, rec as any);
    return rec;
  }
  async getUserById(id: string): Promise<any> {
    return await this.pb.collection('users').getOne(id);
  }

  async updateUser(id: string, data: any): Promise<any> {
    return await this.pb.collection('users').update(id, data);
  }
  async updateMyLocation(lat: number, long: number): Promise<RecordModel> {
    return this.updateMyFields({ lat, long });
  }
  
}
