# Benchmark: Amsterdam Airport Schiphol (www.schiphol.nl)

- Assessed: 2026-11-16
- Assessment type: expert assessment (desk research). Not an instrumented test, not a usability study.
- Client focus for this benchmark: flight-centric journey assistance and wayfinding (flight-specific journey page, security wait times and time-slot booking, Schiphol app, parking booking, Privium, public Flight API / developer portal).

Evidence tags used on every claim:
`[direct]` observed on the official host in this run (only the bot-challenge interstitial was reachable, see "Evidence access");
`[search]` stated in a search result or search summary obtained in this run (URL cited);
`[prior]` researcher background knowledge, NOT re-confirmed in this run, lower confidence, approximate as-of date given;
`[hypothesis]` inference that needs usability testing or technical access to confirm.

## Summary

Schiphol is the reference case for a flight-centric airport website. Almost every passenger task hangs off one object, the flight: each flight number (codeshares included) has its own clean, indexable page (`/en/departures/MS758/`), the app turns the flight into a personal itinerary with walking time to the gate, security waiting time and boarding alerts, and passengers can book a free 15-minute security time slot up to three days ahead. Around that core sit paid convenience products sold online (parking with dynamic pricing, the Privium membership at EUR 190-370 a year) and an open developer portal with a public Flight API (OpenAPI 3.0, v4.2.0).

The weak spots are just as clear and are where MAHB can leapfrog: the website is published in Dutch and English only; ground transport defers to external planners (NS, 9292) rather than giving a door-to-gate plan; the richest wayfinding (blue dot, itinerary walking times) is app-first; AI and account-based personalisation are thin (an AI chatbot exists but is not a marketed product); commerce is fragmented; and content hygiene is uneven (2020-2023 blog pages and superseded Privium prices still rank).

Weighted expert score: 4.075 / 5 (81.5%). Confidence is medium at best because no page was observed directly.

## Evidence access (direct or search-only)

- **Search-only for site content. Direct access to content did not work.** First attempt (start of run): `curl https://www.schiphol.nl/en/` returned `CONNECT tunnel failed, response 403` from the container proxy (host not yet on the allowlist). Second attempt (end of run): the host was reachable but the site answered with a bot challenge instead of content; see the last line of this section.
- Other primary hosts tried once each with WebFetch and blocked (`getaddrinfo ENOTFOUND`): `apps.apple.com`, `play.google.com`, `developer.schiphol.nl`, `news.schiphol.com`.
- WebSearch: 18 searches completed. A further 6 planned searches (cyber-incident date, chatbot statement detail, Schiphol account, accessibility statement, official parking page, Wayfinding API) were refused because the shared search budget for the session was exhausted. Those topics are marked as gaps below.
- No homepage or flight-page screenshots and no site navigation timings were captured (they were conditional on direct access to content). The only image saved is the challenge interstitial: `docs/research/screenshots/schiphol-cloudflare-challenge-desktop.png` (script: `docs/research/screenshots/schiphol-capture.cjs`).
- Consequence: no site content in this file is `[direct]`. Homepage composition and navigation labels in particular rest on `[prior]` knowledge and must be re-verified before being quoted to the client.
- Final direct attempt (end of run, 2026-11-16): `[direct]` `curl https://www.schiphol.nl/en/` now connected and received HTTP 403 with a 158 KB body. One Playwright run (headless Chromium, 1440x900, default settings) received the same HTTP 403: a Cloudflare managed challenge, page title "Just a moment...", visible text "One moment please. We are checking that your connection to Schiphol.nl is secure." The challenge could not complete because `challenges.cloudflare.com` is not reachable from this container (`net::ERR_TUNNEL_CONNECTION_FAILED`). The run was stopped after that single navigation: no retries and no attempt to get around the bot protection. The mobile viewport and the flight page were therefore not attempted.
- To get direct evidence in a later run, `challenges.cloudflare.com` would need to be allowed as well, and even then a headless browser may not pass the challenge; a manual capture from a normal browser is the reliable route.

## 1. Homepage above-the-fold composition

- `[prior, as of ~mid-2025, low confidence]` The homepage leads with a flight search field (flight number, destination or airline) with a Departures / Arrivals / Transfers switch, so the first action offered is "find my flight". Operational alert banners appear above it during disruption. Quick links to parking, travel to and from the airport and the airport map sit directly below. Not re-confirmed in this run.
- `[search]` The site runs a service-message channel under `/en/messages/` for disruptions (examples: public transport timetable changes, a cyber-threat notice). https://www.schiphol.nl/en/messages/travelling-to-or-from-schiphol-take-adjusted-timetables-into-account/ , https://www.schiphol.nl/en/messages/schiphol-responds-to-global-cyber-threat/
- `[search]` A "my travel day" entry point tells the passenger how busy the day is expected to be at security and passport control, by day, time and departure or arrival hall. Snapshot text: "today is a busy day. We expect you will have to wait a while at security and passport control" (indexed snapshot roughly 6 months old, not live data). https://www.schiphol.nl/en/my-travel-day/today/departures/
- `[hypothesis]` A passenger with a flight number can reach live status, gate and the time-slot offer in one search plus one click. Needs a task-timing test.

## 2. Information architecture

- `[search]` Top-level passenger sections visible in URL structure: `/en/departures/`, `/en/arrivals/`, `/en/transfers/`, `/en/my-travel-day/`, `/en/timeslots/`, `/en/prepare-for-your-flight-at-schiphol/`, `/en/from-to-schiphol/`, `/en/at-schiphol/`, `/en/privium/`, `/en/assistance/`, `/en/the-schiphol-app/`, `/en/contact-schiphol/`, `/en/blog/`, `/en/messages/`. Sources: URLs returned across the searches, e.g. https://www.schiphol.nl/en/transfers/ , https://www.schiphol.nl/en/from-to-schiphol/ , https://www.schiphol.nl/en/assistance/ , https://www.schiphol.nl/en/contact-schiphol/
- `[search]` Non-passenger audiences live on the same host under separate sections: `/en/schiphol-as-a-neighbour/`, `/en/sustainability/`, `/en/innovation/`, `/en/aviation-solutions/`, `/en/aviation-partnerships/`, `/en/developer-center/`, `/en/privacy-and-cookies/`. Example: https://www.schiphol.nl/en/schiphol-as-a-neighbour/look-ahead-at-air-traffic/ . Corporate news sits on a separate host, https://news.schiphol.com/ .
- `[search]` Language is a path prefix: `/en/` and `/nl/` (e.g. https://www.schiphol.nl/nl/van-naar-schiphol/ ). No other language prefix appeared in any result.
- `[prior, as of ~mid-2025, low confidence]` Primary navigation labels were approximately: Flights (Departures, Arrivals, Transfers), Parking, To and from Schiphol, At Schiphol, Privium, More; utilities: site search, NL/EN switch, account login. Exact labels not re-confirmed.
- `[hypothesis]` Footer content and the account utility could not be evidenced in this run (search budget exhausted before the account query ran).

## 3. Flight information

- `[search]` Every flight has its own indexable detail page with a clean URL keyed on flight number and direction, titled in plain language: "Flight MS 758 from Amsterdam (AMS) to Cairo", "Flight AY 1305 from Helsinki (HEL) to Amsterdam". https://www.schiphol.nl/en/departures/MS758/ , https://www.schiphol.nl/en/arrivals/AY1305/
- `[search]` Codeshare flight numbers get their own pages as well (e.g. KL 6033 Amsterdam-Seattle, ET 1217 Amsterdam-Vienna), so a passenger searching the number on their ticket lands on the right page. https://www.schiphol.nl/en/departures/KL6033/ , https://www.schiphol.nl/en/departures/ET1217/
- `[search]` Older URL schemes carried a date-coded id (`/en/departures/flight/D20230910KL0655/`, 2023; `/en/transfers/departures/flight/D20250329KL0973/`, 2025). https://www.schiphol.nl/en/departures/flight/D20230910KL0655/ , https://www.schiphol.nl/en/transfers/departures/flight/D20250329KL0973/
- `[hypothesis]` The change from date-coded ids to clean flight-number URLs suggests a re-platform of the flight pages between early 2025 and 2026. Not confirmed by any announcement found.
- `[search]` Transfers have their own flight-lookup flow with arrival and departure flight pages under `/en/transfers/`. https://www.schiphol.nl/en/transfers/arrivals/flight/A20250219DY1258/
- `[search]` Notifications: flight updates by push notification or text message for a delay or gate change; app alerts when it is time to go to the gate and when boarding has started. https://www.schiphol.nl/en/blog/when-do-i-need-to-be-where-at-schiphol/ (blog dated in the 2020-2023 range)
- `[search]` The app page states it tracks all departing and arriving flights, sends gate-change and delay updates, and can open a flight in several flight-tracking apps with one tap. https://www.schiphol.nl/en/the-schiphol-app/
- `[search]` The search engine's cached flight pages showed inconsistent dates and times across entries, which is a reminder that per-flight pages are reused daily and cached copies go stale; no freshness-indicator text was captured. Source: search summary for https://www.schiphol.nl/en/arrivals/KL686/ and peers.
- `[prior, as of ~2024-2025, medium confidence]` Search accepts flight number, destination/origin city and airline. List rows show scheduled time, revised time, destination, flight number, gate or departure hall and a status label (for departures e.g. Gate open, Boarding, Gate closing, Departed, Delayed, Cancelled); detail pages add check-in desk rows and, for arrivals, baggage belt and arrivals hall.
- `[prior, as of ~2024, medium confidence]` The Public Flight API v4 flight object exposes, among others: `lastUpdatedAt`, `publicFlightState`, `scheduleDateTime`, `estimatedLandingTime`, `actualLandingTime`, `publicEstimatedOffBlockTime`, `actualOffBlockTime`, `expectedTimeGateOpen`, `expectedTimeBoarding`, `expectedTimeGateClosing`, `expectedTimeOnBelt`, `gate`, `pier`, `terminal`, `checkinAllocations`, `baggageClaim.belts`, `codeshares`, `route` (with EU/visa flags), `aircraftType`. A `lastUpdatedAt` field means a data-freshness stamp is technically available to the front end.
- Gap: bookmarking/"save flight" on the website (as opposed to the app) could not be evidenced.

## 4. Journey assistance and personalisation

- `[search]` Security time slots: a booking reserves a guaranteed 15-minute window with a dedicated queue; booking opens 3 days before the flight; one booking covers the passenger and everyone travelling with them; it is free; a confirmation email carries a QR code; at the airport the passenger follows the yellow signs and looks for the "Reserved for timeslots" lane, where a Schiphol employee scans the QR code. https://www.schiphol.nl/en/timeslots/ , https://www.schiphol.nl/en/blog/choose-your-own-time-slot-for-security/
- `[search]` Arriving later than the chosen slot means access is not guaranteed. https://www.klm.com/information/airport/security-timeslot (airline source)
- `[search]` The time-slot page also carries a "how busy" section and warns of waits at security and passport control on busy days. https://www.schiphol.nl/en/timeslots/
- `[search]` Personal itinerary in the app: walking time to the gate, exact gate location on the map, boarding start time and current waiting time at the security filter. https://www.schiphol.nl/en/blog/when-do-i-need-to-be-where-at-schiphol/ , https://www.schiphol.nl/en/blog/how-far-in-advance-do-i-need-to-be-at-schiphol/
- `[search]` Arrivals: on schiphol.nl and in the app, entering a flight number (or scanning a boarding pass) gives "an up-to-date and reliable prediction of your walking time, from the moment you land until the moment you leave Schiphol". https://www.schiphol.nl/en/blog/find-out-how-long-it-will-take-to-get-outside/
- `[search]` Conflict noted: boarding-pass scanning is described for Schiphol's Passenger Experience Platform (kiosks or mobile) and for the arrivals walking-time feature, but the consumer app pages mostly describe lookup by flight number. Whether the current consumer app scans boarding passes is unconfirmed. https://www.schiphol.nl/en/aviation-solutions/page/pxp-discover-all-possibilities/ , https://www.schiphol.nl/en/aviation-solutions/travor-case-studies/amsterdam-airport-schiphol/
- `[search]` Schiphol packages this journey platform as a product for other airports ("Passenger Experience Platform", personalised timeline after scanning a boarding pass). https://www.schiphol.nl/en/aviation-solutions/page/pxp-discover-all-possibilities/ , https://www.schiphol.nl/en/aviation-solutions/blog/increase-csat-scores-and-drive-airport-revenue/
- `[search]` Innovation blog describes the concept as "your personal travel assistant". https://www.schiphol.nl/en/innovation/blog/your-personal-travel-assistant/
- `[search]` Weekly air-traffic outlook is published openly: for 9-15 November 2026 an average of 1,235 daily flights and 11 peak moments per day (take-off peaks such as 07:00-07:40, 09:20-10:40, 16:20-17:40). https://www.schiphol.nl/en/schiphol-as-a-neighbour/look-ahead-at-air-traffic/ (data for week of 2026-11-09)
- Gap: accounts, saved trips and recommendation features on the website were not evidenced (search refused; budget exhausted). `[hypothesis]` Personalisation is flight-keyed and session/app-based rather than account-based.

## 5. Maps and wayfinding

- `[search]` An interactive map is available on the website and in the app and can be used before travel; it shows check-in and transfer desks, currency exchange and the toilets nearest a gate. https://www.schiphol.nl/en/blog/find-your-way-quickly-and-easily-at-schiphol/
- `[search]` Inside the terminal the app map shows the user's position and nearby facilities; search finds e.g. Privium Lounges, lost and found, coffee. Information zones with interactive displays serve passengers without a phone. https://www.schiphol.nl/en/blog/find-your-way-quickly-and-easily-at-schiphol/
- `[search]` Walking time to the gate is shown in the personal itinerary (app). https://www.schiphol.nl/en/blog/when-do-i-need-to-be-where-at-schiphol/
- `[search]` Scale context: one terminal with seven piers (B to M), about 650,000 m2. https://www.schiphol.nl/en/blog/schiphol-is-big-but-just-how-big-exactly/
- `[search]` A developer-center article on a Wayfinding API exists ("our wayfinding API explored"); content not retrieved. https://www.schiphol.nl/en/developer-center/our-wayfinding-api-explored/
- `[search]` Schiphol holds gate-to-gate walking-time data and uses it for transfer-risk monitoring ("Wilbur", "hot pax"), but no public pier-to-pier walking-time table was found. https://www.schiphol.nl/en/innovation/blog/wilbur-data-on-passenger-flows-and-hot-pax/
- `[search, low reliability]` Third-party guides claim step-by-step indoor navigation in the app. https://airport.online/amsterdam-schiphol/en/schiphol-airport-ams-terminal-navigation (aggregator/blog)
- Gap: no evidence found of AR wayfinding or of an accessible (step-free) routing option. `[hypothesis]` Neither exists on the public web map.

## 6. Ground transport planner and parking

- `[search]` Train: 24/7 services from Amsterdam, Utrecht, Leiden, The Hague, Delft and Rotterdam, often direct; the station is beneath the terminal; the site refers users to the NS Travel Planner for live times. https://www.schiphol.nl/en/from-to-schiphol/by-public-transport/train/
- `[search]` Bus: stops directly in front of Schiphol Plaza; departure times via 9292.nl; lines 397 and N97 to Amsterdam. https://www.schiphol.nl/en/from-to-schiphol/by-public-transport/bus/
- `[search]` Taxi: official rank in front of Schiphol Plaza; no reservation needed. https://www.schiphol.nl/en/from-to-schiphol/taxi/
- `[search]` Conclusion from the above: there is no Schiphol-owned multimodal planner; planning is handed off to NS and 9292. https://www.schiphol.nl/en/from-to-schiphol/
- `[search]` Parking is bookable online and in the app; the most recent Google Play release note mentions a revised parking booking flow. https://play.google.com/store/apps/details?id=org.schiphol (undated listing snapshot)
- `[search]` Parking prices are dynamic and booking early (especially P3 long stay) is cheaper, per flyschiphol.com, which the search summary labelled official; this researcher could not verify that the domain is operated by Schiphol, so treat as unverified. https://flyschiphol.com/parking
- `[search, aggregators, prices unverified and conflicting]` P1 is a 2-6 minute walk from the terminal; drive-up P1 quoted at about EUR 57.50 per 24 h in one 2026 guide; another site quotes EUR 115 for 2 days at P1 and EUR 95-105 at P3; valet quoted at EUR 66.50 for 1 day elsewhere. https://amsterdamairportto.city/schiphol-airport-parking/ , https://airmundo.com/en/amsterdam-airport-schiphol/parking/ , https://thevaletguys.nl/en/rates-for-parking-at-schiphol/ . Do not quote these as Schiphol tariffs.
- `[prior, as of ~2025, medium confidence]` Official parking products are P1 short-stay, P3 long-stay, Valet and premium/Excellence parking, compared side by side after entering entry and exit date and time on www.schiphol.nl/en/parking/.
- Gap: live space availability on the web could not be evidenced.

## 7. Shopping, dining, e-commerce, lounges, loyalty

- `[search]` Privium (paid membership) 2026 prices on the registration page: Basic EUR 190, Extra EUR 235, Plus EUR 370 per year incl. VAT; Plus Trial EUR 95 for three months. https://www.schiphol.nl/en/privium/register/?membershipChoice=priviumPlus
- `[search]` Conflict: an older official page and several travel sites still show EUR 180 (Basic) and EUR 305 (Plus). Most recent official source (registration page) preferred. https://www.schiphol.nl/en/privium/kieslidmaatschap/
- `[search]` Privium eligibility: EEA and Swiss nationals; UK passports cannot join. Plus tier includes Privium lounges, ClubLounge South (Lounge 1, near B and C gates, Schengen flights) and business-class check-in. https://www.schiphol.nl/en/privium/nextleveltravel/ , https://www.amsterdamtips.com/schiphol-airport-lounges (third-party)
- `[search]` Trade press reports Schiphol opened its largest Privium lounge (date not captured). https://www.businesstravelnewseurope.com/Air-Travel/Amsterdam-Schiphol-unveils-largest-Privium-lounge
- `[prior, as of ~2025]` Privium's core benefit is automated border passage by iris scan plus priority security access.
- `[search]` Lounge walk-in pricing from third-party sites conflicts: EUR 60 voucher for non-members vs EUR 45 for Privium members on one site; EUR 45-65 on another. https://www.amsterdamtourism.org/schiphol-lounges/ (blog)
- `[search]` Click and Collect launched as a pilot in 2021 with Schiphol Airport Retail and Kappe: order online up to two hours before departure, pay on collection, pick up in Lounges 1, 2 and 3; limited range (perfume, cosmetics, sunglasses, alcohol, chocolate). https://www.futuretravelexperience.com/2021/06/schiphol-airport-launches-click-collect-pre-order-service/ , https://moodiedavittreport.com/amsterdam-airport-schiphol-launches-pilot-click-collect-scheme/ , https://news.schiphol.com/passengers-can-now-shop-at-schiphol-from-home-or-on-your-way-to-the-airport/
- `[search]` No confirmation was found that the 2021 pilot still runs; current pre-order references point to third-party duty-free sites. https://amsterdam-schiphol.mydutyfree.net/ (third party)
- Gap: paid fast-track for non-members, food pre-order and a points-based loyalty programme were not evidenced. `[hypothesis]` Schiphol's "loyalty" is the Privium subscription rather than a points scheme.

## 8. Transit and connection guidance

- `[search]` Dedicated transfers section and guide; boarding pass normally issued at first check-in, otherwise at the airline's transfer desk; KLM and partner passengers can use self-service units. https://www.schiphol.nl/en/transfers/ , https://www.schiphol.nl/en/blog/all-about-your-transfer-at-schiphol/
- `[search]` Transfer desk locations: SkyTeam at T2, T4, T5, T6 or at the gate; others at T3, T5 or T9; KLM self-service at T2, T4, T6 and T9 open round the clock. Desks can reissue boarding passes, change flights and rebook after missed or cancelled flights. https://www.schiphol.nl/en/at-schiphol/services/transferdesk/
- `[search]` Stated transfer-time guidance: under an hour, or under 40 minutes for European flights (as summarised from the official blog). https://www.schiphol.nl/en/blog/all-about-your-transfer-at-schiphol/
- `[search]` Short Connection Pass available at two piers where many connecting passengers arrive. https://www.schiphol.nl/en/innovation/blog/short-connection-pass/
- `[search]` Assisted transfers need more than 1.5 hours. https://www.schiphol.nl/en/assistance/with-transfers-at-schiphol/
- `[search]` Several of these pages are 1.5 to 3 years old; no pier-to-pier walking times are published on them.

## 9. Accessibility and special assistance

- `[search]` Dedicated assistance hub with sub-pages for hidden disabilities, deaf and blind travellers, wheelchair users, transfers and an FAQ. https://www.schiphol.nl/en/assistance/ , https://www.schiphol.nl/en/assistance/flying-with-a-hidden-disability/ , https://www.schiphol.nl/en/assistance/flying-for-the-deaf-and-blind/ , https://www.schiphol.nl/en/page/flying-with-a-wheelchair/ , https://www.schiphol.nl/en/assistance/frequently-asked-questions/
- `[search]` Sunflower lanyard supported: can be ordered in advance or collected at the assistance desk; it signals a need for patience but gives no priority; travellers needing guidance must request PRM assistance at least 48 hours before departure via the airline. https://www.schiphol.nl/en/blog/travelling-with-a-hidden-disability/ , https://www.schiphol.nl/en/blog/what-services-can-travellers-with-a-disability-expect-at-schiphol/
- `[search]` Independent travellers can borrow a wheelchair free of charge and can be driven to the aircraft by caddy. https://www.schiphol.nl/en/blog/what-services-can-travellers-with-a-disability-expect-at-schiphol/
- `[search]` Contact page lists a text-based service for deaf or hard-of-hearing callers, offered in Dutch only. https://www.schiphol.nl/en/contact-schiphol/
- Gap: no accessibility statement or WCAG conformance claim for the website was found (first search did not surface one; the follow-up search was refused). `[hypothesis]` Site-level accessibility quality is unknown and needs an audit.

## 10. AI assistant, chatbot, messaging

- `[search]` Customer contact centre is available 24/7 by phone, WhatsApp, chat and email. https://www.schiphol.nl/en/contact-schiphol/
- `[search]` Social and messaging channels named by Schiphol: WhatsApp, Facebook Messenger, Twitter/X, Instagram. https://news.schiphol.com/schiphol-improving-information-provision-to-passengers/ (older press item, date not captured)
- `[search]` 2018-era announcement: 24-hour WhatsApp and chat staffed by Schiphol employees plus 16 self-service points in the terminals. https://news.schiphol.com/schiphol-revamping-information-provision-in-the-terminal/
- `[search]` Schiphol publishes a "Schiphol chatbot privacy statement" that explains how it uses AI in its chatbot and how chat data is handled, which confirms a deployed AI chatbot. https://www.schiphol.nl/en/privacy-and-cookies/schiphol-chatbot-privacy-statement/ , https://www.schiphol.nl/nl/privacy-en-cookies/privacystatement-chatbot/
- `[search]` Circa 2023, Schiphol's digital team said it would explore ChatGPT-style tools for faster answers and WhatsApp flight notifications. https://www.passengerterminaltoday.com/features/feature-how-will-ai-transform-the-passenger-experience-at-airports.html
- `[search]` Operational AI example: a model predicting when baggage appears on the belt. https://www.data-expo.nl/en/visitors/program/hoe-schiphol-ai-in-zet-om-de-passagiersbeleving-te-verhogen
- Gap: chatbot name, capabilities, languages and launch date were not found. No 2025-2026 launch announcement for a generative-AI passenger assistant was found.

## 11. Languages, mobile web and app

- `[search]` Website languages evidenced: English (`/en/`) and Dutch (`/nl/`) only. https://www.schiphol.nl/nl/van-naar-schiphol/ , https://www.schiphol.nl/en/from-to-schiphol/
- `[prior, as of ~2025, medium confidence]` The public site has been Dutch/English only for years.
- `[search]` App: "Schiphol" / "Schiphol Amsterdam Airport" (Android package `org.schiphol`; App Store id 409161665). https://play.google.com/store/apps/details?id=org.schiphol , https://apps.apple.com/bf/app/schiphol-amsterdam-airport/id409161665
- `[search]` Google Play: 4.7 stars from 46.7K reviews and 1M+ downloads in the latest snapshot; other cached snapshots show 4.9 (42K) and 4.8 (43.2K). Snapshots are undated; treat as "4.7-4.9, about 42-47K reviews". https://play.google.com/store/apps/details?id=org.schiphol
- `[search, aggregator]` AppBrain: 4.87 from about 42K ratings. https://www.appbrain.com/app/schiphol-amsterdam-airport/org.schiphol
- `[search]` App Store release notes: version 12.0.0 (13 Oct 2025) was a visual overhaul and added widgets with real-time flight updates on the home screen, lock screen and Apple Watch; 12.0.1 (14 Oct 2025) and 12.0.2 (16 Oct 2025) were fixes. https://apps.apple.com/es/app/schiphol-amsterdam-airport/id409161665?l=en-GB&platform=watch
- `[search]` User criticism in reviews: queue-time estimates "can sometimes be a little inaccurate"; app fails verification on GrapheneOS. https://play.google.com/store/apps/details?id=org.schiphol
- Gap: App Store star rating not found; app language list not found; mobile-web quality not observed. `[hypothesis]` The mobile web is a responsive version of the same flight-first pages.

## 12. Performance, security and reliability

- No site performance measurements were made in this run (content not reachable). Nothing below is site performance data.
- `[direct]` www.schiphol.nl sits behind Cloudflare with bot management: on 2026-11-16 both curl and headless Chromium from a cloud container received an HTTP 403 managed challenge ("Just a moment...") rather than content. Single observation from one data-centre IP; ordinary visitors may never see it. https://www.schiphol.nl/en/
- `[direct]` The challenge interstitial is custom-branded rather than the stock Cloudflare page: dark slate header with an "AMS Schiphol" logo, pale blue canvas, large bold heading "One moment please". Screenshot: `docs/research/screenshots/schiphol-cloudflare-challenge-desktop.png`. Single-run lab observation from a cloud container; third-party asset hosts were blocked so rendering may be incomplete; not field data.
- `[direct]` The challenge document (not the site) returned first byte in about 0.18 s to curl and about 0.6 s in headless Chromium. This says nothing about real page performance and must not be quoted as such. Single-run lab observation from a cloud container; not field data.
- `[hypothesis]` A strict challenge in front of flight information can lock out legitimate users on restrictive networks or hardened devices (the interstitial itself lists "browser extension or network configuration" as a failure cause, and a Play Store review reports the app failing verification on GrapheneOS). Needs field data to size.
- `[search]` Security posture, precautionary action: a Schiphol service message states that because of a global cyber threat from a vulnerability in widely used web technology, up-to-date flight information was temporarily unavailable in the Schiphol app while schiphol.nl stayed available. The search summary dated this 21 October 2026; the date could not be re-checked (search budget exhausted). https://www.schiphol.nl/en/messages/schiphol-responds-to-global-cyber-threat/
- `[hypothesis]` The description resembles the December 2025 React Server Components vulnerability response seen across the industry, so the message may predate October 2026.
- `[search]` 19-20 July 2024 global Windows/CrowdStrike outage: all Schiphol flights delayed or cancelled on the Friday; about 200 cancellations reported. https://news.schiphol.com/impact-global-computer-failure-schiphol-airport/ , https://nltimes.nl/2024/07/20/200-flights-canceled-schiphol-windows-outage-eindhoven-airport-restarts-system
- `[search]` 18 October 2026: self-service passport control (Royal Netherlands Marechaussee system, not Schiphol's website) was down for about 10 hours and several hundred passengers reportedly missed flights. https://nltimes.nl/2026/10/18/schiphol-restores-passport-control-system-10-hours-hundreds-miss-flights
- `[search]` Developer platform: authentication moved to client credentials with JWT (Auth0), per a migration guide dated 20 July 2026. https://developer.schiphol.nl/news-and-updates/api-consumer-migration-guide.md

## 13. Recent relaunches, awards, initiatives (2024-2026)

- `[search]` October 2025: Schiphol app 12.0 visual overhaul with home-screen, lock-screen and Apple Watch flight widgets. https://apps.apple.com/es/app/schiphol-amsterdam-airport/id409161665?l=en-GB&platform=watch
- `[search]` 2026: Public Flight API at v4 (spec 4.2.0, OpenAPI 3.0) on a renewed developer portal; consumers migrated to new credentials (guide dated 20 July 2026); existing accounts must re-subscribe via "Get access". https://developer.schiphol.nl/apis/flight-api/releasenotes , https://developer.schiphol.nl/news-and-updates/api-consumer-migration-guide.md
- `[search]` Public Flight API endpoints: flights for a date, single flight by id, flight-id lookup over a date range (max three days), airlines, destinations, aircraft types; base URL `https://{environment}.schiphol.nl/public/public-flights/v4`; headers `Accept: application/json` and `ResourceVersion: v4`. https://developer.schiphol.nl/apis/schiphol-public-flight-api-4-public-prd/versions/7e467a47-1065-4998-b293-ef9bb4efbe24 , https://developer.schiphol.nl/apis/flight-api/overview
- `[search]` 2026 Privium price list (EUR 190 / 235 / 370) and a three-month Plus Trial (EUR 95). https://www.schiphol.nl/en/privium/register/?membershipChoice=priviumPlus
- `[search]` Schiphol sells its passenger journey platform to other airports under "Aviation Solutions". https://www.schiphol.nl/en/aviation-solutions/page/pxp-discover-all-possibilities/
- `[hypothesis]` Flight-page URL scheme changed between 2025 and 2026 (see section 3), consistent with a web re-platform.
- `[direct]` The logo served on www.schiphol.nl on 2026-11-16 reads "AMS Schiphol" (seen on the challenge interstitial). `[hypothesis]` This differs from the plain "Schiphol" wordmark this researcher knows from about 2025 and may indicate a brand refresh; no announcement was found in this run.
- Gap: no 2024-2026 digital awards were found in this run.

## Scores table

Expert assessments on a 1-5 scale, not instrumented tests. Evidence is search-level or prior, apart from one direct observation of the site's bot-challenge page.

| Dimension (weight) | Score | Confidence | Evidence level | Evidence |
|---|---|---|---|---|
| ui - UI aesthetics and brand (10%) | 4.0 | low | prior + search proxy | App 12.0 "visual overhaul" in Oct 2025 (https://apps.apple.com/es/app/schiphol-amsterdam-airport/id409161665?l=en-GB&platform=watch); app rated 4.7-4.9 on Google Play (https://play.google.com/store/apps/details?id=org.schiphol); digital instructions reuse the physical yellow-sign wayfinding language (https://www.schiphol.nl/en/timeslots/). The only page seen directly was the branded challenge interstitial (dark slate header, "AMS Schiphol" logo, pale blue canvas, bold heading; screenshots/schiphol-cloudflare-challenge-desktop.png). Homepage and flight pages not observed; score leans on prior knowledge (~2025) of a restrained, consistent design system. |
| ux - task completion (20%) | 4.5 | medium | search | One object, one URL per flight (https://www.schiphol.nl/en/departures/MS758/); free time-slot booking for a whole party with QR confirmation (https://www.schiphol.nl/en/timeslots/); arrivals walking-time prediction from a flight number (https://www.schiphol.nl/en/blog/find-out-how-long-it-will-take-to-get-outside/). Not task-timed. |
| info - comprehensiveness and accuracy (15%) | 4.0 | medium | search | Deep coverage of transfers, assistance, transport and weekly traffic outlook (https://www.schiphol.nl/en/at-schiphol/services/transferdesk/ , https://www.schiphol.nl/en/assistance/ , https://www.schiphol.nl/en/schiphol-as-a-neighbour/look-ahead-at-air-traffic/). Marked down for stale pages and conflicting Privium prices on official URLs (https://www.schiphol.nl/en/privium/kieslidmaatschap/ vs https://www.schiphol.nl/en/privium/register/?membershipChoice=priviumPlus). |
| flight - live flight info and journey assistance (15%) | 5.0 | medium | search | Per-flight and per-codeshare pages; push/SMS alerts; itinerary with gate walking time, security wait and boarding time (https://www.schiphol.nl/en/blog/when-do-i-need-to-be-where-at-schiphol/); bookable security slots (https://www.schiphol.nl/en/timeslots/); day-level crowd expectation (https://www.schiphol.nl/en/my-travel-day/today/departures/); platform resold to other airports (https://www.schiphol.nl/en/aviation-solutions/page/pxp-discover-all-possibilities/). |
| mobile - mobile experience (10%) | 4.5 | medium | search | Google Play 4.7-4.9 from 42-47K reviews, 1M+ downloads; widgets, lock screen and Apple Watch updates since v12.0 (Oct 2025); in-app parking booking (https://play.google.com/store/apps/details?id=org.schiphol , https://www.schiphol.nl/en/the-schiphol-app/). Mobile web not observed. |
| nav - navigation, search, accessibility (10%) | 3.5 | low | search + hypothesis | Clean, guessable URL structure and searchable interactive map (https://www.schiphol.nl/en/blog/find-your-way-quickly-and-easily-at-schiphol/). Marked down: NL/EN only; no accessibility statement found; deaf text service Dutch-only (https://www.schiphol.nl/en/contact-schiphol/); site search not evaluated. |
| ai - personalisation and AI (10%) | 3.0 | low | search | AI chatbot confirmed only via its privacy statement (https://www.schiphol.nl/en/privacy-and-cookies/schiphol-chatbot-privacy-statement/); flight-keyed personal itinerary; 24/7 human WhatsApp (https://www.schiphol.nl/en/contact-schiphol/). No named assistant, no account-based recommendations evidenced. |
| commerce - digital commerce (5%) | 3.5 | low | search | Dynamic-priced parking pre-booking (https://flyschiphol.com/parking, unverified domain; app release note on Google Play); Privium subscription tiers sold online (https://www.schiphol.nl/en/privium/register/?membershipChoice=priviumPlus). Marked down: click-and-collect was a limited 2021 pilot with unclear status (https://www.futuretravelexperience.com/2021/06/schiphol-airport-launches-click-collect-pre-order-service/). |
| perf - performance, security, reliability (5%) | 3.0 | low | search + one direct observation (no speed measured) | No speed data. Cloudflare bot challenge (HTTP 403) served to automated clients on 2026-11-16 (direct, https://www.schiphol.nl/en/). Precautionary removal of live flight info from the app during a cyber threat while the website stayed up (https://www.schiphol.nl/en/messages/schiphol-responds-to-global-cyber-threat/); July 2024 global outage impact (https://news.schiphol.com/impact-global-computer-failure-schiphol-airport/); API auth modernised July 2026 (https://developer.schiphol.nl/news-and-updates/api-consumer-migration-guide.md). |

Weighted total: 4.075 / 5 = 81.5% (0.40 + 0.90 + 0.60 + 0.75 + 0.45 + 0.35 + 0.30 + 0.175 + 0.15).

## Standout features MAHB must surpass

1. **Free bookable security time slots** - https://www.schiphol.nl/en/timeslots/ . A guaranteed 15-minute window, bookable 3 days ahead for the whole travelling party, QR code by email, dedicated signed lane. It converts the passenger's biggest uncertainty into a fixed appointment and spreads demand for the operator. `[search]`
2. **The flight as the organising object, on web and app** - https://www.schiphol.nl/en/departures/MS758/ and https://www.schiphol.nl/en/blog/when-do-i-need-to-be-where-at-schiphol/ . Clean per-flight URLs (codeshares included) lead to a personal itinerary with walking time to gate, security wait, boarding time and alerts; arrivals get a landing-to-exit walking-time prediction; "my travel day" sets crowd expectations. `[search]`
3. **Glanceable app surfaces** - https://www.schiphol.nl/en/the-schiphol-app/ . Since v12.0 (Oct 2025) real-time flight updates appear on the home screen, lock screen and Apple Watch; the app holds 4.7-4.9 on Google Play across 42-47K reviews. `[search]`
4. **Public Flight API and developer portal** - https://developer.schiphol.nl/apis/flight-api/overview . Versioned OpenAPI 3.0 spec (4.2.0), production and acceptance environments, release notes and a dated migration guide. It makes Schiphol's data the default source for third parties and enforces internal data discipline. `[search]`
5. **Privium as a paid digital membership** - https://www.schiphol.nl/en/privium/kieslidmaatschap/ . Three tiers (EUR 190 / 235 / 370 a year) plus a EUR 95 three-month trial, sold online, bundling fast border passage, lounges and check-in privileges: recurring ancillary revenue from frequent flyers. `[search]`

## Weaknesses and gaps (opportunities to leapfrog)

1. **Two languages only on the website (Dutch, English)** for a global transfer hub; the deaf text service is Dutch-only. `[search]` https://www.schiphol.nl/en/contact-schiphol/
2. **No door-to-gate ground transport planner.** Train, bus and taxi pages hand off to NS and 9292; nothing combines travel time, parking and security wait into a "leave by" time. `[search]` https://www.schiphol.nl/en/from-to-schiphol/
3. **Wayfinding depth is app-first and incomplete.** Blue-dot position and itinerary walking times sit in the app; no public pier-to-pier walking-time table; no evidence of accessible (step-free) routing or AR. `[search + hypothesis]` https://www.schiphol.nl/en/blog/find-your-way-quickly-and-easily-at-schiphol/
4. **Thin AI and account personalisation.** An AI chatbot exists but is not a named, marketed assistant; no evidence of saved trips or recommendations tied to an account; help depends on human agents over WhatsApp. `[search + hypothesis]` https://www.schiphol.nl/en/privacy-and-cookies/schiphol-chatbot-privacy-statement/
5. **Fragmented commerce and uneven content hygiene.** Click-and-collect was a limited 2021 pilot of unclear status; parking, Privium and lounges are separate purchases; official pages show superseded prices (EUR 180/305 vs EUR 190/370) and 2020-2023 blogs still rank; live app flight data was pulled during a security scare; no accessibility statement located. `[search]` https://www.schiphol.nl/en/privium/kieslidmaatschap/ , https://www.schiphol.nl/en/messages/schiphol-responds-to-global-cyber-threat/

## Ideas to outperform (not merely copy)

1. **"My Journey" without an install.** A flight-number URL that opens a progressive web experience with the full timeline (leave home, check-in close, security wait, immigration wait, walk to gate, boarding), opt-in web push and WhatsApp alerts. Schiphol reserves the richest version for its native app.
2. **True door-to-gate planner for KLIA.** Combine ERL/KLIA Ekspres, bus, e-hailing pick-up zones, live parking availability and live security and immigration waits into one "leave by" recommendation, including the Terminal 1 to Terminal 2 transfer. Schiphol defers to external planners.
3. **Multilingual from day one, including live data and the assistant.** Bahasa Malaysia, English, Chinese, Arabic, Japanese, Korean and Tamil for flight status, alerts and chatbot, not only for static pages. Schiphol stops at two languages.
4. **Accessible wayfinding on the open web.** Publish walking times between any two points, with a step-free route toggle, rest points and prayer rooms, usable in a browser. Schiphol holds gate-to-gate walking data but does not publish it.
5. **One account, one basket, one status.** Parking, lounge, fast track, reserve-and-collect and a points programme attached to the saved flight, with a single checkout and a public "last updated" stamp on every live figure.
6. **Open data plus a public status page.** Match the Flight API and add queue-time and facility-status endpoints, with a public uptime page and a cached read-only flight board that keeps working when dynamic services are withdrawn for security reasons.

## Sources

Official / operator
- https://www.schiphol.nl/en/timeslots/
- https://www.schiphol.nl/en/blog/choose-your-own-time-slot-for-security/
- https://www.schiphol.nl/en/prepare-for-your-flight-at-schiphol/smooth-security-check/
- https://www.schiphol.nl/en/my-travel-day/today/departures/
- https://www.schiphol.nl/en/the-schiphol-app/
- https://www.schiphol.nl/en/download-the-schiphol-app
- https://www.schiphol.nl/en/departures/MS758/ , https://www.schiphol.nl/en/departures/KL6033/ , https://www.schiphol.nl/en/departures/ET1217/ , https://www.schiphol.nl/en/arrivals/AY1305/ , https://www.schiphol.nl/en/arrivals/KL686/
- https://www.schiphol.nl/en/departures/flight/D20230910KL0655/ , https://www.schiphol.nl/en/transfers/departures/flight/D20250329KL0973/ , https://www.schiphol.nl/en/transfers/arrivals/flight/A20250219DY1258/
- https://www.schiphol.nl/en/blog/when-do-i-need-to-be-where-at-schiphol/
- https://www.schiphol.nl/en/blog/how-far-in-advance-do-i-need-to-be-at-schiphol/
- https://www.schiphol.nl/en/blog/find-out-how-long-it-will-take-to-get-outside/
- https://www.schiphol.nl/en/blog/find-your-way-quickly-and-easily-at-schiphol/
- https://www.schiphol.nl/en/blog/schiphol-is-big-but-just-how-big-exactly/
- https://www.schiphol.nl/en/developer-center/our-wayfinding-api-explored/
- https://www.schiphol.nl/en/innovation/blog/wilbur-data-on-passenger-flows-and-hot-pax/
- https://www.schiphol.nl/en/innovation/blog/your-personal-travel-assistant/
- https://www.schiphol.nl/en/innovation/blog/short-connection-pass/
- https://www.schiphol.nl/en/aviation-solutions/page/pxp-discover-all-possibilities/
- https://www.schiphol.nl/en/aviation-solutions/travor-case-studies/amsterdam-airport-schiphol/
- https://www.schiphol.nl/en/aviation-solutions/blog/increase-csat-scores-and-drive-airport-revenue/
- https://www.schiphol.nl/en/transfers/ , https://www.schiphol.nl/en/blog/all-about-your-transfer-at-schiphol/ , https://www.schiphol.nl/en/at-schiphol/services/transferdesk/
- https://www.schiphol.nl/en/from-to-schiphol/ , https://www.schiphol.nl/en/from-to-schiphol/by-public-transport/train/ , https://www.schiphol.nl/en/from-to-schiphol/by-public-transport/bus/ , https://www.schiphol.nl/en/from-to-schiphol/taxi/ , https://www.schiphol.nl/nl/van-naar-schiphol/
- https://www.schiphol.nl/en/privium/register/?membershipChoice=priviumPlus , https://www.schiphol.nl/en/privium/kieslidmaatschap/ , https://www.schiphol.nl/en/privium/nextleveltravel/
- https://www.schiphol.nl/en/assistance/ , https://www.schiphol.nl/en/assistance/flying-with-a-hidden-disability/ , https://www.schiphol.nl/en/assistance/flying-for-the-deaf-and-blind/ , https://www.schiphol.nl/en/assistance/with-transfers-at-schiphol/ , https://www.schiphol.nl/en/assistance/frequently-asked-questions/ , https://www.schiphol.nl/en/page/flying-with-a-wheelchair/
- https://www.schiphol.nl/en/blog/travelling-with-a-hidden-disability/ , https://www.schiphol.nl/en/blog/what-services-can-travellers-with-a-disability-expect-at-schiphol/
- https://www.schiphol.nl/en/contact-schiphol/
- https://www.schiphol.nl/en/privacy-and-cookies/schiphol-chatbot-privacy-statement/ , https://www.schiphol.nl/nl/privacy-en-cookies/privacystatement-chatbot/
- https://www.schiphol.nl/en/schiphol-as-a-neighbour/look-ahead-at-air-traffic/
- https://www.schiphol.nl/en/messages/schiphol-responds-to-global-cyber-threat/ , https://www.schiphol.nl/en/messages/travelling-to-or-from-schiphol-take-adjusted-timetables-into-account/
- https://developer.schiphol.nl/apis/flight-api/overview , https://developer.schiphol.nl/apis/flight-api/releasenotes , https://developer.schiphol.nl/news-and-updates/api-consumer-migration-guide.md , https://developer.schiphol.nl/apis/schiphol-public-flight-api-4-public-prd/versions/7e467a47-1065-4998-b293-ef9bb4efbe24
- https://news.schiphol.com/schiphol-improving-information-provision-to-passengers/ , https://news.schiphol.com/schiphol-revamping-information-provision-in-the-terminal/ , https://news.schiphol.com/impact-global-computer-failure-schiphol-airport/ , https://news.schiphol.com/passengers-can-now-shop-at-schiphol-from-home-or-on-your-way-to-the-airport/
- https://www.klm.com/information/airport/security-timeslot (airline)

App stores
- https://play.google.com/store/apps/details?id=org.schiphol
- https://apps.apple.com/bf/app/schiphol-amsterdam-airport/id409161665 , https://apps.apple.com/es/app/schiphol-amsterdam-airport/id409161665?l=en-GB&platform=watch

News and trade press
- https://nltimes.nl/2026/10/18/schiphol-restores-passport-control-system-10-hours-hundreds-miss-flights
- https://nltimes.nl/2024/07/20/200-flights-canceled-schiphol-windows-outage-eindhoven-airport-restarts-system
- https://www.futuretravelexperience.com/2021/06/schiphol-airport-launches-click-collect-pre-order-service/
- https://moodiedavittreport.com/amsterdam-airport-schiphol-launches-pilot-click-collect-scheme/
- https://www.passengerterminaltoday.com/features/feature-how-will-ai-transform-the-passenger-experience-at-airports.html
- https://www.businesstravelnewseurope.com/Air-Travel/Amsterdam-Schiphol-unveils-largest-Privium-lounge
- https://www.data-expo.nl/en/visitors/program/hoe-schiphol-ai-in-zet-om-de-passagiersbeleving-te-verhogen

Aggregators and blogs (low reliability, used only where labelled)
- https://www.appbrain.com/app/schiphol-amsterdam-airport/org.schiphol
- https://flyschiphol.com/parking (ownership unverified)
- https://amsterdamairportto.city/schiphol-airport-parking/ , https://airmundo.com/en/amsterdam-airport-schiphol/parking/ , https://thevaletguys.nl/en/rates-for-parking-at-schiphol/
- https://www.amsterdamtips.com/schiphol-airport-lounges , https://www.amsterdamtourism.org/schiphol-lounges/
- https://airport.online/amsterdam-schiphol/en/schiphol-airport-ams-terminal-navigation
- https://amsterdam-schiphol.mydutyfree.net/
