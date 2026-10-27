// Garden plot growth (community garden behaviour). Pure helpers shared by engine, UI and renderer.
import type { GardenPlot } from '../core/types';

export const WATER_BOOST = 0.15;
export const MAX_WATER = 3;
export const WATER_GAP_MS = 5 * 60_000;

export interface PlantInfo {
  growSeconds: number;
}

/** Milliseconds from planting to harvest, after any watering. */
export const growMs = (plot: GardenPlot, plant: PlantInfo) => plant.growSeconds * 1000 * (1 - WATER_BOOST * Math.min(plot.water, MAX_WATER));

export const readyAt = (plot: GardenPlot, plant: PlantInfo) => plot.plantedAt + growMs(plot, plant);

/** 0 = seed, 1 = sprout, 2 = growing, 3 = ready to harvest. */
export function plotStage(plot: GardenPlot, plant: PlantInfo, now: number): 0 | 1 | 2 | 3 {
  const p = (now - plot.plantedAt) / growMs(plot, plant);
  return p >= 1 ? 3 : p >= 0.5 ? 2 : p >= 0.15 ? 1 : 0;
}

export const canWater = (plot: GardenPlot, now: number) => plot.water < MAX_WATER && now - plot.lastWater >= WATER_GAP_MS;
