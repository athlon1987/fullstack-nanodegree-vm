import { resolveSources } from '@/content';
import { AIRPORTS, CLASSIFICATION_LABELS, FEATURED_AIRPORTS, airportsByClassification, getAirport } from '@/content/airports';
import { PROVENANCES, pick, type Lang } from '@/content/types';
import { FLIGHT_STATUSES, formatFlightNumber } from '@/lib/flights';
import type { Translator } from '@/lib/i18n/translate';
import { addMinutes, formatTime } from '@/lib/time';
import { AirportVignette, VIGNETTE_KEYS } from '@/components/art/airport-vignette';
import { BrandMark } from '@/components/art/brand-mark';
import { RebungRule, TaburField, WeaveTexture } from '@/components/art/patterns';
import { Wordmark } from '@/components/art/wordmark';
import { AirportCode } from '@/components/common/airport-code';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { DemoDataBanner } from '@/components/common/demo-data-banner';
import { EmptyState } from '@/components/common/empty-state';
import { ExternalLink } from '@/components/common/external-link';
import { FlightStatusChip } from '@/components/common/flight-status-chip';
import { Freshness } from '@/components/common/freshness';
import { KeyFact } from '@/components/common/key-fact';
import { LocalTime } from '@/components/common/local-time';
import { LocaleLink } from '@/components/common/locale-link';
import { NotPublished } from '@/components/common/not-published';
import { NoticeCard } from '@/components/common/notice-card';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { QuickAction } from '@/components/common/quick-action';
import { SectionHeading } from '@/components/common/section-heading';
import { SourceNote } from '@/components/common/source-note';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { TranslationNotice } from '@/components/common/translation-notice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card, CardBody, CardFooter, CardHeader, CardLink } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { DataList, DataListItem } from '@/components/ui/data-list';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { Kbd } from '@/components/ui/kbd';
import { NativeSelect } from '@/components/ui/native-select';
import { Separator } from '@/components/ui/separator';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { Stat } from '@/components/ui/stat';
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { Timeline, TimelineItem } from '@/components/ui/timeline';
import { sampleFlights } from './board-sample';
import { AccordionDemo, FilterChipDemo, OverlayDemo, SearchFieldDemo, SegmentedDemo, SwitchDemo, TabsDemo } from './interactive';
import { Demo, DemoGrid, DsGroup, Stated } from './parts';

interface ShowcaseProps {
  t: Translator;
  lang: Lang;
}

/* ------------------------------------------------------------------------------------------ */

export function ActionsShowcase({ t }: ShowcaseProps) {
  const label = t('common.actions.search');
  return (
    <DemoGrid>
      <Demo name="Button · variant">
        <Button>{label}</Button>
        <Button variant="secondary">{t('common.actions.change')}</Button>
        <Button variant="ghost">{t('common.actions.viewAll')}</Button>
        <Button variant="quiet">{t('common.actions.cancel')}</Button>
        <Button variant="danger" iconStart="trash-2">
          {t('common.actions.remove')}
        </Button>
      </Demo>
      <Demo name="Button · size sm 36 (44 touch) · md 44 · lg 52" className="items-end">
        <Button size="sm">{label}</Button>
        <Button size="md" iconStart="search">
          {label}
        </Button>
        <Button size="lg" iconEnd="arrow-right">
          {label}
        </Button>
      </Demo>
      <Demo name="Button · states" className="items-start gap-x-5">
        <Stated label={t('designSystem.states.default')}>
          <Button>{label}</Button>
        </Stated>
        <Stated label={t('designSystem.states.hover')}>
          <Button className="bg-primary-hover">{label}</Button>
        </Stated>
        <Stated label={t('designSystem.states.focus')}>
          <Button className="focus-ring">{label}</Button>
        </Stated>
        <Stated label={t('designSystem.states.disabled')}>
          <Button disabled>{label}</Button>
        </Stated>
        <Stated label={t('designSystem.states.loading')}>
          <Button loading loadingLabel={t('common.labels.loading')}>
            {label}
          </Button>
        </Stated>
      </Demo>
      <Demo name="Button asChild · LocaleLink · ExternalLink">
        <Button asChild variant="secondary" iconEnd="arrow-right">
          <LocaleLink href="/airports">{t('nav.airports')}</LocaleLink>
        </Button>
        <LocaleLink href="/notices" className="link-action">
          {t('notices.viewAll')}
        </LocaleLink>
        <ExternalLink variant="action" href="https://www.malaysiaairports.com.my/">
          {t('footer.officialSite')}
        </ExternalLink>
      </Demo>
      <Demo name="IconButton · label required">
        <IconButton icon="search" label={t('nav.search')} />
        <IconButton icon="bookmark" label={t('common.actions.save')} variant="secondary" />
        <IconButton icon="bookmark-check" label={t('common.actions.saved')} variant="secondary" pressed />
        <IconButton icon="arrow-right" label={t('common.actions.next')} variant="primary" />
        <IconButton icon="x" label={t('common.actions.close')} variant="quiet" size="sm" />
        <IconButton icon="share-2" label={t('common.actions.share')} disabled />
      </Demo>
      <Demo name="FilterChip · aria-pressed">
        <FilterChipDemo />
      </Demo>
      <Demo name="Chip · static tag">
        <Chip>{t('common.labels.landside')}</Chip>
        <Chip tone="outline" icon="moon-star">
          {t('common.labels.open24Hours')}
        </Chip>
        <Chip tone="primary">{t('common.labels.international')}</Chip>
        <Chip tone="gold">{t('common.prototypeLabel')}</Chip>
        <Chip tone="positive" icon="circle-check">
          {t('common.labels.openNow')}
        </Chip>
        <Chip tone="warning" icon="triangle-alert">
          {t('common.labels.unverified')}
        </Chip>
        <Chip tone="critical" icon="circle-x">
          {t('common.labels.closedNow')}
        </Chip>
        <Chip tone="info" icon="info">
          {t('common.labels.optional')}
        </Chip>
      </Demo>
      <Demo name="Badge · Kbd">
        <Badge>KUL</Badge>
        <Badge tone="solid">T1</Badge>
        <Badge tone="primary">{t('common.labels.new')}</Badge>
        <Badge tone="gold">39</Badge>
        <Badge tone="positive">12</Badge>
        <Badge tone="warning">3</Badge>
        <Badge tone="critical">1</Badge>
        <Badge tone="info" size="sm">
          L3
        </Badge>
        <span className="type-body-sm flex items-center gap-1.5 text-ink-2">
          <Kbd>/</Kbd> <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
        </span>
      </Demo>
    </DemoGrid>
  );
}

/* ------------------------------------------------------------------------------------------ */

export function FormsShowcase({ t }: ShowcaseProps) {
  return (
    <DemoGrid>
      <Demo name="SearchField · lg with action · md with visible label" className="block">
        <SearchFieldDemo />
      </Demo>
      <Demo name="SegmentedControl · native radios, arrow keys" className="block">
        <SegmentedDemo />
      </Demo>
      <Demo name="Input · default · hint · error · disabled" className="grid items-start gap-5 sm:grid-cols-2">
        <Input label={t('journey.saved.parkedCar.carPark')} placeholder="P1" fieldClassName="w-full" />
        <Input label={t('journey.saved.parkedCar.zone')} hint={t('designSystem.demo.fieldHint')} optionalLabel={t('common.labels.optional')} mono defaultValue="B2-114" />
        <Input label={t('common.labels.flight')} iconStart="plane-takeoff" error={t('errors.invalidInput')} defaultValue="MH" mono />
        <Input label={t('journey.saved.parkedCar.note')} disabled defaultValue={t('common.labels.notPublished')} />
      </Demo>
      <Demo name="NativeSelect · Switch" className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <NativeSelect label={t('common.labels.airport')} iconStart="map-pin" defaultValue="kul">
            {FEATURED_AIRPORTS.map((airport) => (
              <option key={airport.slug} value={airport.slug}>
                {airport.code} · {airport.shortName}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect label={t('common.labels.terminal')} hint={t('airportSwitcher.notSure')} defaultValue="all">
            <option value="all">{t('flights.filters.allTerminals')}</option>
            <option value="T1">{t('common.labels.terminal')} 1</option>
            <option value="T2">{t('common.labels.terminal')} 2</option>
          </NativeSelect>
        </div>
        <SwitchDemo />
      </Demo>
    </DemoGrid>
  );
}

/* ------------------------------------------------------------------------------------------ */

export function ContainersShowcase({ t }: ShowcaseProps) {
  return (
    <DemoGrid>
      <Demo name="Card · outline · raised · sunken" className="grid items-stretch gap-4 sm:grid-cols-3" frameClassName="bg-page">
        {(['outline', 'raised', 'sunken'] as const).map((variant) => (
          <Card key={variant} variant={variant} padding="sm">
            <p className="type-data-xs text-ink-3">{variant}</p>
            <p className="type-title-sm mt-2 text-ink">{t('nav.facilities')}</p>
            <p className="type-body-sm mt-1 text-ink-2">{t('journey.actions.viewFacilities')}</p>
          </Card>
        ))}
      </Demo>
      <Demo name="Card interactive · CardLink" className="grid items-stretch gap-4 sm:grid-cols-2" frameClassName="bg-page">
        <Card interactive padding="sm">
          <Icon name="square-parking" size="lg" className="text-primary-ink" />
          <h4 className="type-title-md mt-3 text-ink">
            <CardLink href="/design-system">{t('designSystem.demo.cardTitle')}</CardLink>
          </h4>
          <p className="type-body-sm mt-1 text-ink-2">{t('designSystem.demo.cardBody')}</p>
        </Card>
        <Card>
          <CardHeader>
            <h4 className="type-title-md text-ink">{t('journey.saved.title')}</h4>
          </CardHeader>
          <CardBody className="type-body-sm text-ink-2">{t('journey.saved.storedLocally')}</CardBody>
          <CardFooter>
            <Button size="sm" variant="secondary">
              {t('common.actions.edit')}
            </Button>
          </CardFooter>
        </Card>
      </Demo>
      <Demo name="Tabs" className="block">
        <TabsDemo />
      </Demo>
      <Demo name="Accordion" className="block">
        <AccordionDemo />
      </Demo>
      <Demo name="Dialog · Sheet · Popover · Tooltip">
        <OverlayDemo />
      </Demo>
      <Demo name="Skeleton · Separator" className="block">
        <div role="status" className="grid gap-3">
          <span className="sr-only">{t('common.labels.loading')}</span>
          <Skeleton className="h-row w-full" />
          <SkeletonText lines={3} />
        </div>
        <Separator className="my-5" />
        <Separator variant="strong" className="mb-5" />
        <Separator variant="rebung" />
      </Demo>
      <Demo name="EmptyState" className="block">
        <EmptyState icon="search-x" title={t('flights.board.noFlights')} headingLevel={4} action={<Button variant="secondary">{t('flights.filters.clearFilters')}</Button>}>
          {t('empty.officialPointer')}
        </EmptyState>
      </Demo>
      <Demo name="Callout · tone" className="grid gap-3">
        <Callout tone="info" title={t('demo.mapNote')} />
        <Callout tone="positive" title={t('journey.saved.storedLocally')} />
        <Callout tone="warning" title={t('parking.ratesNotVerified')}>
          {t('parking.ratesNotVerifiedBody')}
        </Callout>
        <Callout tone="critical" title={t('errors.loadFailed')} actions={<Button size="sm" variant="secondary">{t('common.actions.retry')}</Button>} />
        <Callout title={t('concierge.limits')} />
      </Demo>
    </DemoGrid>
  );
}

/* ------------------------------------------------------------------------------------------ */

export function DataShowcase({ t, lang }: ShowcaseProps) {
  const { flights } = sampleFlights(3);
  const flight = flights[0];
  const groups = airportsByClassification();
  const kul = getAirport('kul') ?? AIRPORTS[0];
  return (
    <DemoGrid>
      <Demo name="DataList · rows" className="block">
        <div className="mb-3">
          <ProvenanceTag provenance="demo" />
        </div>
        <DataList>
          <DataListItem label={t('common.labels.flight')} icon="plane-takeoff" mono>
            {formatFlightNumber(flight)}
          </DataListItem>
          <DataListItem label={t('common.labels.to')} icon="map-pin">
            {flight.destination.city} <AirportCode code={flight.destination.code} size="sm" className="ml-1 text-ink-2" />
          </DataListItem>
          <DataListItem label={t('common.labels.scheduled')} icon="clock" mono>
            {formatTime(flight.scheduled)}
          </DataListItem>
          <DataListItem label={t('common.labels.gate')} icon="door-open" mono>
            {flight.gate ?? <NotPublished label={t('flights.board.gateNotAssigned')} />}
          </DataListItem>
          <DataListItem label={t('common.labels.status')}>
            <FlightStatusChip status={flight.status} size="sm" />
          </DataListItem>
        </DataList>
      </Demo>
      <Demo name="DataList · stacked · Stat" className="block">
        <DataList layout="stacked">
          <DataListItem label={t('common.labels.airline')}>{flight.airline.name}</DataListItem>
          <DataListItem label={t('common.labels.terminal')}>
            <TerminalBadge terminal={flight.terminal} />
          </DataListItem>
          <DataListItem label={t('common.labels.checkIn')} mono>
            {flight.checkInRow ?? '–'}
          </DataListItem>
          <DataListItem label={t('common.labels.airportTime')}>
            <LocalTime zone="always" />
          </DataListItem>
        </DataList>
        <Separator className="my-5" />
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Stat value={AIRPORTS.length} label={t('common.labels.airports')} />
          <Stat value={groups.international.length} label={t('common.labels.international')} />
          <Stat value={groups.domestic.length} label={t('common.labels.domestic')} />
          <Stat value={groups.stolport.length} label={t('airportSwitcher.stolports')} mono />
        </div>
      </Demo>
      <Demo name="Table · density dense" bare>
        <TableScroll label={t('airportSwitcher.featured')}>
          <Table density="dense">
            <caption className="sr-only">{t('airportSwitcher.featured')}</caption>
            <THead>
              <Tr>
                <Th>{t('common.labels.airport')}</Th>
                <Th>{t('common.labels.location')}</Th>
                <Th numeric>{t('common.labels.terminal')}</Th>
              </Tr>
            </THead>
            <TBody>
              {FEATURED_AIRPORTS.map((airport) => (
                <Tr key={airport.slug}>
                  <Td>
                    <span className="flex items-center gap-3">
                      <AirportCode code={airport.code} variant="boxed" size="sm" />
                      <span className="font-medium">{airport.shortName}</span>
                    </span>
                  </Td>
                  <Td className="text-ink-2">
                    {airport.city}, {airport.state}
                  </Td>
                  <Td numeric>{airport.terminals.length}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableScroll>
      </Demo>
      <Demo name="KeyFact · NotPublished · SourceNote" className="grid items-start gap-6 sm:grid-cols-2">
        <KeyFact
          label={t('common.labels.airports')}
          value={AIRPORTS.length}
          hint={pick(CLASSIFICATION_LABELS.international, lang)}
          provenance="official"
          sources={resolveSources(kul.sources)}
          mono
        />
        <KeyFact label={t('common.labels.price')} value={<NotPublished label={t('transport.fareNotPublished')} />} provenance="estimated" />
        <NotPublished variant="block" officialUrl="https://www.malaysiaairports.com.my/" className="sm:col-span-2" />
      </Demo>
      <Demo name="Timeline · TimelineItem" className="block">
        <Timeline>
          <TimelineItem
            state="done"
            stateLabel={t('journey.timeline.done')}
            time={formatTime(addMinutes(flight.scheduled, -180))}
            eyebrow={t('journey.relative.beforeYouLeave')}
            title={t('journey.actions.viewFlight')}
            meta={<ProvenanceTag provenance="demo" length="short" />}
          />
          <TimelineItem
            state="current"
            stateLabel={t('journey.timeline.current')}
            time={formatTime(addMinutes(flight.scheduled, -120))}
            eyebrow={t('journey.relative.onTheWay')}
            title={t('journey.actions.viewTransport')}
            meta={<ProvenanceTag provenance="estimated" length="short" />}
            actions={
              <LocaleLink href="/design-system#data" className="link-action type-body-sm">
                {t('journey.actions.viewParking')}
              </LocaleLink>
            }
          >
            {t('journey.timeline.intro')}
          </TimelineItem>
          <TimelineItem
            state="upcoming"
            stateLabel={t('journey.timeline.upcoming')}
            time={formatTime(addMinutes(flight.scheduled, -40))}
            eyebrow={t('journey.relative.beforeBoarding')}
            title={t('journey.actions.viewGateOnMap')}
            meta={<ProvenanceTag provenance="suggestion" length="short" />}
          />
        </Timeline>
      </Demo>
    </DemoGrid>
  );
}

/* ------------------------------------------------------------------------------------------ */

export function StatusShowcase({ t }: ShowcaseProps) {
  const kul = getAirport('kul') ?? AIRPORTS[0];
  return (
    <>
      <DsGroup title={t('designSystem.groups.flightStatus')} note={t('designSystem.notes.statusShapes')}>
        <DemoGrid>
          <Demo name="FlightStatusChip · surface">
            {FLIGHT_STATUSES.map((status) => (
              <FlightStatusChip key={status} status={status} />
            ))}
          </Demo>
          <Demo name="FlightStatusChip · surface-board" frameClassName="surface-board border-line">
            {FLIGHT_STATUSES.map((status) => (
              <FlightStatusChip key={status} status={status} />
            ))}
          </Demo>
        </DemoGrid>
      </DsGroup>
      <DsGroup title={t('designSystem.groups.terminals')}>
        <DemoGrid>
          <Demo name="TerminalBadge · AirportCode · LocalTime" className="gap-x-5">
            <TerminalBadge terminal="T1" />
            <TerminalBadge terminal="T2" />
            <TerminalBadge terminal="T1" size="sm" />
            <TerminalBadge terminal="T2" size="sm" />
            <AirportCode code="kul" name={kul.name} variant="boxed" />
            <AirportCode code="pen" size="lg" />
            <AirportCode code="bki" />
            <LocalTime showLabel zone="always" />
          </Demo>
          <Demo name="Freshness · polite live region">
            <Freshness live="off" updatedAt="2026-11-17T09:30:00+08:00" refreshSeconds={30} context={<AirportCode code="kul" size="sm" />} />
          </Demo>
        </DemoGrid>
      </DsGroup>
      <DsGroup title={t('designSystem.groups.provenanceTags')} note={t('designSystem.notes.provenanceForms')}>
        <DemoGrid>
          <Demo name="ProvenanceTag · full · short" className="block">
            <div className="flex flex-wrap gap-3">
              {PROVENANCES.map((kind) => (
                <ProvenanceTag key={kind} provenance={kind} />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {PROVENANCES.map((kind) => (
                <ProvenanceTag key={kind} provenance={kind} length="short" />
              ))}
            </div>
            <SourceNote sources={resolveSources(kul.sources)} defaultOpen className="mt-5" />
          </Demo>
          <Demo name="ProvenanceLegend" className="block">
            <ProvenanceLegend headingLevel={4} />
          </Demo>
        </DemoGrid>
      </DsGroup>
      <DsGroup title={t('designSystem.groups.demoData')}>
        <div className="grid gap-4">
          <DemoDataBanner />
          <DemoDataBanner compact />
        </div>
      </DsGroup>
    </>
  );
}

/* ------------------------------------------------------------------------------------------ */

export function PageFurnitureShowcase({ t }: ShowcaseProps) {
  const kul = getAirport('kul') ?? AIRPORTS[0];
  return (
    <DemoGrid>
      <Demo name="Breadcrumbs · parent only on phones">
        <Breadcrumbs items={[{ label: t('nav.airports'), href: '/airports' }, { label: kul.shortName, href: '/kul' }, { label: t('nav.parking') }]} />
      </Demo>
      <Demo name="SectionHeading" className="block">
        <SectionHeading
          level={3}
          number={2}
          eyebrow={t('nav.notices')}
          title={t('notices.title')}
          lead={t('freshness.checkOfficial')}
          className="mb-0 sm:mb-0"
          action={
            <LocaleLink href="/notices" className="link-action">
              {t('common.actions.viewAll')}
            </LocaleLink>
          }
        />
      </Demo>
      <Demo name="QuickAction · tile · emphasis" className="grid items-stretch gap-3 sm:grid-cols-3" frameClassName="bg-page">
        <QuickAction icon="flight" title={t('nav.flights')} hint={t('journey.actions.viewFlight')} href="/airports?then=flights" emphasis emphasisLabel="01" />
        <QuickAction icon="parking" title={t('nav.parking')} hint={t('journey.actions.viewParking')} href="/airports?then=parking" />
        <QuickAction icon="map" title={t('nav.map')} hint={t('journey.actions.viewMap')} href="/airports?then=map" />
      </Demo>
      <Demo name="QuickAction · row" className="grid gap-3" frameClassName="bg-page">
        <QuickAction layout="row" icon="rail" title={t('nav.groundTransport')} hint={t('journey.actions.viewTransport')} href="/airports?then=transport" />
        <QuickAction layout="row" icon="concierge" title={t('concierge.open')} href="/concierge" />
      </Demo>
      <Demo name="NoticeCard · severity" className="grid gap-3">
        <NoticeCard severity="info" title={t('demo.waitTimesNote')} provenance="demo" headingLevel={4} />
        <NoticeCard severity="advisory" title={t('freshness.checkOfficial')} provenance="suggestion" headingLevel={4} scope={kul.shortName} />
      </Demo>
      <Demo name="NoticeCard · TranslationNotice" className="grid gap-3">
        <NoticeCard severity="warning" title={t('freshness.stale')} provenance="estimated" headingLevel={4} />
        <NoticeCard severity="critical" title={t('errors.offline')} headingLevel={4}>
          {t('errors.genericBody')}
        </NoticeCard>
        <TranslationNotice />
      </Demo>
    </DemoGrid>
  );
}

/* ------------------------------------------------------------------------------------------ */

export function ArtShowcase({ t }: ShowcaseProps) {
  return (
    <>
      <DsGroup title={t('designSystem.groups.mark')} note={t('designSystem.notes.mark')}>
        <DemoGrid cols={3}>
          <Demo name="Wordmark · sm · md · lg" className="flex-col items-start gap-5">
            <Wordmark name={t('common.appName')} size="sm" />
            <Wordmark name={t('common.appName')} />
            <Wordmark name={t('common.appName')} size="lg" />
          </Demo>
          <Demo name="BrandMark" className="gap-6">
            <BrandMark className="size-6" />
            <BrandMark className="size-10" />
            <BrandMark className="size-16" />
          </Demo>
          <Demo name="Wordmark · bg-inverse" bare className="flex p-3">
            <div className="flex min-h-32 flex-1 items-center justify-center rounded-md bg-inverse p-5">
              <Wordmark name={t('common.appName')} size="lg" className="text-on-inverse" />
            </div>
          </Demo>
        </DemoGrid>
      </DsGroup>
      <DsGroup title={t('designSystem.groups.patterns')} note={t('designSystem.notes.motifs')}>
        <DemoGrid cols={3}>
          <Demo name="RebungRule · sm · lg" className="block">
            <RebungRule />
            <RebungRule size="lg" className="mt-8" />
          </Demo>
          <Demo name="TaburField · fade" bare className="relative min-h-40">
            <TaburField className="absolute inset-y-0 left-0 w-1/2" />
            <TaburField fade className="absolute inset-y-0 right-0 w-1/2" />
          </Demo>
          <Demo name="WeaveTexture · surface-board" bare frameClassName="surface-board border-line" className="relative min-h-40">
            <WeaveTexture className="absolute inset-0 text-board-dim" />
          </Demo>
        </DemoGrid>
      </DsGroup>
      <DsGroup title={t('designSystem.groups.vignettes')} note={t('designSystem.notes.vignettes')}>
        <ul className="grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-4">
          {VIGNETTE_KEYS.map((key) => {
            const [code, terminal] = key.split('-');
            const airport = getAirport(code);
            return (
              <li key={key} className="overflow-hidden rounded-lg border border-line-strong bg-surface">
                <AirportVignette code={code} terminal={terminal?.toUpperCase()} />
                <p className="flex items-center justify-between gap-3 border-t border-line px-3 py-2.5">
                  <span className="type-title-sm min-w-0 text-ink">
                    {airport ? airport.shortName : t('nav.airports')}
                    {terminal ? ` · ${t('common.labels.terminal')} ${terminal.slice(1)}` : ''}
                  </span>
                  {airport ? <AirportCode code={airport.code} size="sm" className="text-ink-2" /> : null}
                </p>
              </li>
            );
          })}
        </ul>
      </DsGroup>
    </>
  );
}
