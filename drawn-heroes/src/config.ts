// Global tuning constants. World units: x runs along the stage, z is depth
// (0 = back of the walkable band, Z_MAX = front), y is height above the floor.

export const STEP = 1 / 60; // fixed simulation step (seconds)
export const VIEW_H = 540; // logical view height
export const VIEW_W_MIN = 720;
export const VIEW_W_MAX = 1170;

export const Z_MAX = 200;
export const FLOOR_BACK_Y = 292; // screen y of the floor at z = 0
export const FLOOR_FRONT_Y = 512; // screen y of the floor at z = Z_MAX
export const SCALE_BACK = 0.78;
export const SCALE_FRONT = 1.0;

export const GRAVITY = 0.62;
export const DEPTH_HIT_TOLERANCE = 18; // extra depth slack on hurtboxes
export const HERO_SCREEN_MARGIN = 40;

export const TEAM_METER_MAX = 100;
export const PERSONAL_ULT_COST = 50;
export const COOP_COMBO_COST = 25;
export const COOP_COMBO_RANGE = 120;
export const TEAM_FINISHER_RANGE = 520;
export const TEAM_COMBO_WINDOW = 90; // frames: partner's recent hit enables a team bonus

export const SAVE_KEY = 'inkrush.save.v1';
