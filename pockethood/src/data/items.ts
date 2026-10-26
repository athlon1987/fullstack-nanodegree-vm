import type { ItemDef, RecipeDef } from '../game/core/types';

export const ITEMS: Record<string, ItemDef> = {
  coffee: { id: 'coffee', name: 'Coffee', value: 5, icon: 'coffee', kind: 'good', description: 'Fresh from Mia’s espresso machine.' },
  bread: { id: 'bread', name: 'Bread', value: 8, icon: 'bread', kind: 'good', description: 'A warm, crusty loaf.' },
  flowers: { id: 'flowers', name: 'Flowers', value: 6, icon: 'flowers', kind: 'good', description: 'Cheerful garden blooms.' },
  berries: { id: 'berries', name: 'Berries', value: 9, icon: 'berries', kind: 'good', description: 'Sweet, sun-ripened berries.' },
  vegetables: { id: 'vegetables', name: 'Vegetables', value: 12, icon: 'vegetables', kind: 'good', description: 'Crunchy carrots and greens.' },
  breakfast: { id: 'breakfast', name: 'Breakfast Set', value: 24, icon: 'breakfast', kind: 'good', description: 'Coffee and toast — the perfect start.' },
  berry_pie: { id: 'berry_pie', name: 'Berry Pie', value: 40, icon: 'pie', kind: 'good', description: 'Felix’s secret family recipe.' },
  bouquet: { id: 'bouquet', name: 'Bouquet', value: 30, icon: 'bouquet', kind: 'good', description: 'Hand-tied by Luna.' },
  flower_crown: { id: 'flower_crown', name: 'Flower Crown', value: 36, icon: 'crown', kind: 'good', description: 'Festival essential.' },
  planks: { id: 'planks', name: 'Planks', value: 10, icon: 'planks', kind: 'material', description: 'Building material for upgrades.' },
  bricks: { id: 'bricks', name: 'Bricks', value: 14, icon: 'bricks', kind: 'material', description: 'Sturdy building material.' },
  furniture: { id: 'furniture', name: 'Furniture', value: 45, icon: 'chair', kind: 'good', description: 'A handmade chair.' },
  veggie_basket: { id: 'veggie_basket', name: 'Veggie Basket', value: 52, icon: 'basket', kind: 'good', description: 'A generous market basket.' },
  jam: { id: 'jam', name: 'Berry Jam', value: 28, icon: 'jam', kind: 'good', description: 'Spread it on everything.' },
};

export const RECIPES: Record<string, RecipeDef> = {
  coffee: { id: 'coffee', name: 'Coffee', building: 'cafe', level: 1, inputs: {}, coins: 2, output: 'coffee', qty: 1, seconds: 15, xp: 1 },
  breakfast: { id: 'breakfast', name: 'Breakfast Set', building: 'cafe', level: 2, inputs: { coffee: 1, bread: 1 }, output: 'breakfast', qty: 1, seconds: 90, xp: 4 },
  bread: { id: 'bread', name: 'Bread', building: 'bakery', level: 1, inputs: {}, coins: 3, output: 'bread', qty: 1, seconds: 30, xp: 1 },
  berry_pie: { id: 'berry_pie', name: 'Berry Pie', building: 'bakery', level: 2, inputs: { bread: 1, berries: 2 }, output: 'berry_pie', qty: 1, seconds: 180, xp: 6 },
  flowers: { id: 'flowers', name: 'Flowers', building: 'garden', level: 1, inputs: {}, coins: 3, output: 'flowers', qty: 2, seconds: 40, xp: 1 },
  berries: { id: 'berries', name: 'Berries', building: 'garden', level: 1, inputs: {}, coins: 4, output: 'berries', qty: 1, seconds: 60, xp: 1 },
  vegetables: { id: 'vegetables', name: 'Vegetables', building: 'garden', level: 2, inputs: {}, coins: 5, output: 'vegetables', qty: 1, seconds: 90, xp: 2 },
  bouquet: { id: 'bouquet', name: 'Bouquet', building: 'flower_shop', level: 1, inputs: { flowers: 3 }, output: 'bouquet', qty: 1, seconds: 90, xp: 4 },
  flower_crown: { id: 'flower_crown', name: 'Flower Crown', building: 'flower_shop', level: 2, inputs: { flowers: 2, berries: 1 }, output: 'flower_crown', qty: 1, seconds: 150, xp: 5 },
  planks: { id: 'planks', name: 'Planks', building: 'workshop', level: 1, inputs: {}, coins: 4, output: 'planks', qty: 1, seconds: 60, xp: 1 },
  bricks: { id: 'bricks', name: 'Bricks', building: 'workshop', level: 2, inputs: {}, coins: 6, output: 'bricks', qty: 1, seconds: 90, xp: 2 },
  furniture: { id: 'furniture', name: 'Furniture', building: 'workshop', level: 1, inputs: { planks: 2 }, output: 'furniture', qty: 1, seconds: 240, xp: 7 },
  veggie_basket: { id: 'veggie_basket', name: 'Veggie Basket', building: 'grocery', level: 1, inputs: { vegetables: 2, berries: 1 }, output: 'veggie_basket', qty: 1, seconds: 180, xp: 7 },
  jam: { id: 'jam', name: 'Berry Jam', building: 'grocery', level: 1, inputs: { berries: 2 }, output: 'jam', qty: 1, seconds: 120, xp: 4 },
};

export const itemName = (id: string) => ITEMS[id]?.name ?? id;
