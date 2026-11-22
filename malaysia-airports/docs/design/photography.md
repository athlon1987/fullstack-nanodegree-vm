# Photography

The photo library for the visual redesign: what it should contain, the licence rules, how the photos are chosen and processed, and how to replace them with Malaysia Airports' own photography later.

Code: `src/content/images.ts` (the library and its helpers), `src/content/images.test.ts` (the checks), `public/images/` (the files), `/[lang]/credits` (`src/app/[lang]/credits/page.tsx`, copy in `src/lib/i18n/features/credits.ts`).

## Status: the library is empty (22 November 2026)

**No photograph has been chosen, because Wikimedia refused the research requests.** Nothing in the library is a placeholder or a guess: `IMAGES` is empty, every lookup returns `undefined` or an empty list, and the credits page says that the site shows no photographs yet.

What happened, between 13:05 and 13:38 UTC:

| | |
|---|---|
| Requests sent | 22 of the 400 allowed (1 site-info check, 18 API searches, 2 diagnostic searches, 1 thumbnail) |
| Answered | 2: the site-info check and one plain title search (3 titles, no licence data) |
| Refused with HTTP 429 | 20, including one sent after 10 minutes with no traffic at all |
| API refusal (`commons.wikimedia.org/w/api.php`, Envoy) | "You are making too many requests to the API", `retry-after: 5`, although our requests were 60 s or more apart |
| File refusal (`upload.wikimedia.org`, Varnish) | "Your request does not comply with our robot policy, https://w.wiki/4wJS" |
| Downloaded | Nothing. No candidate was seen, so there is no selection and no rejected list |

**Cause** (inferred from the two refusal messages; Wikimedia's policy pages could not be fetched from this environment). Wikimedia's User-Agent policy asks automated clients to put contact information (an email address or a URL) in the User-Agent, and appears to enforce it strictly for traffic from shared cloud addresses, which is where this prototype is built. The agreed User-Agent, `ConceptPrototypeImageResearch/1.0 (one-off research script; low volume)`, carries no contact details on purpose (no personal or project details may be sent), so Wikimedia classes the requests as non-compliant robot traffic and throttles them with everything else from that address. Waiting does not help: the throttle is shared, not caused by our own volume.

**What was not done**, because each would break a rule: changing the User-Agent, adding a contact address, using a Wikimedia account, using other image sources or mirrors, scraping the HTML pages, or adding stand-in images.

### Decision needed (any one unblocks the work)

1. **Allow a compliant User-Agent**: the owner chooses a contact for it (a role mailbox or a project URL) and allows it to be sent. Then rerun the procedure below unchanged: about 25 searches, 120 thumbnails and 32 originals, roughly 180 requests and 30 to 60 minutes at one request per second.
2. **Run the procedure from another network** (for example a developer's own connection). It may still be throttled without a contact address; option 1 is the reliable one.
3. **Supply the photographs another way**: Malaysia Airports' media library or licensed stock, through "Replacing with Malaysia Airports photography" below. This is the end state anyway.
4. **A Wikimedia API token** (authenticated requests have their own limits). It identifies a personal account, so only the owner can decide this.

### What is ready now

- `src/content/images.ts`: the typed library (`SiteImage`, `ImageId`, `ALLOWED_LICENCES`, `IMAGE_GROUPS`), `imageFor`, `heroForAirport`, `objectPosition`, `imagesByGroup`, and the ordered lists `HOME_HERO_IMAGES`, `DESTINATION_IMAGES`, `DISCOVER_IMAGES`, `AIRPORT_HERO_IMAGES`, `FALLBACK_HERO`. Empty, typed so that no page can name a photo that does not exist (`ImageId` is `never` until entries are added).
- `src/content/images.test.ts`: every check below, run on every entry. The "at least 24 photos and every use covered" test is skipped while the library is empty, and shows as skipped. The pipeline and the tests were exercised end to end with two synthetic gradient images (downloaded nothing; removed afterwards): files, sizes, licence normalisation, markup stripped from the author, crop notes, blur placeholders, and the credits page in both languages and both themes.
- `/[lang]/credits` in English and Malay, in the sitemap automatically (`src/lib/seo/site-routes.ts` lists every static page folder). Fully static: no clock, no random values, no Suspense; one `h1`.

## Contract for pages that show photos

- **Every lookup can be empty.** `heroForAirport()` returns `SiteImage | undefined`; the lists can be empty. Each photo slot needs a designed treatment without a photo (a deep solid or gradient panel of the same size), which is also what pages show today.
- **Reserve the space**: pass `width` and `height`, or use `fill` inside a box with a fixed aspect ratio. Never let a photo change the layout when it loads.
- **Text over a photo** must reach 4.5:1 against the darkest and the lightest part it can cover: use a scrim (a gradient from `rgb(0 0 0 / 0.65)`) or a solid or glass panel behind the text. Check it at both breakpoints, because `object-fit: cover` crops differently.
- **Crop with the focal point**: `style={{ objectPosition: objectPosition(image) }}`.
- **Alt text**: `image.alt[lang]`. Use `alt=""` only where the same words are visible next to the photo (as on the credits page) or the photo is purely decorative behind a heading that says the same.
- **Loading**: the largest above-the-fold photo gets `preload` (Next 16 replaces `priority`), everything else stays lazy. Give `sizes` that match the layout.
- **Motion**: no Ken Burns pans or zooms unless they stop under `prefers-reduced-motion` and the site's own motion setting.
- **Import from Server Components** and pass the one `SiteImage` to a Client Component as a prop: the blur placeholders make the module about 1 KB per photo.
- AVIF: `next/image` serves WebP only by default. `images: { formats: ['image/avif', 'image/webp'] }` in `next.config.ts` (platform owner) adds AVIF; the default quality allowlist is `[75]`.

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

None yet: no candidate could be seen (see Status).

| File | Reason |
|---|---|
| | |

## Procedure

Throwaway scripts outside the repository (Node, `curl` so the session proxy applies, `sharp` from the project's `node_modules`):

1. **Rate limiter**: one request per second at most, a request counter on disk with a hard stop at 400, on HTTP 429 or a "too many requests" page wait 60 s and lengthen the gap (capped at 20 s), and give up after a few refusals. User-Agent exactly as agreed. No cookies, no referrer, nothing about the people or the project.
2. **Search**: per query, `action=query&generator=search&gsrnamespace=6&gsrsearch=<query> filetype:bitmap&gsrlimit=40&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiextmetadatafilter=LicenseShortName|LicenseUrl|Artist|Credit|UsageTerms|DateTimeOriginal|ImageDescription|AttributionRequired|Restrictions|Copyrighted&iiextmetadatalanguage=en`. Keep JPEGs at least 1,600 px wide with an accepted licence; cache each result so a rerun costs nothing.
3. **Thumbnails**: 1,280 px (`/thumb/<a>/<ab>/<name>/1280px-<name>`, a standard Wikimedia size) for the candidates worth a look; contact sheets of six; then each shortlisted photo on its own.
4. **Originals** for the chosen photos only, then `sharp(file).rotate()`, optional `extract()` crop (fractions of the original, recorded in words), `resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })`, `toColorspace('srgb')`, `jpeg({ quality: 80, mozjpeg: true, progressive: true })`. Metadata is dropped by default. Blur placeholder: the result resized to 16 px wide, JPEG quality 50, as a base64 data URL.
5. **Write `images.ts`** from the chosen list: id, file, group, place, subject, focal point, alt text in both languages, uses (home, destination, discover), `heroFor` airports and the fallback. Licence names are normalised to `ALLOWED_LICENCES` ("CC0" to "CC0 1.0", "CC BY-SA 4.0 international" to "CC BY-SA 4.0"); licence URLs use `https` and end in `/`; the author has markup removed. Update the STATUS line.
6. `npx vitest run src/content/images.test.ts`, then look at the credits page and every page that shows a photo, at 1,440 x 900 and 390 x 844, light and dark, English and Malay.

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

- **Shell (footer)**: add a "Photo credits" link to `/credits` in the footer's "Transparency and legal" column once the library has photos (`IMAGE_COUNT > 0` from `@/content/images`); until then the page only says there are none. The `creditsPages` namespace is server-only (`SCOPED_NAMESPACES`), so a Client Component footer needs its own label key (for example `footer.photoCredits`: "Photo credits" / "Kredit foto") or the label passed from a Server Component.
- **Every page with a photo slot**: design the no-photo state first; it is what ships until the library is filled.
- **Platform**: AVIF needs `images.formats` in `next.config.ts` (see above).
- **Shared files changed** (one line each, to register the copy namespace): `src/lib/i18n/en.ts` and `src/lib/i18n/ms.ts` (import and `creditsPages` entry), `src/lib/i18n/index.ts` (`'creditsPages'` added to `SCOPED_NAMESPACES`), `src/lib/i18n/i18n.test.ts` (`creditsPages: []` in the map of places allowed to read scoped namespaces, which its type requires).
