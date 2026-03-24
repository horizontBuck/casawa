import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScriptStore } from "./script.store";
declare const document: any;

@Injectable({
  providedIn: 'root'
})
export class ScriptService {
  private scripts: any = {};
  private isBrowser: boolean;
  private error: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { 
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      ScriptStore.forEach((script: any) => {
        this.scripts[script.name] = {
          loaded: false,
          src: script.src
        };
      });
    }
  }

  load(...scripts: string[]) {
    const loadTimes: any[] = [];
    const promises = scripts.map(script => () => {
      const startTime = performance.now();
      return this.loadScript(script).then(() => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        loadTimes.push({script, loadTime});
      });
    });
    return promises.reduce((p, fn) => p.then(fn), Promise.resolve())
      .then(() => {
        // console.table(loadTimes); // muestra por consola la tabla de scripts cargados
      });
  }

  loadScript(name: string) {
    return new Promise((resolve, reject) => {
      // Si no estamos en el navegador, resolvemos la promesa sin hacer nada
      if (!this.isBrowser) {
        resolve({script: name, loaded: false, status: 'SSR: No se puede cargar scripts en el servidor'});
        return;
      }

      // Si ya está cargado, resolvemos
      if (this.scripts[name]?.loaded) {
        resolve({script: name, loaded: true, status: 'Ya estaba cargado'});
        return;
      }

      try {
        // Cargar el script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = this.scripts[name].src;
        
        // Para IE
        if (script.readyState) {
          script.onreadystatechange = () => {
            if (script.readyState === "loaded" || script.readyState === "complete") {
              script.onreadystatechange = null;
              this.scripts[name].loaded = true;
              resolve({script: name, loaded: true, status: 'Cargado exitosamente'});
            }
          };
        } else {
          // Otros navegadores
          script.onload = () => {
            this.scripts[name].loaded = true;
            resolve({script: name, loaded: true, status: 'Cargado exitosamente'});
          };
        }
        
        script.onerror = (error: any) => {
          resolve({script: name, loaded: false, status: 'Error al cargar el script'});
        };
        
        document.getElementsByTagName('head')[0].appendChild(script);
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        resolve({script: name, loaded: false, status: 'Error: ' + errorMessage});
      }
    });
  }
}