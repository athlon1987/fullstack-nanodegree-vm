'use client';

import { useState } from 'react';
import { JOURNEY_MODES, type JourneyMode } from '@/lib/journey/modes';
import { useT } from '@/lib/i18n/client';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTrigger, Sheet, SheetContent, SheetTrigger } from '@/components/ui/dialog';
import { FilterChip } from '@/components/ui/filter-chip';
import { IconButton } from '@/components/ui/icon-button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchField } from '@/components/ui/search-field';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip } from '@/components/ui/tooltip';
import { PROVENANCES } from '@/content/types';

const MODE_HINT_ICON = { departing: 'departing', arriving: 'arriving', transiting: 'transiting', meeting: 'meeting' } as const;

export function FilterChipDemo() {
  const t = useT();
  const [pressed, setPressed] = useState<Record<string, boolean>>({ open: true, before: false, after: false });
  const toggle = (key: string) => (value: boolean) => setPressed((current) => ({ ...current, [key]: value }));
  return (
    <>
      <FilterChip pressed={pressed.open} onPressedChange={toggle('open')} icon="clock">
        {t('common.labels.openNow')}
      </FilterChip>
      <FilterChip pressed={pressed.before} onPressedChange={toggle('before')}>
        {t('common.labels.landside')}
      </FilterChip>
      <FilterChip pressed={pressed.after} onPressedChange={toggle('after')} count={12}>
        {t('common.labels.airside')}
      </FilterChip>
      <FilterChip pressed={false} disabled>
        {t('common.labels.international')}
      </FilterChip>
    </>
  );
}

export function SearchFieldDemo() {
  const t = useT();
  return (
    <div className="grid w-full gap-5">
      <SearchField
        size="lg"
        label={t('flights.search.label')}
        placeholder={t('search.placeholder')}
        placeholderShort={t('flights.search.label')}
        hint={t('flights.search.hint')}
        trailing={
          <Button size="sm" iconEnd="arrow-right" className="h-11 max-sm:px-3.5">
            <span className="max-sm:sr-only">{t('common.actions.search')}</span>
          </Button>
        }
      />
      <SearchField label={t('airportSwitcher.label')} hideLabel={false} placeholder={t('airportSwitcher.searchPlaceholder')} icon="map-pin" defaultValue="Kuala Lumpur" />
    </div>
  );
}

export function SegmentedDemo() {
  const t = useT();
  const [direction, setDirection] = useState<'d' | 'a'>('d');
  const [mode, setMode] = useState<JourneyMode>('departing');
  return (
    <div className="grid w-full gap-5">
      <SegmentedControl
        label={t('flights.filters.direction')}
        value={direction}
        onValueChange={setDirection}
        options={[
          { value: 'd', label: t('common.labels.departures'), icon: 'plane-takeoff' },
          { value: 'a', label: t('common.labels.arrivals'), icon: 'plane-landing' },
        ]}
      />
      <SegmentedControl
        label={t('journey.modes.title')}
        showLabel
        block
        stackOnPhone
        size="lg"
        value={mode}
        onValueChange={setMode}
        options={JOURNEY_MODES.map((value) => ({ value, label: t(`journey.modes.${value}.label`), icon: MODE_HINT_ICON[value] }))}
      />
    </div>
  );
}

export function SwitchDemo() {
  const t = useT();
  const [stepFree, setStepFree] = useState(true);
  const [motion, setMotion] = useState(false);
  return (
    <div className="grid w-full gap-1">
      <Switch label={t('map.stepFreeRoute')} checked={stepFree} onCheckedChange={setStepFree} />
      <Switch label={t('preferences.reducedMotion')} hint={t('preferences.reducedMotionHint')} checked={motion} onCheckedChange={setMotion} />
      <Switch label={t('preferences.highContrast')} hint={t('preferences.highContrastHint')} disabled />
    </div>
  );
}

export function TabsDemo() {
  const t = useT();
  return (
    <Tabs defaultValue="d" className="w-full">
      <TabsList aria-label={t('flights.filters.direction')}>
        <TabsTrigger value="d">{t('common.labels.departures')}</TabsTrigger>
        <TabsTrigger value="a">{t('common.labels.arrivals')}</TabsTrigger>
        <TabsTrigger value="x" disabled>
          {t('nav.transit')}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="d" className="type-body-sm text-ink-2">
        {t('journey.modes.departing.description')}
      </TabsContent>
      <TabsContent value="a" className="type-body-sm text-ink-2">
        {t('journey.modes.arriving.description')}
      </TabsContent>
    </Tabs>
  );
}

export function AccordionDemo() {
  const t = useT();
  return (
    <Accordion type="single" collapsible defaultValue="official" className="w-full">
      {PROVENANCES.map((kind) => (
        <AccordionItem key={kind} value={kind} title={t(`provenance.${kind}.label`)} headingLevel={4}>
          {t(`provenance.${kind}.description`)}
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function OverlayDemo() {
  const t = useT();
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">{t('designSystem.demo.openDialog')}</Button>
        </DialogTrigger>
        <DialogContent
          title={t('designSystem.demo.dialogTitle')}
          description={t('designSystem.demo.dialogBody')}
          size="sm"
          footer={
            <>
              <DialogClose asChild>
                <Button variant="quiet">{t('common.actions.cancel')}</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>{t('common.actions.confirm')}</Button>
              </DialogClose>
            </>
          }
        >
          <p className="type-body text-ink-2">{t('journey.saved.storedLocally')}</p>
        </DialogContent>
      </Dialog>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary" iconStart="sliders-horizontal">
            {t('designSystem.demo.openSheet')}
          </Button>
        </SheetTrigger>
        <SheetContent title={t('designSystem.demo.sheetTitle')} description={t('designSystem.demo.sheetBody')}>
          <div className="grid gap-1">
            <Switch label={t('map.stepFreeRoute')} defaultChecked />
            <Switch label={t('preferences.reducedMotion')} hint={t('preferences.reducedMotionHint')} />
          </div>
        </SheetContent>
      </Sheet>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary" iconEnd="chevron-down">
            {t('designSystem.demo.openPopover')}
          </Button>
        </PopoverTrigger>
        <PopoverContent aria-label={t('designSystem.demo.openPopover')}>
          <p className="type-body-sm text-ink-2">{t('designSystem.demo.popoverBody')}</p>
        </PopoverContent>
      </Popover>

      <Tooltip content={t('designSystem.demo.tooltip')}>
        <IconButton icon="circle-help" label={t('nav.help')} variant="secondary" />
      </Tooltip>
    </>
  );
}
