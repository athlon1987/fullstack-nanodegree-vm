export type UpgradeId =
  | 'momo_vitality'
  | 'momo_power'
  | 'momo_quick'
  | 'momo_finisher'
  | 'momo_split'
  | 'scout_vitality'
  | 'scout_power'
  | 'scout_guard'
  | 'scout_echo'
  | 'scout_chain'
  | 'team_meter'
  | 'team_revive'
  | 'team_shield';

export interface UpgradeDef {
  id: UpgradeId;
  owner: 'momo' | 'scout' | 'team';
  name: string;
  text: string;
  /** ink cost per level; length = max level */
  costs: number[];
  /** golden pencils needed to unlock (skills only) */
  pencils?: number;
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'momo_vitality', owner: 'momo', name: 'Thick Fur', text: '+15% max health for Momo per level.', costs: [60, 120, 200] },
  { id: 'momo_power', owner: 'momo', name: 'Strong Grip', text: '+10% damage for Momo per level.', costs: [60, 120, 200] },
  { id: 'momo_quick', owner: 'momo', name: 'Quick Peel', text: 'Banana Boomerang recharges 15% faster per level.', costs: [50, 100, 160] },
  { id: 'momo_finisher', owner: 'momo', name: 'Cartwheel Kick', text: 'Skill: adds a fifth hit to Momo\'s combo that knocks enemies across the page.', costs: [150], pencils: 2 },
  { id: 'momo_split', owner: 'momo', name: 'Banana Split', text: 'Skill: Banana Boomerang throws two bananas on different depth lanes.', costs: [180], pencils: 3 },
  { id: 'scout_vitality', owner: 'scout', name: 'Sturdy Vest', text: '+15% max health for Scout per level.', costs: [60, 120, 200] },
  { id: 'scout_power', owner: 'scout', name: 'Big Paws', text: '+10% damage for Scout per level.', costs: [60, 120, 200] },
  { id: 'scout_guard', owner: 'scout', name: 'Badge Polish', text: 'Blocking takes no chip damage and parry window +4 frames per level. Also helps Momo\'s parry.', costs: [50, 100, 160] },
  { id: 'scout_echo', owner: 'scout', name: 'Echo Bark', text: 'Skill: Big Bark reaches further and also hits enemies behind Scout.', costs: [150], pencils: 2 },
  { id: 'scout_chain', owner: 'scout', name: 'Double Pounce', text: 'Skill: press Heavy again after a pounce for a second, faster pounce.', costs: [180], pencils: 3 },
  { id: 'team_meter', owner: 'team', name: 'Shared Rhythm', text: '+20% Team meter gain per level.', costs: [70, 140, 220] },
  { id: 'team_revive', owner: 'team', name: 'Buddy System', text: 'Revive 40% faster and +5 s before a downed hero is knocked out, per level.', costs: [80, 160] },
  { id: 'team_shield', owner: 'team', name: 'Sketch Shield', text: 'Skill: Patrol Siren and the Team Finisher give both heroes a shield and heal 20%.', costs: [200], pencils: 4 },
];

export const UPGRADE_BY_ID: Record<UpgradeId, UpgradeDef> = Object.fromEntries(UPGRADES.map((u) => [u.id, u])) as Record<UpgradeId, UpgradeDef>;
