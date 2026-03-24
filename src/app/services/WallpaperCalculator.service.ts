import { Injectable } from "@angular/core";

export interface Wall {
  widthFt: number;
  heightFt: number;
}

export interface WallpaperSpecs {
  rollWidthInches: number;
  rollLengthFt: number;
  patternRepeatInches: number;
}

@Injectable({
  providedIn: 'root'
})
export class WallpaperCalculatorService {

  calculateRolls(walls: Wall[], specs: WallpaperSpecs): number {

    const rollWidthFt = specs.rollWidthInches / 12;
    const patternRepeatFt = specs.patternRepeatInches / 12;

    // 1️⃣ Perímetro total
    const totalWidth = walls.reduce((sum, wall) => sum + wall.widthFt, 0);

    // 2️⃣ Número de tiras
    const stripsNeeded = Math.ceil(totalWidth / rollWidthFt);

    // 3️⃣ Altura ajustada por pattern repeat
    const height = walls[0].heightFt; // asumiendo misma altura
    const adjustedHeight =
      Math.ceil(height / patternRepeatFt) * patternRepeatFt;

    // 4️⃣ Tiras por rollo
    const stripsPerRoll =
      Math.floor(specs.rollLengthFt / adjustedHeight);

    // 5️⃣ Rollos necesarios
    const rollsNeeded =
      Math.ceil(stripsNeeded / stripsPerRoll);

    return rollsNeeded;
  }
}
