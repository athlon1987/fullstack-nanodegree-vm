# Photography

The photo library for the visual redesign: what it should contain, the licence rules, how the photos are chosen and processed, and how to replace them with Malaysia Airports' own photography later.

Code: `src/content/images.ts` (the library and its helpers), `src/content/images.test.ts` (the checks), `public/images/` (the files), `/[lang]/credits` (`src/app/[lang]/credits/page.tsx`, copy in `src/lib/i18n/features/credits.ts`).

## Status: 30 photographs (22 to 23 November 2026), colour-graded as one set (redesign 1c)

The library holds **30 photographs from Wikimedia Commons**, every one looked at before it was chosen, its licence and author read from its file page, and processed as in "Procedure". On 23 November (redesign 1c, `docs/qa/fixes/redesign1c.md`) every file was re-exported from the downloaded Commons file with one subtle colour grade (see "Colour grade"), and each credit now says "colour-graded". `public/images` is **11.45 MB** (12,004,275 bytes; limit 14 MB). `images.test.ts` passes (7 of 7), including "at least 24 photos and every use covered" and the check that every credit records the grade.

How the photos are used (all ids and lists in `src/content/images.ts`; this section follows the code):

- **Home hero** (`HOME_HERO_IMAGES`, the first is shown): `mount-kinabalu`, then `klia-t1-aerial`, `klia-t1-roof`. Chosen in redesign 1c by judging six library photographs in place, behind the real headline and search, at 1,440 × 900 and 390 × 844: the roof canopies (overcast, gloomy under the veil), the 2026 aerial and the roofline across the airfield (grey texture under the scrims), Mount Kinabalu at sunset (warm, the summit fills the phone band under the header), the Petronas Towers (stood behind the headline) and the apron at night (an airline's aircraft as the subject). Framing per breakpoint: `HOME_HERO_FRAMING` in `src/components/home/hero-backdrop.tsx`.
- **Airport heroes** (`AIRPORT_HERO_IMAGES`, the airport's own photographs first; the first is shown): KLIA `klia-t1-aerial`, `klia-t1-airfield`, `klia-t1-canopy` (redesign 1c: the aerial, judged in place against the roofline, the roof canopies, the ceiling and the jets taxiing past Terminal 1); Penang `pen-terminal`, `penang-bridge`; Kota Kinabalu `bki-terminal`, `mount-kinabalu`; Langkawi `lgk-terminal`, `langkawi-beach`; Kuching `kch-terminal`, `kuching-waterfront`. Framing and the strength of the cinematic shade per photograph: `HERO_FRAMING` in `src/components/airport/airport-backdrop.tsx` (see "Text over the photos").
- **Every other airport** (Subang, Ipoh, Tawau and the rest) gets `FALLBACK_HERO` = `wing-window`: a wing above islands on a flight from Kuching to Kuala Lumpur. It shows no airport, and its alt text does not claim the islands are Malaysian (the file does not say).
- **Home place cards** (`placePhoto` in `src/components/home/destination-card.tsx`): the place's photographs in credits order, the ones in `PLACE_PREFERENCE` first, never the home hero: KLIA Terminal 1 `klia-t1-aerial`, KLIA Terminal 2 `klia2-terminal`, Penang `penang-bridge`, Kota Kinabalu `bki-airfield` (Mount Kinabalu is the hero), Langkawi `langkawi-beach`, Kuching `kuching-waterfront`.
- **Destination cards** (`DESTINATION_IMAGES`, also the style guide's pool): `kl-petronas`, `penang-bridge`, `mount-kinabalu`, `langkawi-beach`, `kuching-waterfront`, `langkawi-sky-bridge`, `george-town-blue-mansion`.
- **Discover** (`DISCOVER_IMAGES`; the home's shop and dine strip takes its food photographs and `george-town-street`): `klia-t1-roof`, `nasi-lemak`, `klia-ekspres`, `satay`, `petronas-skybridge`, `khoo-kongsi`, `langkawi-eagle-square`, `george-town-street`, `langkawi-paddy`, `apron-night`, `aircraft-malaysia-airlines`, `klia-t1-aerial`.
- **Airports directory** (`/airports`; `DIRECTORY_IMAGES`, else the airport's first hero): KLIA `klia-t1-aerial`, Penang `pen-terminal`, Kota Kinabalu `bki-airfield`, Langkawi `langkawi-beach`, Kuching `kch-terminal`. Redesign 1c: these five (the international group) open the page as a mosaic of large photo cards above the search and the filters.
- **Explore cards on an airport overview** (`EXPLORE_IMAGES`): KLIA Flights `apron-night`, Terminal map `klia-tower` (redesign 1c: the aerial is now the hero), Shops and food `nasi-lemak`, Lounges `klia-t1-canopy`; Penang Flights `pen-terminal`, Shops and food `george-town-street`; Kota Kinabalu Flights `bki-airfield`; Kuching Flights `kch-terminal`.
- In the library and credited but in no list: `aircraft-terminal-1` (two airlines' liveries are the subject; keep it for a flights page or drop it).

### Colour grade (redesign 1c)

One grade for the whole set, so the Wikimedia photographs (eleven photographers, 2010 to 2026, overcast and sunny) read as one brand. It is subtle by design: nothing a visitor would call a filter. Script: `grade.mjs` (session scratch folder of the redesign 1c log), run on the downloaded Commons files with the same crops, sizes and JPEG settings as the original export; the grade sits between the resize and the encode, on 8-bit sRGB:

1. **Levels, adaptive but limited**: the 0.5th and 99.5th luminance percentiles move half way towards 4/255 and 246/255, each by at most 12/255. Hazy files gain depth (`klia-t1-aerial` black point 24 → 14, `klia-t1-airfield` and `bki-airfield` 35 → 23, `wing-window` 35 → 23); files that already reach black and white are left almost alone.
2. **Consistent contrast**: the spread of luminance is pulled a third of the way towards a standard deviation of 0.215, limited to ×0.94 to ×1.10, around the photograph's own mid-grey (flat files such as the aerial, the tower, the bridge and the skybridge ×1.10; contrasty ones such as the roof canopies and Mount Kinabalu ×0.94).
3. **Controlled highlights**: above 0.72 the tone curve rolls off smoothly so that white maps to 0.96: skies, clouds and white roofs keep their detail and nothing clips.
4. **Slight warmth**: red ×1.018 (+1/255), blue ×0.968, weighted by lightness, so the light tones warm a little and the shadows stay neutral.
5. **Vibrance +6 %**: more for muted colours than for saturated ones.

Every credit's `modified` is now "resized and colour-graded" or "cropped, resized and colour-graded", the credits page says "Resized, colour-graded and compressed" (Malay "Saiz diubah, warna dilaraskan dan dimampatkan"), and its note on changes describes the grade. The licences are unchanged; ShareAlike files are shared under the same licence as before.

### Chosen

Licence, author and date are as the Commons file page states them (author without markup; "CEphoto, Uwe Aranas" is that photographer's requested credit line). Dual-licensed files (GFDL and CC BY-SA) are used under their CC BY-SA licence.

| Id | What it shows (alt text, English) | Photographer, licence, date taken | File |
|---|---|---|---|
| `klia-t1-canopy` | White branching columns under the timber-lined roof above the C gates at KLIA Terminal 1, Sepang | Eugene Ormandy, CC0 1.0, 9 May 2024 | 2560×1229, 573 KB, cropped |
| `klia-t1-aerial` | KLIA Terminal 1 from the air: the main terminal roof and the gate building, with aircraft parked alongside, Sepang | Yu Chu Chin, CC BY-SA 4.0, 15 January 2026 | 2560×1707, 580 KB |
| `klia-t1-roof` | Curved roof canopies on tapered columns along the outside of the KLIA Terminal 1 main building, Sepang | Descon7, CC BY-SA 3.0, November 2010 | 1920×1440, 184 KB |
| `klia-t1-airfield` | The roofline of KLIA Terminal 1 seen across the airfield, with forested hills behind, Sepang | Pangalau, CC BY-SA 4.0, 26 March 2023 | 1920×1011, 182 KB, cropped |
| `klia-tower` | The KLIA air traffic control tower beside the airport hotel, seen from the air, Sepang | Yu Chu Chin, CC BY-SA 4.0, 15 January 2026 | 1920×1280, 419 KB |
| `klia2-terminal` | An AirAsia aircraft at a gate of KLIA Terminal 2, with the control tower behind, Sepang | Pangalau, CC BY-SA 4.0, 26 March 2023 | 1920×1280, 168 KB |
| `aircraft-malaysia-airlines` | A Malaysia Airlines Airbus A330 in a Malaysian flag livery at KLIA, Sepang | Bahnfrend, CC BY-SA 4.0, 23 February 2025 | 2560×1441, 318 KB |
| `apron-night` | An AirAsia Airbus A320neo at a passenger bridge on the apron at KLIA at night, Sepang | Bahnfrend, CC BY-SA 4.0, 18 August 2024 | 1920×1279, 227 KB |
| `aircraft-terminal-1` | Malaysia Airlines and Batik Air jets on the taxiway in front of KLIA Terminal 1, Sepang | Bahnfrend, CC BY-SA 4.0, 23 February 2025 | 1920×1069, 252 KB |
| `klia-ekspres` | A KLIA Ekspres train, the non-stop rail service between KL Sentral and KLIA | Wei Kakurai, CC BY-SA 4.0, 20 August 2022 | 1920×1200, 359 KB |
| `penang-bridge` | The Penang Bridge across the Penang Strait on a misty morning | HundenvonPenang, CC BY-SA 4.0, 23 December 2024 | 2560×1920, 551 KB |
| `pen-terminal` | Penang International Airport across the airfield, with Bayan Lepas and the hills of Penang Island behind | HundenvonPenang, CC BY-SA 4.0, 8 December 2024 | 2560×1689, 637 KB, cropped |
| `george-town-blue-mansion` | Louvred windows on the indigo walls of the Cheong Fatt Tze Mansion, the Blue Mansion, George Town, Penang | CEphoto, Uwe Aranas, CC BY-SA 3.0, 8 January 2014 | 1920×1280, 314 KB |
| `george-town-street` | A bicycle stall selling coconuts on Lebuh Penang, George Town, Penang | CEphoto, Uwe Aranas, CC BY-SA 3.0, 8 January 2014 | 1920×1280, 475 KB |
| `khoo-kongsi` | Carved and gilded roof beams inside the Khoo Kongsi clan house, George Town, Penang | Supanut Arunoprayote, CC BY 4.0, 15 January 2020 | 1920×1280, 583 KB |
| `mount-kinabalu` | Mount Kinabalu in the evening light above forested hills, Sabah | Angah hfz, CC BY-SA 4.0, 2 March 2019 | 2560×1707, 455 KB |
| `bki-terminal` | The entrance of Kota Kinabalu International Airport, with flowering shrubs in front | CEphoto, Uwe Aranas, CC BY-SA 3.0, 19 April 2015 | 2560×1585, 643 KB |
| `bki-airfield` | Terminal 1 of Kota Kinabalu International Airport across the airfield, with mountains behind | Jahurz93, CC BY 4.0, 27 January 2025 | 1920×1080, 348 KB |
| `langkawi-beach` | Rocks, palms and white sand at Pantai Cenang, Langkawi | NickLubushko, CC BY-SA 4.0, 1 March 2015 | 1920×1080, 305 KB |
| `lgk-terminal` | The departures entrance of Langkawi International Airport, signed Perlepasan and Departure | CEphoto, Uwe Aranas, CC BY-SA 3.0, 13 January 2014 | 2560×1327, 363 KB |
| `langkawi-sky-bridge` | The curved Langkawi Sky Bridge hanging from a single pylon above the rainforest of Gunung Mat Cincang | Engin Akyurt, CC0 1.0, 18 November 2016 | 1920×1281, 385 KB |
| `langkawi-eagle-square` | The eagle statue at Dataran Helang (Eagle Square), Kuah, Langkawi, framed by white gateways | CEphoto, Uwe Aranas, CC BY-SA 3.0, 12 January 2014 | 1920×1280, 230 KB |
| `langkawi-paddy` | Green rice paddies and a scarecrow below forested hills on Langkawi | CEphoto, Uwe Aranas, CC BY-SA 3.0, 12 January 2014 | 1920×1280, 538 KB |
| `kuching-waterfront` | The Sarawak State Legislative Assembly building across the Sarawak River from the Kuching Waterfront, with a river boat | CEphoto, Uwe Aranas, CC BY-SA 4.0, 16 July 2017 | 2560×1707, 526 KB |
| `kch-terminal` | The curved roof canopies of the terminal at Kuching International Airport | Medelam, CC BY-SA 4.0, 28 July 2024 | 1920×1533, 511 KB |
| `kl-petronas` | The Petronas Twin Towers and Menara Kuala Lumpur rising above the trees of Kuala Lumpur | CEphoto, Uwe Aranas, CC BY-SA 3.0, 8 August 2012 | 1920×1280, 344 KB |
| `petronas-skybridge` | The skybridge between the two Petronas Twin Towers, seen from below, Kuala Lumpur | Marcin Konsek, CC BY-SA 4.0, 6 March 2016 | 1920×1280, 358 KB |
| `nasi-lemak` | A plate of nasi lemak with fried chicken, a fried egg, sambal, cucumber and peanuts, and a young coconut to drink | مانفی, CC BY-SA 4.0, 5 September 2015 | 1920×1289, 266 KB |
| `satay` | Skewers of satay with peanut sauce, nasi impit rice cakes and cucumber | LoneCK88, CC BY-SA 4.0, 2 December 2018 | 1920×1440, 350 KB |
| `wing-window` | An aircraft wing above islands and scattered cloud, seen from a window seat on a flight from Kuching to Kuala Lumpur | Marufish from Alor Setar, Malaysia, CC BY-SA 2.0, 16 May 2015 | 2560×1920, 279 KB, cropped |

Crops (also in each entry's `credit.crop`): `klia-t1-canopy` keeps the upper 64 percent (roof and columns; leaves out the walkway, passengers and construction hoardings); `klia-t1-airfield` keeps the upper 79 percent (leaves out the tail of a parked aircraft); `pen-terminal` keeps the upper 88 percent (leaves out foreground rooftops); `wing-window` keeps the upper-left 86 percent (leaves out the edge of the cabin window).

Dates worth knowing: `klia-t1-roof` (2010), `kl-petronas` (2012), the CEphoto photos of George Town, Langkawi and Kota Kinabalu (2014 to 2015) and `langkawi-beach` (2015) are older, but each shows something that has not changed (the KLIA roof, the towers, heritage buildings, a beach, the airport buildings). The 2009 Kuala Lumpur skyline was rejected for that reason (see "Rejected"). Recheck `lgk-terminal` and `bki-terminal` against the airports today before a public launch.

Quality and size: JPEG quality 80 (mozjpeg, progressive, sRGB, metadata stripped); 76 for `pen-terminal` and `bki-terminal` and 74 for `khoo-kongsi`, the three most detailed files. Heroes are saved at 2,560 px on the long edge, cards at 1,920 px. Four photos are 1,920 px because that is the largest version this environment could download (see "Access"): `klia-ekspres`, `langkawi-beach`, `kch-terminal` and `kl-petronas`; `kch-terminal` is an airport hero at 1,920 px and is sharp at that size. Since redesign 1c the home hero (`mount-kinabalu`) and KLIA's hero (`klia-t1-aerial`) are 2,560 px files; `klia-t1-roof` and `klia-t1-airfield`, heroes until then, stay 1,920 px (their originals are 3,840 px if either leads again). The sizes in the table are after the colour grade.

### Text over the photos

How the words stay legible over a photograph (code: `src/app/globals.css`, `src/components/airport/airport-backdrop.tsx`, `src/components/home/hero-backdrop.tsx`):

- **Airport heroes from 1,024 px (redesign 1c)**: one cinematic shade over the whole photograph (`hero-shade`), not a panel behind the words. Left to right it is dark under the words' column (`min(56rem, 60vw)` from the page's text edge) and falls with an eased curve over the rest of the width, so the right of the picture keeps almost all its light; a bottom gradient sinks the photograph into the band's midnight under the search, and a light top veil meets the header. Per photograph, `HERO_FRAMING` sets the wide-screen framing (the subject in the open right half) and the shade's strength (`shade`, default 0.66 where the fall starts; 0.7 for the bright skies of `klia-t1-airfield` and `wing-window`). High contrast raises it to 0.86. Below 1,024 px the words keep their feathered scrim; on phones the photograph is a band above the words.
- **Home hero**: the veil under the header, a feathered scrim behind the headline and a bottom third behind the glass tiles; the search, the mode switch, the tiles and "Departing now" are panels of their own.
- **Cards** (destinations, discover, directory, Explore): a scrim only under the words, fading out 3rem above them.

Measured on the redesign 1c production build (`docs/qa/fixes/redesign1c.md`, item 1; the integrate, polish and verification method: every visible text run over a photograph, the brightest 1 % of the pixels behind it, large text held to 4.5:1 as well): **3,559 runs on 120 page loads, 0 under 4.5:1**, lowest 5.36:1 (the home's gold line "rancang perjalanan anda." at 1,440 px). Pages: the home, the six airport heroes (KLIA, Penang, Kota Kinabalu, Langkawi, Kuching, and Subang for the fallback), the directory and the credits page; 390, 1,280, 1,440 and 1,920 px; light, dark, high-contrast light and dark; English and Malay. Over the airport heroes: every `h1` 7.01 or more, "All airports" 6.29 or more, "Find a flight at …" 9.47 or more. axe: 0 violations on all 120 loads.

Known weakness: Langkawi's photograph (`lgk-terminal`) has "Perlepasan / Departure" across its top third, which sits behind the words on wide screens (legible, 6.29:1 or more, but busy). Its beach (`langkawi-beach`, the directory's card) would make a calmer hero; or replace the file with Malaysia Airports' own photograph.

### Access and request counts (22 to 23 November)

All requests used the agreed User-Agent `MAHBConceptPrototype/1.0 (https://github.com/athlon1987/fullstack-nanodegree-vm) image-research`, no cookies or referrer, at least one second apart (later 2 to 20 s after refusals), with a counter on disk and a hard stop at 500.

| | Requests | Refused (HTTP 429) |
|---|---|---|
| Category pages (`/wiki/Category:…`, 49 categories) | 49 | 0 |
| Candidate previews at 1,280 px (117 files; 6 of the requests through `Special:FilePath`) | 128 | 10 |
| File pages for licence and author (`/wiki/File:…`, 34 files) | 36 | 2 |
| Commons API (one batched `titles=` request) | 1 | 1 (so no further API use) |
| Chosen files: 3,840 px bucket (25) | 27 | 2 |
| Chosen files: through `Special:FilePath?width=2560` (1) | 13 | 12 |
| Chosen files: originals on upload.wikimedia.org | 2 | 2 |
| Chosen files: 1,920 px bucket (4) | 4 | 0 |
| A direct 2,560 px thumbnail (HTTP 400, see below) | 1 | 0 |
| **Total requests sent** | **261** | **29** |

Counting every redirect hop as a request (a `Special:FilePath` request is three), the total is **299 of the 500 allowed**.

What works from this environment (for the next pass): category and file pages on commons.wikimedia.org; thumbnails from **thumb.wikimedia.org** at the standard widths (1,280, 1,920 and 3,840; `/wikipedia/commons/thumb/<a>/<ab>/<name>/<width>px-<name>`, one request with no redirect). Thumbnails there are refused (429) after bursts of about ten, so pace them at 6 s or more. A non-standard width (2,560) is refused with HTTP 400, and `Special:FilePath?width=2560` redirects to the 3,840 bucket, so the 3,840 bucket was the source for every chosen file wider than 3,840 px (resized here to 2,560 or 1,920). Originals on upload.wikimedia.org and `Special:FilePath` for files no wider than 3,840 px were refused, so those four files come from the 1,920 bucket. The Commons API refused its one request, as this morning. Thumbnails on upload.wikimedia.org were refused for uncached sizes.

## Contract for pages that show photos

- **Every lookup can be empty.** `heroForAirport()` returns `SiteImage | undefined`; the lists can be empty. Each photo slot needs a designed treatment without a photo (a deep solid or gradient panel of the same size), which is also what pages show today.
- **Reserve the space**: pass `width` and `height`, or use `fill` inside a box with a fixed aspect ratio. Never let a photo change the layout when it loads.
- **Text over a photo** must reach 4.5:1 against the darkest and the lightest part it can cover: use a scrim (a gradient from `rgb(0 0 0 / 0.65)`) or a solid or glass panel behind the text. Check it at both breakpoints, because `object-fit: cover` crops differently.
- **Crop with the focal point**: `style={{ objectPosition: objectPosition(image) }}`.
- **Alt text**: `image.alt[lang]`. Use `alt=""` only where the same words are visible next to the photo (as on the credits page) or the photo is purely decorative behind a heading that says the same.
- **Loading**: the largest above-the-fold photo gets `preload` (Next 16 replaces `priority`), everything else stays lazy. Give `sizes` that match the layout.
- **Motion**: no Ken Burns pans or zooms unless they stop under `prefers-reduced-motion` and the site's own motion setting.
- **Import from Server Components** and pass the one `SiteImage` to a Client Component as a prop: the blur placeholders make the module about 1 KB per photo.
- AVIF: `next/image` serves WebP only by default; `images: { formats: ['image/avif', 'image/webp'], qualities: [60, 65, 75] }` in `next.config.ts` adds AVIF (heroes use quality 65, cards 60).

## Licence rules

Accepted (`ALLOWED_LICENCES`): **CC0 1.0, public domain, CC BY 2.0, 2.5, 3.0, 4.0, CC BY-SA 2.0, 2.5, 3.0, 4.0.** Never NC (non-commercial), ND (no derivatives: we resize and crop), GFDL-only, fair use, "all rights reserved", or anything unclear.

For each file, read `prop=imageinfo&iiprop=url|size|extmetadata` and check:

- `LicenseShortName` is in the accepted set (a dual-licensed file qualifies if one of its licences does; record that one). `UsageTerms` agrees with it.
- `Artist` (or `Credit` when there is no artist) gives the author. Store it as the file credits it, without markup. If the file asks for a specific attribution line, use it.
- `Restrictions`: "personality" rights rule out photos where a person is identifiable; "trademarked" is acceptable when the mark is incidental (an airline livery on an aircraft at the gate), never when the photo would imply endorsement.
- No open deletion request on the file page and no doubt about the uploader being the author.
- `DateTimeOriginal`: prefer recent photos, because terminals change (signage, retail, the KLIA Aerotrain); an older photo must still show the place as it is.

Credits, as required by CC BY and CC BY-SA: the author, the licence with a link to the deed, a link to the original, and what was changed ("resized" or "cropped and resized", with the crop described). The credits page shows all four for every photo and explains reuse and ShareAlike.

## Shot list

The plan the research followed. What was actually chosen, and where the plan changed (no lounge or departure-board photo was looked for in the time and request budget; the KLIA tower is an aerial; Terminal 2 has one photo; KLIA Ekspres is the only rail photo), is in "Status".

About 30 photos, the best rather than the most. Heroes at least 2,400 px wide, cards at least 1,600 px, landscape. Saved at 2,560 px on the long edge (or the original if smaller), JPEG quality 80 (mozjpeg), sRGB, metadata stripped; the folder must stay under 14 MB (about 450 KB a photo; save cards at 1,920 px if needed, and record it).

| Group | Suggested id and file | Place | Subject | Use |
|---|---|---|---|---|
| klia | `klia-t1-canopy`, `klia/terminal-1-canopy` | kul | terminal | Home hero, KLIA hero: the main terminal's roof canopy over the departure hall, wide |
| klia | `klia-t1-departure-hall`, `klia/terminal-1-departure-hall` | kul | terminal | KLIA hero, discover |
| klia | `klia-t1-dusk`, `klia/terminal-1-dusk` | kul | terminal | Home hero candidate: the main terminal from outside at dusk |
| klia | `klia-satellite-forest`, `klia/satellite-rainforest` | kul | terminal | Discover: the rainforest garden in the satellite building |
| klia | `klia-satellite-concourse`, `klia/satellite-concourse` | kul | terminal | Section background |
| klia | `klia-tower`, `klia/control-tower` | kul | airside | Flights section background |
| klia2 | `klia2-concourse`, `klia2/concourse` | kul | terminal | KLIA Terminal 2 hero |
| klia2 | `klia2-exterior`, `klia2/exterior` | kul | terminal | Terminal 2 card |
| aircraft | `aircraft-malaysia-airlines`, `aircraft/malaysia-airlines-klia` | kul | aircraft | Flights hero |
| aircraft | `aircraft-airasia`, `aircraft/airasia-klia2` | kul | aircraft | Flights card |
| aircraft | `apron-dusk`, `aircraft/apron-dusk` | kul | airside | Section background |
| rail | `klia-ekspres`, `rail/klia-ekspres` | kul | rail | Getting there hero |
| penang | `pen-terminal`, `penang/airport-terminal` | pen | terminal | Penang hero, only if a good licensed photo exists |
| penang | `penang-bridge`, `penang/penang-bridge` | pen | destination | Destination card, Penang hero fallback |
| penang | `george-town`, `penang/george-town-shophouses` | pen | destination | Destination or discover card |
| sabah | `bki-terminal`, `sabah/kota-kinabalu-terminal` | bki | terminal | Kota Kinabalu hero, if one exists |
| sabah | `mount-kinabalu`, `sabah/mount-kinabalu` | bki | destination | Destination card, Kota Kinabalu hero fallback |
| langkawi | `lgk-terminal`, `langkawi/airport-terminal` | lgk | terminal | Langkawi hero, if one exists |
| langkawi | `langkawi-sky-bridge`, `langkawi/sky-bridge` | lgk | destination | Destination card |
| langkawi | `langkawi-beach`, `langkawi/pantai-cenang` | lgk | destination | Destination card, Langkawi hero fallback |
| kuching | `kch-terminal`, `kuching/airport-terminal` | kch | terminal | Kuching hero, if one exists |
| kuching | `kuching-waterfront`, `kuching/waterfront` | kch | destination | Destination card, Kuching hero fallback |
| kualaLumpur | `petronas-towers`, `kuala-lumpur/petronas-towers-dusk` | kul | destination | Home hero candidate, destination card |
| kualaLumpur | `kl-skyline`, `kuala-lumpur/skyline` | kul | destination | Destination card |
| food | `nasi-lemak`, `food/nasi-lemak` | my | food | Shops and food, discover |
| food | `satay`, `food/satay` | my | food | Discover |
| food | `roti-canai`, `food/roti-canai` | my | food | Discover |
| klia | `klia-lounge-or-retail`, `klia/lounge` | kul | interior | Only if a properly licensed photo exists with no identifiable people |
| travel | `wing-sunset`, `travel/wing-sunset` | my | atmosphere | `FALLBACK_HERO`: a wing at sunset, described as over Malaysia only if the file says so |
| travel | `departure-board`, `travel/departure-board` | my | atmosphere | Flight pages background |

Rules the tests enforce: an airport's hero list holds only photos whose `place` is that airport; `FALLBACK_HERO` has `place: 'my'` and is not a terminal or interior, so Subang, Ipoh, Tawau and the rest never show another airport's terminal under their name. Kuala Lumpur photos are tagged `kul` (the city KLIA serves), so they are never used for Subang.

Search queries (CirrusSearch, File namespace, `filetype:bitmap`, 40 results each with `extmetadata`): "Kuala Lumpur International Airport terminal interior", "KLIA main terminal building exterior", "KLIA satellite building", "KLIA satellite jungle boardwalk rainforest", "KLIA control tower", "klia2 terminal", "Malaysia Airlines Kuala Lumpur International Airport", "AirAsia klia2", "KLIA Ekspres train", "Penang International Airport", "Penang Bridge", "George Town Penang heritage", "Kota Kinabalu International Airport", "Mount Kinabalu", "Langkawi International Airport", "Langkawi Sky Bridge", "Langkawi beach", "Kuching International Airport", "Kuching waterfront", "Petronas Towers Kuala Lumpur skyline", "nasi lemak", "satay Malaysia", "roti canai", "airport lounge Malaysia", "airplane wing sunset Malaysia".

## How a photo is chosen

Look at every candidate at 1,280 px before choosing (contact sheets for the first pass, then each shortlisted photo on its own). Choose for:

- **The brief**: deep, rich colour and cinematic light (dusk, blue hour, sun through the canopy), clean composition with room for a headline, sharp at full size.
- **Truth**: it shows exactly the place the alt text names, as it is now. No composites, no heavy filters, no misleading crops (a crop that removes another airline's aircraft is fine; one that makes a terminal look like another is not).
- **People**: crowds at a distance are fine and make terminals feel alive; no close-ups of identifiable people.
- **No** watermarks, burned-in text, heavy noise, blown highlights or crooked verticals that a crop cannot fix.
- **Text over it**: a calm area (sky, roof, floor) where a headline and scrim can sit.

Record each rejection with its reason in the table below (file, reason), so the next pass does not look at it again. Typical reasons: licence (NC, ND, GFDL-only), too small, portrait, soft or noisy, watermark, identifiable people, outdated (old signage, closed areas), poor composition, misrepresents the place.

### Rejected

117 candidates were looked at (1,280 px previews, contact sheets of six, then the shortlist one by one); 30 were chosen. The rest, so the next pass does not look at them again (file names as on Commons):

| File | Reason |
|---|---|
| KLIA 05.jpg | Service road, signs and parked vehicles; poor composition |
| KLIA 06.jpg | Hazy; empty road in the foreground |
| KLIA 07.jpg, KLIA 08.jpg | Overcast and flat, half the frame is grass; the aircraft are small |
| KLIA Terminal 1 05112025 07.jpg, 08.jpg | Direction signs fill the frame |
| KLIA Terminal 1 05112025 10.jpg | Check-in hall dressed with ASEAN 2025 event banners (will date); crowded |
| KLIA, Malaysia, May 2024 (1).jpg, (2).jpg | Taken through glass (reflections); (2) is mostly sky |
| KLIA Interior, Malaysia, May 2024 (1).jpg | Retail clutter and "coming soon" hoardings |
| KLIA Interior, Malaysia, May 2024 (2).jpg | Corridor dominated by fashion advertising with a model's face |
| Kuala Lumpur International Airport Interior, Malaysia, May 2024 (1).jpg | Good but plainer than the chosen canopy; passengers in mid-distance |
| KLIA Jungle Boardwalk, May 2024.jpg | A luxury boutique and a poster face dominate the foreground |
| Rain Forest in KLIA.jpg | Watermark ("©ReneVel"); no-smoking sign in the foreground |
| Terminal 1 of Kuala Lumpur International Airport, January 2023.jpg | Plain corridor with one passenger in the centre |
| Interior of main terminal building, KLIA, 2023 (01).jpg | Busy retail; children recognisable |
| KL International Airport, 2026 (01).jpg | A large name sign fills the frame (burned-in text) |
| Inside KUL Airport Satellite Terminal, July 2014 (1).jpg | Dated (2014 shop fronts); busy |
| KLIA-2.jpg | Fisheye distortion; bank advertising |
| KLIA control tower 2 2016 October.jpg | Fisheye distortion |
| KLIA2 2016 October.jpg | Night view dominated by roads and cars; 2016 |
| KLIA2 Airport at night.jpg | Dark and noisy |
| KLIA2 at the early dawn 1.jpg | Motion blur |
| Kuala Lumpur International Airport 2 2023 01.jpg | Same view as the chosen 2023 05, without its aircraft |
| View Over KLIA2.jpg | Hazy, low-contrast aerial |
| KLIA2 international departure hall 2016 September 1.jpg | 2016; crowd with close, recognisable passengers |
| AirAsia X Airbus A330 9M-XXU Kuala Lumpur 2024 (01).jpg | Cargo clutter in the foreground; the A320neo night shot is stronger |
| Aerial photograph of Malaysia on 15 January 2026 - 01.jpg | Hazy; the airport is a thin strip |
| Aerial photograph of Malaysia on 15 January 2026 - 03.jpg | Same subject as 04, less clean |
| KLIA ERL Station platform (211128) 01.jpg | Recognisable passengers; pandemic-era signs |
| Airliners Kuala Lumpur 2025 (02).jpg, (14).jpg | Another airline's aircraft dominates |
| Airliners Kuala Lumpur 2025 (11).jpg | Apron clutter; (08) shows the terminal better |
| Malaysia Airlines Airbus A330 9M-MTH Kuala Lumpur 2024 (01).jpg | Near-duplicate of the chosen 9M-MTA, flatter light |
| Malaysia Airlines Boeing 737 9M-MLM Kuala Lumpur 2025 (04).jpg | Aircraft small in a busy frame |
| KLIA Ekspres Siemens Desiro @ Bangsar 20230710 (53332466670).jpg | Road, cars and viaduct dominate; the train is small |
| Klia express 1.jpg | Wide-angle distortion; platform clutter |
| Penang Airport 2023.jpg | Another airline's cargo aircraft is the subject |
| Penang International Airport 2023 01.jpg | The terminal is tiny under a hill |
| Penang International Airport 2023 03.jpg | Cargo sheds, not the passenger terminal |
| Penang International Airport at night.jpg | Traffic and street-light glare |
| Penang International Airport, George Town 2023.jpg | Overcast drone view over housing |
| Penang Bridge Mar2025.jpg, Penang Bridge 20250222.jpg | Hazy, low contrast |
| Penang Bridge and Penang Strait viewed from Light Promenade, Gelugor (261108).jpg | The bridge is a thin line; railing in the corner |
| Penang Bridge main span and Pulau Gazumbo from The Light Waterfront (261108).jpg | The bridge is small |
| 20111022 Sunrise - Penang Bridge.jpg | Heavy HDR processing (halos); 1,880 px |
| Penang Malaysia- House-in-Leith-Street-01.jpg | Business signs dominate |
| KotaKinabalu Sabah KKIA-01.jpg | Car park in the foreground |
| KotaKinabalu Sabah KKIA Terminal 2-01.jpg | The Terminal 2 building on an empty apron, not the main passenger terminal |
| KKIA Exterior, Malaysia, May 2024.jpg | Colour cast, washed out |
| KotaKinabalu Sabah KKIA-Runway-01.jpg | Dry grass; no terminal |
| Morning view of Mount Kinabalu in Malaysia, with its peak clearly visible.jpg | The file page names no author (attribution unclear) |
| Gunung Kinabalu Sabah.jpg, Kinabalu Sabah Borneo Kampong Kundasang 2.jpg | Good, but flatter light than the chosen sunset |
| Mount Kinabalu from Kundasang Town.jpg | Car park and market roofs in the foreground |
| Gunung Kinabalu bj.jpg | The summit is in cloud |
| Langkawi Malaysia Lankawi-International-Airport-04.jpg | Waiting passengers recognisable |
| Langkawi Malaysia Lankawi-International-Airport-05.jpg, 07.jpg, 08.jpg | Recognisable passengers and police at the baggage screening |
| MY-Langkawi-sky-bridge-2.jpg, MY-Langkawi-sky-bridge-3.jpg | Fog; railing across the foreground |
| Pantai Cenang 1.jpg | A large "Pantai Chenang" sign fills the frame |
| Pantai Cenang, Langkawi 01.jpg | Crowded beach with vehicles |
| Landscape of Pantai Chenang.jpg | Vehicles on the sand; soft |
| Kuching International Airport 2024 03.jpg | Parked cars in the foreground |
| Kuching International Airport 20250822.jpg | Cars across the bottom; tilted |
| Kuching International Airport Concourse (2-6-26).jpg | Dim; recognisable passengers |
| Kuching Waterfront at night (15834807985).jpg | Dark and noisy |
| Kuching - Sarawak River Sunset Cruise (17158529403).jpg | Soft; the assembly building photo is far stronger |
| Kuching Waterfront (15811151426).jpg | Cluttered rooftop view |
| Kuching, Sarawak, Malaysia 02.jpg | Faded film scan |
| Kuala Lumpur Malaysia Skyline-01.jpg | 2009: the skyline has changed (no Merdeka 118 or Exchange 106) |
| Kuala Lumpur Malaysia Petronas-Twin-Towers-01.jpg | Overcast; cranes |
| 2016 Kuala Lumpur, Kuala Lumpur City Centre (01).jpg | Construction cranes, grey sky |
| Kuala Lumpur Malaysia City-view-from-Imperial-Sheraton-Hotel-01.jpg | Cluttered; no landmark |
| 2016 Kuala Lumpur, Park KLCC, Fontanna na jeziorze Symphony (08).jpg | Cranes and construction |
| A quintessential Malaysian breakfast.jpg | Flash lighting, dull |
| Rendang Kerang bersama Nasi Lemak.jpg | Soft, cluttered |
| Satay in Melaka March 2023.jpg | A diner in the background; restaurant clutter |
| Satay Putera Kajang (220709).jpg | Shop front, not the food |
| Birdeye view flight from Kuching to KLIA (17591559888).jpg | Hazy; no subject |
| Birdeye view flight from Kuching to KLIA (17591819258).jpg, (17593340899).jpg | The wing fills the frame, or no wing at all |
| Birdeye view flight from Kuching to KLIA (17776765372).jpg | Glare through the window |
| Air Asia flight from Alor Setar to KLIA (6061146046).jpg | Overcast, 2011 |

All 87 rejected previews are covered above (some rows name more than one file). None was rejected for its licence: licences were read only for the shortlist (34 file pages, after the visual review), and all 34 carried an accepted licence; one of them, the Mount Kinabalu morning view, names no author and was dropped for that.

## Procedure

Throwaway scripts outside the repository (Node, `curl` so the session proxy applies, `sharp` from the project's `node_modules`). This is how the 22 to 23 November pass ran; the API-based steps written before it could not be used:

1. **Rate limiter**: at least one second between requests (6 s or more for thumbnails), a request counter on disk that counts every redirect hop, a hard stop at 500, on HTTP 429 or an error page a 60 s pause and a doubled gap (capped at 20 s), and a stop after four refusals in a row. User-Agent exactly as agreed (see "Access"). No cookies, no referrer, nothing about the people or the project.
2. **Find candidates** on ordinary wiki pages, not the API (it refuses this environment): category pages (`/wiki/Category:<name>`) list each file with its pixel size, so keep JPEG landscapes at least 1,600 px wide. Useful starting points: the airport categories and their "Interior of …", "Aircraft at …", "by year" and "Aerial photographs of …" subcategories, "Quality images of <state>", "Featured pictures of Malaysia", and the place and food categories ("Penang Bridge", "Remote views of Mount Kinabalu", "Cenang Beach", "Kuching Waterfront", "Nasi lemak", "Satay in Malaysia", "Desiro ET 425 M" for the KLIA Ekspres trains). Web search engines index Commons file pages poorly; they did not help.
3. **Previews**: the 1,280 px thumbnail from `https://thumb.wikimedia.org/wikipedia/commons/thumb/<a>/<ab>/<name>/1280px-<name>` (`<a>/<ab>` from the MD5 of the file name with underscores); contact sheets of six; then each shortlisted photo on its own, and 100 percent crops of the processed file to check sharpness.
4. **Licence and author** from each shortlisted file page (`/wiki/File:<name>`): the elements with class `licensetpl_short`, `licensetpl_link`, `licensetpl_attr` and `licensetpl_attr_req`, and the `fileinfotpl_aut`, `fileinfotpl_src` and `fileinfotpl_date` rows (the page writes the underscore in these names as `&#95;`; decode it first). Check the rules in "Licence rules"; look for deletion notices and personality-rights or trademark templates.
5. **Download the chosen files** from the same host at the 3,840 px bucket when the original is wider than 3,840 px, otherwise at the 1,920 px bucket (a 2,560 px request is refused with HTTP 400, and originals were refused). Then `sharp(file).rotate()`, optional `extract()` crop (fractions of the downloaded file, recorded in words), `resize({ width: <2560 for heroes, 1920 for cards>, height: same, fit: 'inside', withoutEnlargement: true })`, `toColorspace('srgb')`, the colour grade ("Colour grade"; since redesign 1c), `jpeg({ quality: 80, mozjpeg: true, progressive: true })` (lower for very detailed files to keep the folder under 14 MB). Metadata is dropped by default. Blur placeholder: the graded result resized to 16 px wide, JPEG quality 50, as a base64 data URL. Record `modified` as "resized and colour-graded" or "cropped, resized and colour-graded".
6. **Write `images.ts`** from the chosen list: id, file, group, place, subject, focal point, alt text in both languages, uses (home, destination, discover), `heroFor` airports and the fallback. Licence names are normalised to `ALLOWED_LICENCES` ("CC0" to "CC0 1.0", "CC BY-SA 4.0 international" to "CC BY-SA 4.0"); licence URLs use `https` and end in `/`; the author has markup removed. Update the STATUS line.
7. `npx vitest run src/content/images.test.ts`, then look at the credits page and every page that shows a photo, at 1,440 x 900 and 390 x 844, light and dark, English and Malay.

### Alt text

Say what and where, plainly, in a sentence: "The roof canopy over the departure hall of KLIA Terminal 1, Sepang", "Kanopi bumbung di atas dewan berlepas KLIA Terminal 1, Sepang". Name the airline only when its aircraft is the subject. The Malay is written for a Malay reader (natural word order and place names: Pulau Pinang, Lapangan Terbang Antarabangsa Kuching), not translated word for word, and like the rest of the Malay copy is a draft for a native-speaking editor.

## Replacing with Malaysia Airports photography

The ids are the contract: pages ask for `heroForAirport('pen')` or `imageFor('klia-t1-canopy')`, never for a file. To replace a photo:

1. Put the new file at the same path (or a new one) in `public/images/<group>/`, processed as in step 4.
2. Update its entry: `width`, `height`, `blurDataURL`, `focal`, alt text, and the credit.
3. For Malaysia Airports' own photos, add a licence value for them to `ALLOWED_LICENCES` (for example `'Malaysia Airports, all rights reserved'`), let `licenceUrl` point at the terms that cover it and `sourceUrl` at the media library or be optional, and adjust the two licence assertions in `images.test.ts` to accept it. The credits page then credits Malaysia Airports, and its "not Malaysia Airports' own photographs" note should be removed for those photos.
4. Run the tests. Nothing else changes: no page refers to a file name.

Photos for airports without one (Subang, Ipoh, Tawau and the rest) are added the same way, with `place` set to the airport and the airport added to `AIRPORT_HERO_IMAGES`.

## Notes for the team

- **Every page with a photo slot**: keep the no-photo state: a photo can be withdrawn, and the lists are typed to allow it.
- **Crop notes**: each cropped photo's `credit.crop` describes the crop in English; the credits page shows only "Cropped, resized, colour-graded and compressed" (enough for the licences). Showing the description would need a Malay version.
- **A new or replaced photograph** goes through the same grade, so the set stays one look; check the text over it with the pixel contrast script and tune its `HERO_FRAMING` entry if it is an airport hero.
- **Unused photo**: `aircraft-terminal-1` is in the library (and credited) but in no list.
- **Platform**: AVIF is on (`images.formats` in `next.config.ts`); every `quality` an `<Image>` uses must be in `images.qualities` (60, 65, 75).
- **Before a public launch** (verification SA5 item 7): compare the Langkawi departures entrance (2014) and the Kota Kinabalu terminal front (2015) with the airports today, and tell the client these are Wikimedia Commons photographs under CC licences, credited on `/credits`, until Malaysia Airports' own photography replaces them.
