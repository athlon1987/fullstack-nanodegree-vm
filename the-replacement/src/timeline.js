// THE REPLACEMENT — master timeline: every shot, in order, with its duration, direction notes,
// sync events and dialogue cues. This file is the single source of truth for picture AND sound.
//
// Shot fields
//   id     unique shot id (also the key of the draw function in src/acts/<mod>.js)
//   act    1..7 (0 = titles)
//   mod    the module in src/acts/ that implements the shot
//   dur    seconds
//   set    location + lighting state
//   desc   the director's brief for the shot
//   ev     named sync events, in seconds from the start of the shot. Picture and sound both key off these.
//   in/out {fade: seconds, color}   xin: seconds of dissolve from the previous shot   vig / grain: post overrides
//
// Screen direction: Adam faces RIGHT and V1 faces LEFT in every two-shot. Leaving home = moving LEFT,
// coming home = moving RIGHT. The apartment's front door is screen LEFT; the bedrooms doorway is screen RIGHT.
import { DIALOGUE } from './dialogue.gen.js';

export const SHOTS = [
  // ───────────────────────── ACT 1 — A MAN WHO'S FAILING ─────────────────────────
  { id: 'a1_01_alarm', act: 1, mod: 'act1a', dur: 3.6, set: 'bedroom / pre-dawn blue', in: { fade: 1.0 },
    ev: { flip: 0.9, slap: 2.9 },
    desc: 'ECU of a cheap digital alarm clock with a cracked display on a bedside table, cold pre-dawn light. It reads 5:44; at `flip` it becomes 5:45 and the alarm goes off — the display glitches and stutters (the alarm is broken). At `slap` a tired hand (silhouette) drops onto it from screen left and the glitching stops.' },
  { id: 'a1_02_wake', act: 1, mod: 'act1a', dur: 3.6, set: 'bedroom / pre-dawn blue',
    ev: { sit: 0.3, back: 1.7 },
    desc: 'Wide of a small bedroom. Adam sits up on the edge of the bed (facing right), feet on the floor, shoulders rounded. At `back` he presses a hand into his lower back and winces (head dips). His wife is a sleeping shape under the blanket behind him. Blinds stripe the wall with weak blue city light.' },
  { id: 'a1_03_bank', act: 1, mod: 'ui_phone', dur: 3.2, set: 'phone insert',
    ev: { load: 0.4 },
    desc: 'Phone in Adam\'s hand, bedroom dark behind. Banking app loads at `load`: "Available balance" and big "RM 83.00". Under it a short list of recent transactions, all negative, and a red line: "Electricity — payment overdue". His thumb hovers, does nothing.' },
  { id: 'a1_04_toast', act: 1, mod: 'act1a', dur: 3.0, set: 'kitchen / grey morning',
    ev: { pop: 0.9 },
    desc: 'Close on a toaster on the kitchen counter. A thread of smoke is already rising. At `pop` two slices of toast jump up — black, burnt — and the smoke thickens. Adam\'s hand reaches in from screen left and pulls one out, juggling it because it is hot.' },
  { id: 'a1_05_ask', act: 1, mod: 'act1a', dur: 6.4, set: 'kitchen / grey morning',
    desc: 'Kitchen table. Maya (8, school pinafore, backpack on the chair) sits at the right side of the table with a bowl of cereal, facing left toward her father. Adam stands at the left holding the burnt toast, tie loose, facing right. She looks up at him hopefully and asks (a1_ask). He glances at his watch, then touches the top of her head as he answers (a1_try) — already half turned to leave. Her shoulders drop a little after the answer.' },
  { id: 'a1_06_bill', act: 1, mod: 'act1a', dur: 4.4, set: 'kitchen / grey morning',
    ev: { table: 2.6, grab: 3.3 },
    desc: 'Adam\'s wife stands by the counter at the right, facing left, holding a window envelope with a red OVERDUE stamp (the stamp must be legible). She says a1_bill without anger — just tired. At `table` she lays the envelope on the table. At `grab` Adam (left) picks up his small battered RED LUNCHBOX from the table — the one saturated warm object in the frame — and exits screen left without answering.' },
  { id: 'a1_07_boss', act: 1, mod: 'act1b', dur: 6.6, set: 'office / manager\'s glass office, flat daylight',
    desc: 'Manager\'s glass-walled office. The manager (stocky, glasses) stands behind his desk at the right, facing left. Adam sits small in a low chair at the left, facing right, lunchbox on his knees. A wall screen behind the manager shows a chart titled "PERFORMANCE — ADAM" with a red line sagging below a dashed "EXPECTED" line. Manager delivers a1_boss, tapping the desk once on "below". Adam lowers his head and answers a1_sorry1.' },
  { id: 'a1_08_car', act: 1, mod: 'act1b', dur: 4.6, set: 'street / roadside at dusk',
    ev: { sputter: 0.2, reminder: 1.6, run: 3.4 },
    desc: 'Roadside at dusk, traffic lights smearing past in the background. Adam\'s old hatchback sits dead with the hood up, steam/smoke pouring out (engine coughs at `sputter`). Adam stands beside it facing right, hands on his head. At `reminder` his phone chimes; a small notification chip floats near him: "REMINDER — Maya\'s school performance · 5:30 PM", and under it the current time "6:12 PM". At `run` he grabs the lunchbox from the roof of the car and breaks into a run, exiting screen right.' },
  { id: 'a1_09_auditorium', act: 1, mod: 'act1b', dur: 4.2, set: 'school / auditorium, empty, work lights only',
    ev: { door: 0.8 },
    desc: 'The school auditorium after the show: rows of empty chairs seen from the back, a small stage with a sagging banner "ANNUAL SCHOOL CONCERT", one work light, a few paper stars on the floor. At `door` a door at the back left opens — a slab of corridor light falls down the aisle — and Adam appears in it, out of breath, chest heaving. Nobody is here. Slow push-in on the empty stage.' },
  { id: 'a1_10_outside', act: 1, mod: 'act1b', dur: 10.2, set: 'school / front steps, blue hour',
    ev: { arrive: 0.9, kneel: 1.6, walk: 9.0 },
    desc: 'School front steps at blue hour, one lamp on. Maya sits alone on the steps at the right in her costume (a cardboard star headband), backpack beside her, facing left. Adam enters from screen left at `arrive`, slows, and at `kneel` goes down on one knee in front of her so their heads are level. She does not look at him for a1_said. He reaches a hand toward her shoulder on a1_sorry2 — she leans away. On a1_always she finally looks straight at him. At `walk` she stands, shoulders her backpack and walks past him out of frame left; he stays kneeling, hand still half raised. This is the wound the whole film is about: play it slow and still.' },
  { id: 'a1_11_night', act: 1, mod: 'act1a', dur: 3.4, set: 'kitchen / night, lights off',
    ev: { buzz: 1.7 },
    desc: 'Night. Adam sits alone at the kitchen table in the dark (facing right), slumped, the lunchbox and the unopened bill in front of him, only a little streetlight through the window. At `buzz` his phone lights up face-up on the table — and the light is not warm, it is a cold cyan that washes his face and the lunchbox.' },
  { id: 'a1_12_notify', act: 1, mod: 'ui_phone', dur: 9.6, set: 'phone insert',
    ev: { header: 0.3, line1: 1.2, line2: 2.8, button: 4.2, push: 5.6, small: 6.6 },
    desc: 'The phone screen fills most of the frame: an official-looking government app notification. A generic crest and the header "LIFE OPTIMISATION PROGRAM" (`header`). Then "Your household has been selected for a free upgrade." (`line1`), then "A better version of you. A better life for everyone." (`line2`), then a big pulsing button "ACCEPT UPGRADE" (`button`). The phone trembles slightly — he is laughing at how absurd it is. At `push` the camera pushes in toward the very bottom of the screen where tiny grey legal text sits; at `small` one line of it brightens and becomes readable: "Your family has already approved." Hold on it.' },
  { id: 'a1_13_react', act: 1, mod: 'act1a', dur: 2.8, set: 'kitchen / night, lights off',
    desc: 'Tight profile close-up of Adam (facing right) lit only by the cyan phone glow from below. The breath of a laugh is still on him; over the shot it drains away — head stills, shoulders set. Hard cut to black at the end of the shot.' },

  { id: 'title_main', act: 0, mod: 'act7b', dur: 4.4, set: 'title card', vig: 0, grain: 0.6,
    ev: { on: 0.5, split: 2.2 },
    desc: 'Black. At `on` the title "THE REPLACEMENT" appears in wide-tracked light sans capitals, perfectly centred. At `split` a second, cyan-tinted copy of the letters slides out from behind the first by a few pixels and settles exactly on top of it — as if the title had been replaced by a cleaner version of itself. Fade out over the last 0.6s.' },

  // ───────────────────────── ACT 2 — REPLACED ─────────────────────────
  { id: 'a2_01_gate', act: 2, mod: 'act2a', dur: 7.0, set: 'office / lobby turnstiles, morning', in: { fade: 0.5 },
    ev: { beep1: 1.4, beep2: 2.8 },
    desc: 'Office lobby, bright morning light. Adam (facing right, lunchbox in hand) taps his access card on a turnstile reader: at `beep1` it flashes RED — "ACCESS DENIED". He frowns, taps again at `beep2`: red again. A security guard (peaked cap) at a desk on the right, facing left, looks at his monitor, which reads "ADAM — CHECKED IN 08:02", then at Adam, and says a2_guard, pointing a thumb over his shoulder toward the offices.' },
  { id: 'a2_02_glass', act: 2, mod: 'act2a', dur: 8.6, set: 'office / glass-walled meeting room seen from the corridor',
    ev: { applause: 4.6, glance: 6.6 },
    desc: 'Over Adam\'s shoulder (he is a dark out-of-focus back/shoulder on the left edge, slouched) we look through a glass wall into a bright meeting room. Inside, another Adam — same face, same clothes, but standing straight, sleeves crisp — presents to a table of seated managers; behind him a screen shows a GREEN line climbing steeply. He gestures with easy confidence. At `applause` the whole table applauds. At `glance` the man in the room turns his head toward the glass and looks straight at us: a tiny cyan glint in his eye. Slow push-in throughout. Adam\'s own faint reflection in the glass overlaps the other man.' },
  { id: 'a2_03_reverse', act: 2, mod: 'act2a', dur: 3.4, set: 'office / corridor, at the glass',
    desc: 'Reverse: tight profile of Adam (facing right) a few centimetres from the glass, the bright room reflected as soft shapes, the applause muffled. His breath fogs a small patch on the glass. He backs away one step, then turns and bolts out of frame left.' },
  { id: 'a2_04_run', act: 2, mod: 'act2a', dur: 3.8, set: 'street / daytime city, overcast',
    desc: 'Side tracking shot: Adam runs flat out toward home — screen RIGHT — lunchbox swinging in his hand, tie over his shoulder. City layers parallax past: shopfronts, parked cars, lamp posts, pedestrians as soft silhouettes who do not look at him.' },
  { id: 'a2_05_door', act: 2, mod: 'act2b', dur: 3.0, set: 'apartment / kitchen, warm daylight',
    ev: { open: 0.9 },
    desc: 'From inside the apartment, looking at the front door (screen left). Warm light in here; the muffled sound of a tap running and laughter. At `open` the door swings in and Adam stands in the frame, panting, grey corridor light behind him. He stops dead at what he sees (off screen right).' },
  { id: 'a2_06_home', act: 2, mod: 'act2b', dur: 9.2, set: 'apartment / kitchen, warm daylight',
    ev: { stand: 5.0, look: 6.0 },
    desc: 'The wide master of the kitchen, glowing warm. At the sink (centre-right) the replacement — V1 — kneels, working a wrench under the sink. Adam\'s wife leans on the counter beside him, laughing, head thrown back. Maya crouches next to him handing him a tool, delighted. It is the happiest this room has looked. Adam is a rigid dark shape in the doorway at far left. At `stand` V1 rises, wipes his hands on a cloth and at `look` turns to Adam (facing left) with sympathy, not surprise. He says a2_early.' },
  { id: 'a2_07_who', act: 2, mod: 'act2b', dur: 6.2, set: 'apartment / kitchen, warm daylight',
    ev: { hide: 2.6 },
    desc: 'Two-shot in profile: Adam on the left facing right, V1 on the right facing left — two identical silhouettes, one slouched, rumpled and heaving, one perfectly upright and still. Adam steps in and shouts a2_who, arm thrown out pointing at him. V1 does not flinch. At `hide` Maya, in the background between them, runs behind V1\'s legs and holds on — hiding from her real father.' },
  { id: 'a2_08_wife', act: 2, mod: 'act2b', dur: 5.4, set: 'apartment / kitchen, warm daylight',
    desc: 'Medium on Adam\'s wife (facing left, toward Adam), one hand out to calm him, eyes down — embarrassed. She says a2_please. After the line she turns her face away toward V1.' },
  { id: 'a2_09_iam', act: 2, mod: 'act2b', dur: 8.0, set: 'apartment / kitchen, warm daylight',
    ev: { glint: 3.6, hand: 5.4 },
    desc: 'Tight two-shot, the two profiles close and mirrored like a man facing his reflection; slow push-in. V1, calm and kind, says a2_iam. At `glint` a small cyan light catches in V1\'s eye and holds. Adam\'s head sinks a few centimetres. At `hand` V1 lays a hand on Adam\'s shoulder and turns him, gently, toward the door.' },
  { id: 'a2_10_shut', act: 2, mod: 'act2b', dur: 5.6, set: 'apartment / corridor outside the front door, cold',
    ev: { close: 1.2, lock: 2.4 },
    desc: 'The corridor outside the apartment: cold blue-grey, a buzzing tube light. Adam stands outside his own front door, facing it (facing right). At `close` the door swings shut on the warm light; at `lock` the lock turns. A warm strip glows under the door and a frosted-glass panel shows three soft warm shapes inside — a family of three. Adam leans his forehead against the door.' },

  // ───────────────────────── ACT 3 — THE STRUGGLE ─────────────────────────
  { id: 'a3_01_police', act: 3, mod: 'act3', dur: 4.2, set: 'night street / police stop',
    ev: { raise: 2.8 },
    desc: 'Night street. A patrol car\'s red and blue lights wheel across wet walls. Adam (left, facing right) pleads with two police officers (right, facing left), pointing back the way he came, hands open. They are unmoved. At `raise` one officer lifts a handheld scanner toward Adam\'s face.' },
  { id: 'a3_02_scan', act: 3, mod: 'act3', dur: 6.2, set: 'night street / police stop',
    ev: { sweep: 0.5, sweepEnd: 2.3, stamp: 2.6 },
    desc: 'Close-up of Adam\'s face in profile (facing right), red/blue police light alternating on him. From `sweep` to `sweepEnd` a thin cyan scan line travels down his face, with HUD corner brackets and small type: "SCANNING…", "FACE MATCH: ADAM — 99.98%". (For one instant the scan light sits in his eye as a cyan glint — do not linger on it.) At `stamp` the readout slams to large mono type: "IDENTITY STATUS: DEPRECATED", red, with the system voice (a3_scan). His eyes close.' },
  { id: 'a3_03_gov', act: 3, mod: 'act3', dur: 11.4, set: 'government office / service counter, fluorescent',
    ev: { check1: 2.0, check2: 3.6, check3: 6.0, slump: 9.6 },
    desc: 'A government service hall: sickly fluorescent green-grey, rows of bolted plastic chairs, a ticket display reading "NOW SERVING 083". Adam (left, facing right) stands at a counter; a clerk (right, facing left, seated behind glass, glasses, lanyard) reads from a terminal. As the clerk says a3_clerk1, three lines appear one by one on a public display above the counter, each with a green tick: "TAX RETURN — FILED" (`check1`), "DEBTS — CLEARED" (`check2`), "LICENCE — RENEWED" (`check3`). Adam grips the counter. Then the clerk, not unkindly, a3_clerk2. At `slump` Adam\'s hands slide off the counter.' },
  { id: 'a3_04_class', act: 3, mod: 'ui_sys', dur: 6.4, set: 'screen insert / government terminal',
    ev: { stamp: 3.0 },
    desc: 'Insert of the clerk\'s terminal, old-fashioned institutional UI. Two citizen records side by side. Left: "ADAM — ACTIVE — VERIFIED", a head-and-shoulders silhouette standing straight, a green tick. Right: an identical silhouette, slouched, labelled "ORIGINAL". The clerk reads a3_clerk3; at `stamp` a red stamp bangs across the right-hand record: "REDUNDANT BIOLOGICAL INSTANCE". Under it: "Services available: none."' },
  { id: 'a3_05_bench', act: 3, mod: 'act3', dur: 5.8, set: 'night city / bench under a streetlight, rain',
    desc: 'Wide. Night, steady rain. Adam sits on a public bench under a single streetlight (facing right), collar up, lunchbox beside him, city lights dissolved into bokeh behind. He is a small shape in a big frame. Slow drift in. He takes out his phone.' },
  { id: 'a3_06_frozen', act: 3, mod: 'ui_phone', dur: 4.4, set: 'phone insert',
    ev: { alert: 0.8 },
    desc: 'Phone in his hand in the rain, droplets on the glass. The same banking app as before; at `alert` a red banner drops over it: "ACCOUNT FROZEN" / "Identity deprecated. This account now belongs to the verified holder." The balance greys out to "RM ——".' },
  { id: 'a3_07_call', act: 3, mod: 'ui_phone', dur: 8.2, set: 'phone insert',
    ev: { ring1: 0.6, ring2: 1.9, end: 6.3 },
    desc: 'Call screen: "Calling… Home" with a small heart and a round avatar that is a warm silhouette of his wife. It rings (`ring1`, `ring2`) with slow pulsing rings around the avatar. Then the network voice (a3_noanswer). At `end` the screen changes to "Call ended" and, in small type, "Number no longer linked to this device."' },
  { id: 'a3_08_video', act: 3, mod: 'videos', dur: 9.0, set: 'phone insert / video: school stage',
    ev: { applause: 3.4, trophy: 4.4 },
    desc: 'Phone screen, a social video post: a small header with his wife\'s round avatar and the caption "So proud of our Maya ⭐". The video itself: a school stage, warm lights, bunting. A teacher\'s voice announces (a3_award). Maya walks on, takes a gold star trophy; at `applause` the hall claps; at `trophy` the replacement — V1 — steps in beside her, upright and beaming, and lifts the trophy high with her; she jumps up and down, arms in the air. Like/heart counter ticking up in the corner. It should be the warmest, most joyful image in the film so far.' },
  { id: 'a3_09_watch', act: 3, mod: 'act3', dur: 9.6, set: 'night city / bench, rain',
    ev: { loop2: 3.0, loop3: 6.0, tear: 6.8, lower: 8.2 },
    desc: 'Tight profile of Adam on the bench (facing right) in the rain, the phone held up near his face out of frame bottom-right, its warm flickering video light the only warmth on him. A small picture-in-picture of the video hangs in the lower right of frame with a progress bar; at `loop2` and `loop3` the bar snaps back to zero and a "↻" pulses — he is watching it again and again. His breath goes ragged; shoulders begin to shake. At `tear` one bright tear runs down his cheek among the rain. At `lower` the warm light slides off his face as the phone drops into his lap; his head bows. He has seen his daughter truly happy for the first time — without him.' },
  { id: 'a3_10_dark', act: 3, mod: 'act3', dur: 3.6, set: 'night city / bench, rain', out: { fade: 1.4 },
    ev: { flicker: 0.8, off: 1.8 },
    desc: 'The wide again. Adam folded over on the bench. At `flicker` the streetlight above him stutters; at `off` it dies. Only rain and far-off city glow. Fade to black.' },

  // ───────────────────────── ACT 4 — THE OFFER ─────────────────────────
  { id: 'a4_01_dawn', act: 4, mod: 'act4', dur: 7.0, set: 'night city / bench at grey dawn, rain stopped', in: { fade: 1.2 },
    ev: { car: 0.8, steps: 2.2 },
    desc: 'Grey dawn, wet ground reflecting a white sky. Adam is asleep sitting up on the bench (left of centre, facing right), lunchbox in his lap. At `car` a sleek dark car glides in and stops in the background right, headlights low. At `steps` the representative gets out and walks to him (enters from the right, facing left): sharp bob haircut, long coat, heels, a slim glowing tablet held against her chest. She stops over him. He wakes. She says a4_rep1.' },
  { id: 'a4_02_offer', act: 4, mod: 'act4', dur: 9.8, set: 'night city / bench at grey dawn',
    ev: { card1: 1.0, card2: 2.9, card3: 4.2, contract: 6.2 },
    desc: 'Two-shot on the bench: Adam at the left facing right, the representative now seated at the right end, facing left, immaculate, the tablet on her knee casting cold light up between them. As she lists the offer (a4_rep2) three clean holographic cards rise from the tablet one at a time: a key — "APARTMENT" (`card1`); stacked coins — "MONTHLY ALLOWANCE" (`card2`); a blank ID card with an empty head outline — "NEW IDENTITY" (`card3`). On a4_rep3 the cards fold away and at `contract` a single document slides up: "RELINQUISHMENT OF PRIOR LIFE", a signature line glowing at the bottom.' },
  { id: 'a4_03_know', act: 4, mod: 'act4', dur: 11.4, set: 'night city / bench at grey dawn',
    ev: { away: 6.4, back: 7.7 },
    desc: 'Closer two-shot, profiles. Adam does not look at the contract. He asks a4_know. She, genuinely blank, a4_who. He turns his head to her fully: a4_daughter. She does not answer at once — at `away` she looks away from him, out at the street; at `back` she looks at him again and says, almost gently, a4_better. Hold on Adam after the line: nothing moves but his breathing.' },
  { id: 'a4_04_sign', act: 4, mod: 'ui_sys', dur: 7.4, set: 'screen insert / contract on tablet',
    ev: { sign: 1.6, signEnd: 4.6, drop: 5.4, confirm: 6.2 },
    desc: 'Insert: the contract on the tablet, cold white light. Heading "RELINQUISHMENT OF PRIOR LIFE". Body: "I, the original instance, surrender all claim to my name, my home, my employment and my family." Adam\'s hand comes in from the left with a stylus; from `sign` to `signEnd` he writes "Adam" on the signature line — draw the signature stroke by stroke, shaky. At `drop` a single drop of water lands on the glass beside the signature and spreads. At `confirm` a "SUBMIT" button lights up below, waiting.' },
  { id: 'a4_05_last', act: 4, mod: 'act4', dur: 8.4, set: 'night city / bench at grey dawn',
    ev: { hold: 1.0, nod: 5.4, rise: 6.4 },
    desc: 'Two-shot. She holds out her hand for the tablet. At `hold` Adam draws it back against his chest instead. He asks a4_last. She studies him. At `nod` the smallest nod. At `rise` she stands. Adam looks down at the lunchbox in his lap and closes his hand around it.' },

  // ───────────────────────── ACT 5 — THE CONFRONTATION ─────────────────────────
  { id: 'a5_01_arrive', act: 5, mod: 'act5', dur: 5.6, set: 'apartment / corridor outside the front door, evening', xin: 1.0,
    ev: { knock: 1.4, open: 3.2 },
    desc: 'The same cold corridor as a2_10, evening. Adam stands at his own front door (facing right), lunchbox in hand. At `knock` he knocks — three soft knocks, like a visitor. At `open` the door opens: warm light, and V1 in the doorway facing left, upright, backlit. They look at each other. V1 steps aside to let him in.' },
  { id: 'a5_02_table', act: 5, mod: 'act5', dur: 8.0, set: 'apartment / kitchen at night, one pendant lamp over the table',
    desc: 'The wide master of the kitchen at night, everything dark except a single pendant lamp over the table. The two men sit opposite each other in exact mirror symmetry: Adam on the left facing right, slouched, forearms on the table; V1 on the right facing left, straight-backed, hands folded. Slow, steady push-in. a5_love — and V1 answers at once, a5_ofcourse. a5_howmuch — a5_more. V1\'s answers come too fast.' },
  { id: 'a5_03_lunchbox', act: 5, mod: 'act5', dur: 6.0, set: 'apartment / kitchen at night, pendant lamp',
    ev: { place: 1.2 },
    desc: 'Close on the tabletop in the pool of lamplight. At `place` Adam\'s hands set the small battered red lunchbox down in the middle of the table and push it a few centimetres toward V1. We see it properly for the first time: dented metal, scratched red paint, a faded star sticker, a worn clasp. Adam says a5_why. V1\'s hands stay folded at the right edge of frame.' },
  { id: 'a5_04_scan', act: 5, mod: 'ui_sys', dur: 9.4, set: 'V1 point of view / HUD over the lunchbox',
    ev: { lock: 0.8, data: 1.2, dataEnd: 5.6, query: 6.2, noresult: 7.4 },
    desc: 'V1\'s point of view: the lunchbox on the table, seen through a cool, precise HUD. At `lock` brackets snap onto the lunchbox. From `data` to `dataEnd` fields type on rapidly around it: "OBJECT: LUNCHBOX — ENAMELLED STEEL", "PURCHASED: 14 MAR 2019 · RM 12.90", "MANUFACTURER: KILANG LOGAM SEJATI SDN BHD", "MEALS PACKED: 1,186", "TOTAL: 612,840 kcal", and a fast-scrolling log of every meal ("nasi goreng · 520 kcal", "egg sandwich · 310 kcal", …). He knows everything. At `query` a final field appears: "QUERY: WHY SHE KEEPS THIS" with a spinner. At `noresult`: "NO RESULT." — and the cursor just blinks.' },
  { id: 'a5_05_note', act: 5, mod: 'act5', dur: 12.0, set: 'apartment / kitchen at night, pendant lamp',
    ev: { open: 1.2, unfold: 2.8, read: 4.0 },
    desc: 'Close on the lunchbox, warm lamplight. At `open` Adam\'s fingers flip the clasp and lift the lid. Inside, tucked against the lid, a small square of paper folded in four, soft and grey at the creases from years of handling. At `unfold` he opens it. By `read` it fills the centre of frame, in a child\'s pencil handwriting: "Daddy, don\'t forget me when you\'re busy." with a small lopsided heart and two stick figures holding hands, one big, one small. Hold on it, completely still, to the end of the shot. Let the audience read it twice.' },
  { id: 'a5_06_noanswer', act: 5, mod: 'act5', dur: 5.4, set: 'apartment / kitchen at night, pendant lamp',
    ev: { up: 2.0, flicker: 2.8 },
    desc: 'Close profile of V1 (facing left), looking down at the note. At `up` he raises his eyes to Adam. At `flicker` the steady cyan glint in his eye stutters — twice, like a cursor losing its place — and steadies dimmer than before. For the first time he has no answer.' },
  { id: 'a5_07_letdown', act: 5, mod: 'act5', dur: 10.6, set: 'apartment / kitchen at night, pendant lamp',
    desc: 'Tight two-shot across the table, the note in Adam\'s hand between them, lamp above. Adam, quietly, a5_remember. A breath. Then a5_letdown — on "let her down" his voice gives and he looks at the note, not at V1. Silence. V1, very quietly, without pride: a5_never. Neither man moves.' },

  // ───────────────────────── ACT 6 — THE FIRST TWIST ─────────────────────────
  { id: 'a6_01_doorway', act: 6, mod: 'act6', dur: 4.8, set: 'apartment / kitchen at night, pendant lamp',
    ev: { turn: 2.4 },
    desc: 'The bedrooms doorway at screen right, a nightlight glowing in the hall behind. Maya stands in it in pyjamas, hair loose, a soft toy hanging from one hand, small against the frame. She has been listening. a6_daddy. At `turn`, cut-in or wide enough to see it: both men turn their heads toward her at exactly the same moment, the identical movement.' },
  { id: 'a6_02_walk', act: 6, mod: 'act6', dur: 8.2, set: 'apartment / kitchen at night, pendant lamp',
    ev: { start: 0.8, pass: 4.2, hug: 6.6 },
    desc: 'The wide master. Maya at the doorway, far right. V1 has risen and stands at the right of the table, nearest her, facing right toward her, arms opening slightly. Adam, still seated at the left of the table, has turned toward her (facing right). From `start` she walks toward V1. Adam sees where she is going and lowers his head. At `pass` she reaches V1 — and walks straight past him; his open hands close on nothing. She keeps walking, the length of the table, and at `hug` reaches Adam and throws her arms around his neck. His head comes up.' },
  { id: 'a6_03_hug', act: 6, mod: 'act6', dur: 10.6, set: 'apartment / kitchen at night, pendant lamp',
    ev: { arms: 2.8, tight: 8.4 },
    desc: 'Close on the hug in profile, warm lamplight: Maya\'s face pressed into her father\'s shoulder (she faces left, he faces right). a6_knew. His arms are still hanging; at `arms` they come up and close around her. He can barely get it out: a6_how. She leans back just enough to look at him: a6_because. At `tight` he pulls her in and holds on; a single warm tear catches the light on his cheek.' },
  { id: 'a6_04_v1', act: 6, mod: 'act6', dur: 7.2, set: 'apartment / kitchen at night, pendant lamp',
    ev: { soften: 1.2, phone: 5.6 },
    desc: 'Medium on V1 standing alone at the edge of the lamplight (facing left), watching them. At `soften` something in him changes: the perfect posture eases — shoulders drop, head tilts — for a moment he stands almost like Adam. He says a6_right. At `phone` he takes a phone from his pocket; it lights his face cyan from below.' },
  { id: 'a6_05_restore', act: 6, mod: 'ui_sys', dur: 9.2, set: 'phone insert / program console',
    ev: { press: 1.2, check1: 2.6, check2: 4.0, check3: 5.4, countdown: 6.8 },
    desc: 'V1\'s phone: the Program\'s operator console, clinical and cyan. One large control: "INITIATE RESTORATION". His thumb presses it at `press`. A progress list runs: "IDENTITY: ADAM — REINSTATED" (`check1`), "BANK ACCOUNT — RESTORED" (`check2`), "EMPLOYMENT RECORD — CORRECTED" (`check3`), each with a tick. At `countdown` a last line in amber: "REPLACEMENT UNIT — SHUTDOWN" with a bar that starts draining.' },
  { id: 'a6_06_shutdown', act: 6, mod: 'act6', dur: 11.6, set: 'apartment / kitchen at night, pendant lamp', out: { fade: 2.0 },
    ev: { sit: 6.2, close: 8.0, dark: 9.0 },
    desc: 'Two-shot: Adam on the left, standing now, Maya half behind his leg holding his hand; V1 on the right, facing them. V1\'s faint cyan edge-light is already dimming. Adam steps toward him, hand out: a6_wait. V1 smiles — a small tilt of the head — a6_done. At `sit` he lowers himself into the chair at the table, hands on his knees, like a man resting after work. At `close` his head bows and the glint in his eye goes out; by `dark` every trace of cyan has left him and he is only a still, dark shape at the table. The pendant lamp sways very slightly. Slow fade to black.' },

  // ───────────────────────── ACT 7 — THE FINAL TWIST ─────────────────────────
  { id: 'a7_01_week', act: 7, mod: 'act7a', dur: 2.8, set: 'card', vig: 0, grain: 0.6,
    desc: 'Black card, serif italic, centred: "A week later." Fades in over 0.6s, out over the last 0.6s.' },
  { id: 'a7_02_alarm', act: 7, mod: 'act7a', dur: 3.4, set: 'bedroom / warm dawn',
    ev: { flip: 0.8, tap: 2.4 },
    desc: 'The exact framing of the film\'s first shot — the same cracked alarm clock, 5:44 becoming 5:45 at `flip`, the same broken glitching alarm. But the light is different: a warm gold edge of sunrise across the table. At `tap` a hand comes down and switches it off gently, almost fondly.' },
  { id: 'a7_03_morning', act: 7, mod: 'act7a', dur: 7.6, set: 'apartment / kitchen, golden morning',
    ev: { pop: 2.0, five: 3.0, kiss: 5.0, exit: 6.6 },
    desc: 'The kitchen in low golden sunlight, dust in the beams. Adam and Maya make breakfast together at the counter: Maya stands on a step stool at the toaster. At `pop` the toast jumps — golden this time, no smoke. At `five` she turns and high-fives him. His wife comes in from the right; at `kiss` Adam kisses her on the cheek and she touches his arm. At `exit` he picks up his bag and goes out through the front door at left. The red lunchbox is left behind on the counter, sitting in a patch of sun — make sure we notice it.' },
  { id: 'a7_04_walk', act: 7, mod: 'act7a', dur: 4.2, set: 'street / outside the apartment block, morning sun',
    ev: { buzz: 2.4 },
    desc: 'The street outside the apartment block, long morning shadows. Adam walks to work — moving LEFT, away from home, facing left — and there is a little lift in his step that was never there before, though it is still unmistakably his walk. At `buzz` his phone vibrates; he takes it out and slows.' },
  { id: 'a7_05_msgs', act: 7, mod: 'ui_phone', dur: 9.6, set: 'phone insert',
    ev: { m1: 0.6, m2: 3.0, m3: 5.6 },
    desc: 'Phone screen in sunlight: a message thread from "Unknown number". Three grey incoming bubbles arrive one at a time, each with a buzz. `m1`: "Your optimisation trial has concluded." `m2`: "Subject demonstrated successful emotional recovery." `m3`: "Original biological Adam: Deceased 18 months ago." After the third, nothing moves. The ambient sunlight on the glass seems to cool slightly.' },
  { id: 'a7_06_stop', act: 7, mod: 'act7a', dur: 3.2, set: 'street / outside the apartment block, morning sun',
    desc: 'Wide of the street. Adam has stopped dead in the middle of the pavement, phone in his hand, head down over it (facing left). The morning goes on around him — pedestrians pass on both sides, a bus slides through the background — and he does not move at all.' },
  { id: 'a7_07_video', act: 7, mod: 'videos', dur: 11.6, set: 'phone insert / video: car interior at night',
    ev: { play: 0.6, wipe: 1.4, end: 9.8 },
    desc: 'The phone: a video attachment opens and plays at `play`, stamped "REC ●" and "18 months ago". Inside the frame of the video: the real Adam, alone in the driver\'s seat of his parked car at night, seen in profile (facing right) with the phone propped on the dashboard; rain crawling down the windscreen, a sodium streetlight outside, the dashboard glowing dimly. He is exhausted. At `wipe` he wipes his eyes with the heel of his hand. He looks into the camera and says a7_video1. A long pause — he looks away, out of the windscreen, then back — a7_video2. He reaches toward the camera; at `end` the video freezes on him and a replay arrow appears.' },
  { id: 'a7_08_v2', act: 7, mod: 'ui_phone', dur: 8.6, set: 'phone insert',
    ev: { m4: 0.8, m5: 3.6, m6: 5.8 },
    desc: 'Back to the message thread (the video is now a small thumbnail bubble above). Three more bubbles. `m4`: "You are Replacement Version 2." `m5`: "Version 1 has been retired." `m6`: "You were selected." No explanation. No sender. A typing indicator appears for a moment after the last one, and then stops.' },
  { id: 'a7_09_eye', act: 7, mod: 'act7b', dur: 5.2, set: 'street / morning sun, extreme close-up',
    ev: { glint: 0.8, glintEnd: 2.4, look: 3.0 },
    desc: 'Extreme close profile of Adam (facing left), the phone light on his face. All street sound has dropped away. From `glint` to `glintEnd` a small cyan light kindles in his eye — exactly the glint the replacement had — and holds. Then, from far off screen right, his daughter\'s voice (a7_lunch). At `look` his head turns toward the sound (toward camera / screen right), the cyan goes out, and warm sunlight takes the side of his face.' },
  { id: 'a7_10_wave', act: 7, mod: 'act7b', dur: 3.8, set: 'street / outside the apartment block, morning sun',
    desc: 'His point of view across the street: Maya on the pavement in front of the apartment block, in school uniform, facing left toward us, holding the red lunchbox up over her head with both hands and waving it, bouncing on her toes; the low sun flaring behind her. His wife stands in the building doorway behind her, small, one hand shading her eyes.' },
  { id: 'a7_11_delete', act: 7, mod: 'ui_phone', dur: 5.6, set: 'phone insert',
    ev: { hold: 0.6, dialog: 1.4, tap: 3.4, gone: 3.8, pocket: 4.8 },
    desc: 'The phone. His thumb presses and holds on the thread (`hold`). At `dialog` a sheet rises: "Delete conversation?" / "This can\'t be undone." with "Cancel" and a red "Delete". The thumb hangs over it for a long beat. At `tap` he presses Delete. At `gone` the thread collapses to nothing and the home screen shows through: the wallpaper is a child\'s crayon drawing of three figures holding hands. At `pocket` the screen goes dark as the phone drops out of frame.' },
  { id: 'a7_12_run', act: 7, mod: 'act7b', dur: 4.6, set: 'street / outside the apartment block, morning sun',
    ev: { catch: 3.6 },
    desc: 'Wide side tracking shot in golden light: Adam runs back across the street toward her — screen RIGHT, toward home — coat flying; Maya runs toward him from the right. Long shadows, sun flare. At `catch` he drops to his knees and catches her, the lunchbox pressed between them.' },
  { id: 'a7_13_hug', act: 7, mod: 'act7b', dur: 6.4, set: 'street / morning sun',
    desc: 'Close on the hug in profile, golden rim light — the same framing as the hug in a6_03, but in daylight. He holds her. a7_love. She answers into his shoulder, a7_know. Hold. There is no cyan anywhere in this image. The shot ends on a hard cut to black — no fade.' },

  { id: 'end_card', act: 0, mod: 'act7b', dur: 20.0, set: 'title card', vig: 0, grain: 0.6,
    ev: { line1: 1.6, line2: 5.0, linesOut: 9.6, title: 11.0, credits: 12.0, out: 18.2 },
    desc: 'Black and silent for the first 1.4s. At `line1`, serif italic, centred: “The world found a better version of him.” At `line2`, beneath it: “But his family didn’t need a better man.” Both fade out at `linesOut`. At `title`: THE REPLACEMENT (same lettering as the opening title). At `credits`, very small beneath: "Animation, score, sound and voices generated in code · Voices: Kokoro TTS (Apache-2.0)". Everything fades to black from `out`.' },
];

// Dialogue cues: [dialogue id, shot id, start in seconds from the start of that shot]
const CUE_TABLE = [
  ['a1_ask', 'a1_05_ask', 0.6], ['a1_try', 'a1_05_ask', 3.7],
  ['a1_bill', 'a1_06_bill', 0.5],
  ['a1_boss', 'a1_07_boss', 0.6], ['a1_sorry1', 'a1_07_boss', 4.7],
  ['a1_said', 'a1_10_outside', 2.3], ['a1_sorry2', 'a1_10_outside', 4.7], ['a1_always', 'a1_10_outside', 7.3],

  ['a2_guard', 'a2_01_gate', 4.5],
  ['a2_early', 'a2_06_home', 6.8],
  ['a2_who', 'a2_07_who', 0.8],
  ['a2_please', 'a2_08_wife', 0.7],
  ['a2_iam', 'a2_09_iam', 1.3],

  ['a3_scan', 'a3_02_scan', 2.6],
  ['a3_clerk1', 'a3_03_gov', 0.8], ['a3_clerk2', 'a3_03_gov', 7.5],
  ['a3_clerk3', 'a3_04_class', 0.9],
  ['a3_noanswer', 'a3_07_call', 3.3],
  ['a3_award', 'a3_08_video', 0.6],

  ['a4_rep1', 'a4_01_dawn', 3.4],
  ['a4_rep2', 'a4_02_offer', 0.7], ['a4_rep3', 'a4_02_offer', 5.9],
  ['a4_know', 'a4_03_know', 0.8], ['a4_who', 'a4_03_know', 2.4], ['a4_daughter', 'a4_03_know', 3.9], ['a4_better', 'a4_03_know', 8.0],
  ['a4_last', 'a4_05_last', 2.0],

  ['a5_love', 'a5_02_table', 2.2], ['a5_ofcourse', 'a5_02_table', 3.7], ['a5_howmuch', 'a5_02_table', 5.1], ['a5_more', 'a5_02_table', 6.4],
  ['a5_why', 'a5_03_lunchbox', 2.5],
  ['a5_remember', 'a5_07_letdown', 0.8], ['a5_letdown', 'a5_07_letdown', 3.7], ['a5_never', 'a5_07_letdown', 8.3],

  ['a6_daddy', 'a6_01_doorway', 1.6],
  ['a6_knew', 'a6_03_hug', 1.0], ['a6_how', 'a6_03_hug', 3.7], ['a6_because', 'a6_03_hug', 5.1],
  ['a6_right', 'a6_04_v1', 2.6],
  ['a6_wait', 'a6_06_shutdown', 1.0], ['a6_done', 'a6_06_shutdown', 3.7],

  ['a7_video1', 'a7_07_video', 2.6], ['a7_video2', 'a7_07_video', 7.0],
  ['a7_lunch', 'a7_09_eye', 2.7],
  ['a7_love', 'a7_13_hug', 2.0], ['a7_know', 'a7_13_hug', 4.0],
];

export const CUES = CUE_TABLE.map(([id, shot, at]) => {
  const d = DIALOGUE[id];
  if (!d) throw new Error(`timeline: no dialogue "${id}" in dialogue.gen.js`);
  return { id, shot, at, dur: d.dur, who: d.who, text: d.text };
});

/** Sanity checks: every cue fits inside its shot and cues never overlap. Returns a list of problems. */
export function validate() {
  const problems = [];
  const byId = Object.fromEntries(SHOTS.map((s) => [s.id, s]));
  if (new Set(SHOTS.map((s) => s.id)).size !== SHOTS.length) problems.push('duplicate shot ids');
  const perShot = {};
  for (const c of CUES) {
    const s = byId[c.shot];
    if (!s) { problems.push(`cue ${c.id}: unknown shot ${c.shot}`); continue; }
    if (c.at + c.dur > s.dur - 0.1) problems.push(`cue ${c.id} ends at ${(c.at + c.dur).toFixed(2)}s but shot ${s.id} is only ${s.dur}s`);
    (perShot[c.shot] ||= []).push(c);
  }
  for (const list of Object.values(perShot)) {
    list.sort((a, b) => a.at - b.at);
    for (let i = 1; i < list.length; i++) if (list[i].at < list[i - 1].at + list[i - 1].dur + 0.15) problems.push(`cues ${list[i - 1].id} and ${list[i].id} overlap or touch`);
  }
  for (const s of SHOTS) for (const [n, t] of Object.entries(s.ev || {})) if (t < 0 || t > s.dur) problems.push(`shot ${s.id}: event ${n} at ${t}s is outside the shot`);
  return problems;
}
