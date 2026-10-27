// LAYER B — the gameplay template library. A template is the reviewed *rule set* for a
// kind of place: which behaviours it may run, which prefabs may dress it and the economic
// limits its content must stay inside. Modules (Layer C) only supply data for a template.
import type { CATEGORIES, PREFABS } from './catalog';

export const TEMPLATE_IDS = ['restaurant', 'cafe', 'retail', 'residential', 'learning', 'showroom', 'park', 'hotel', 'farm', 'community'] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const BEHAVIOR_TYPES = ['hand_prepare', 'quiz', 'showroom', 'garden_plots', 'visitors', 'ambient_sound'] as const;
export type BehaviorType = (typeof BEHAVIOR_TYPES)[number];

export interface TemplateDef {
  id: TemplateId;
  category: (typeof CATEGORIES)[number];
  /** Behaviours a module on this template may enable. */
  behaviors: readonly BehaviorType[];
  prefabs: readonly (typeof PREFABS)[number][];
  limits: {
    items: number;
    recipes: number;
    itemValue: [number, number];
    recipeSeconds: [number, number];
    recipeCoins: number;
    qty: number;
    xp: number;
    /**
     * Ceiling on net value created per minute by any recipe (output value − input value − coins),
     * roughly matching the best core recipe. Sponsored or partner content cannot buy an economic edge.
     */
    valuePerMinute: number;
    questCoins: number;
  };
  /** 'available' templates have a core building slot; 'template_only' are defined for future worlds. */
  status: 'available' | 'template_only';
}

const food = { items: 8, recipes: 8, itemValue: [2, 60] as [number, number], recipeSeconds: [12, 600] as [number, number], recipeCoins: 10, qty: 3, xp: 8, valuePerMinute: 24, questCoins: 200 };
const none = { items: 0, recipes: 0, itemValue: [1, 1] as [number, number], recipeSeconds: [60, 60] as [number, number], recipeCoins: 0, qty: 1, xp: 1, valuePerMinute: 0, questCoins: 200 };

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  cafe: { id: 'cafe', category: 'food_beverage', behaviors: ['hand_prepare', 'visitors', 'ambient_sound'], prefabs: ['kopitiam', 'shoplot', 'cafe_cottage', 'hawker_stall'], limits: food, status: 'available' },
  restaurant: { id: 'restaurant', category: 'food_beverage', behaviors: ['hand_prepare', 'visitors', 'ambient_sound'], prefabs: ['shoplot', 'hawker_stall', 'kopitiam'], limits: food, status: 'available' },
  retail: { id: 'retail', category: 'retail', behaviors: ['visitors', 'ambient_sound'], prefabs: ['shoplot'], limits: { ...food, valuePerMinute: 18 }, status: 'available' },
  residential: { id: 'residential', category: 'residential', behaviors: [], prefabs: [], limits: none, status: 'available' },
  learning: { id: 'learning', category: 'education', behaviors: ['quiz', 'visitors', 'ambient_sound'], prefabs: ['learning_house', 'shoplot'], limits: none, status: 'available' },
  showroom: { id: 'showroom', category: 'automotive', behaviors: ['showroom', 'visitors', 'ambient_sound'], prefabs: ['showroom_glass'], limits: none, status: 'available' },
  park: { id: 'park', category: 'recreation', behaviors: ['visitors', 'ambient_sound'], prefabs: [], limits: none, status: 'available' },
  hotel: { id: 'hotel', category: 'hospitality', behaviors: ['visitors', 'ambient_sound'], prefabs: ['shoplot'], limits: none, status: 'template_only' },
  farm: { id: 'farm', category: 'agriculture', behaviors: ['garden_plots', 'visitors', 'ambient_sound'], prefabs: ['community_garden'], limits: { ...food, valuePerMinute: 18 }, status: 'available' },
  community: { id: 'community', category: 'community', behaviors: ['visitors', 'ambient_sound'], prefabs: [], limits: none, status: 'available' },
};

/** Neutral defaults a template runs when no module dresses it (and when a module is switched off). */
export const NEUTRAL_BEHAVIORS: Partial<Record<TemplateId, string>> = {
  learning: 'quiz:core',
  showroom: 'showroom:core',
};
