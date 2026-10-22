import type { Device } from '../core/input';
import type { HintId } from './types';

export interface StoryPanel {
  art: 'both' | 'momo' | 'scout' | 'king' | 'pencil' | 'drop' | 'end';
  text: string;
}

export const INTRO: StoryPanel[] = [
  { art: 'both', text: 'On the first page of an old sketchbook, two doodles opened their eyes.' },
  { art: 'momo', text: 'Momo the monkey could not sit still. Hands up, tongue out, tail swinging. Always ready to go.' },
  { art: 'scout', text: 'Scout the patrol pup could not stop keeping watch. Cap on, badge polished, never leaving a friend behind.' },
  { art: 'king', text: 'Then the ink bottle tipped. Out crawled the Smudge King, and every page he touched turned into a mess of Scribbles.' },
  { art: 'pencil', text: 'He is climbing to the last page, where the Master Pencil rests. If he smudges it, nothing new can ever be drawn again.' },
  { art: 'both', text: 'One doodle alone is easy to smudge. Two working together leave a mark that no ink can cover. Time to go!' },
];

export const ENDING: StoryPanel[] = [
  { art: 'king', text: 'The Team Finisher swept across the page, and the Smudge King\'s ink came apart in a shower of dots.' },
  { art: 'drop', text: 'All that was left was a tiny, shy ink drop. "I only wanted to be part of the picture," it whispered.' },
  { art: 'both', text: 'Momo grinned. Scout tipped the patrol cap. Together they drew the little drop a smile.' },
  { art: 'pencil', text: 'The Master Pencil sketched every page back, brighter than before. Meadows, canyons, a city full of neon.' },
  { art: 'end', text: 'And on the very last page there were three friends, which is the best kind of ending a sketchbook can have.' },
];

type HintKey = HintId | 'twins' | 'finale' | 'out' | 'swap';

export function hintText(id: HintKey, device: Device, mode: 'solo' | 'coop'): string {
  const kb = device === 'keyboard';
  const pad = device === 'gamepad';
  const two = mode === 'coop';
  const K = (solo: string, p1: string) => (two ? p1 : solo);
  switch (id) {
    case 'move':
      return kb ? K('Move with W A S D. W and S walk into and out of the page.', 'P1 moves with W A S D, P2 with the arrow keys.') : pad ? 'Move with the left stick. Up and down walk deeper into the page.' : 'Drag the left side of the screen to move. Up and down walk deeper into the page.';
    case 'attack':
      return kb ? K('J for light attacks (tap for a combo), K for heavy. Hold K to charge.', 'P1: C light, V heavy. P2: J light, K heavy. Hold heavy to charge.') : pad ? 'X for light attacks, Y for heavy. Hold Y to charge.' : 'Tap HIT for light attacks and !! for heavy. Hold heavy to charge.';
    case 'jump':
      return kb ? K('Space to jump. Momo can jump again in mid-air!', 'Jump: P1 Space, P2 U. Momo can double jump!') : pad ? 'A to jump. Momo can double jump!' : 'Tap JUMP to jump. Momo can double jump!';
    case 'dodge':
      return kb ? K('Shift + direction to dodge. Hold Shift standing still to block; block right as a hit lands to PARRY.', 'Dodge/block: P1 L-Shift, P2 O. Block just before a hit to PARRY.') : pad ? 'RB + direction to dodge. Hold RB still to block; time it to PARRY.' : 'Dodge button + direction to dodge. Hold it standing still to block; time it to PARRY.';
    case 'special':
      return kb ? K('L for your special: Momo\'s Banana Boomerang, Scout\'s Big Bark.', 'Specials: P1 B, P2 L.') : pad ? 'B for your special ability.' : 'The ★ SPECIAL button is your special ability.';
    case 'team':
      return 'Hit an enemy right after your partner does for a TEAM bonus. Launched enemies take extra RELAY damage from the other hero.';
    case 'coop':
      return kb ? K('Next to your partner with 25% Team meter, press E for a co-op combo!', 'Next to your partner with 25% Team meter: P1 E, P2 P for a co-op combo!') : pad ? 'Next to your partner with 25% Team meter, press LB for a co-op combo!' : 'Next to your partner with 25% Team meter, tap the + HELP button for a co-op combo!';
    case 'plates':
      return 'Team plates! Both heroes must stand on the two glowing plates at once to open the gate.';
    case 'revive':
      return kb ? K('A hero is down! Stand next to them and HOLD E to revive before the timer runs out.', 'A hero is down! Stand next to them and hold interact (P1 E, P2 P) to revive.') : pad ? 'A hero is down! Hold LB next to them to revive.' : 'A hero is down! Hold the + HELP button next to them to revive.';
    case 'ultimate':
      return kb ? K('Full Team meter + partner nearby: press I for the TEAM FINISHER. At 50% it fires your personal ultimate.', 'Team Finisher: P1 Q, P2 I with a full meter.') : pad ? 'Full Team meter: press RT for the TEAM FINISHER. At 50% it fires your ultimate.' : 'Full Team meter: tap TEAM for the TEAM FINISHER. At 50% it fires your ultimate.';
    case 'heavy':
      return 'Shielded! Heavy attacks break guards. Or have your partner hit it from behind.';
    case 'secret':
      return 'Golden pencils hide on ledges, over pits and inside crates.';
    case 'hazard':
      return 'Hazards hurt Scribbles too. Knock enemies into them!';
    case 'twins':
      return 'Defeat BOTH Smudge Twins within 8 seconds of each other, or the first one comes back!';
    case 'finale':
      return kb ? K('He\'s cracking! Press I for the TEAM FINISHER!', 'He\'s cracking! TEAM FINISHER now (P1 Q / P2 I)!') : pad ? 'He\'s cracking! Press RT for the TEAM FINISHER!' : 'He\'s cracking! Tap TEAM for the TEAM FINISHER!';
    case 'out':
      return 'A hero was knocked out. Clear this area to bring them back.';
    case 'swap':
      return kb ? 'Press Tab to switch which hero you control.' : pad ? 'Press Select to switch heroes.' : 'Tap SWAP to switch heroes.';
  }
}
