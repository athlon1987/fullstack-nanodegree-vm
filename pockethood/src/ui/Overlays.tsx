// Routes UI state to the right panel / sheet / modal. One place decides what's on screen.
import { useGame } from '../state/store';
import { BuildingSheet, BuildPanel, PlaceBar } from './panels/BuildPanels';
import { CommunityPanel, DevToolsPanel, EventsPanel, ExpandPanel, FriendsPanel, HelpPanel, ProfilePanel, SettingsPanel } from './panels/MetaPanels';
import { InventoryPanel, OrdersPanel, PulsePanel, QuestsPanel, ResidentsPanel } from './panels/SocialPanels';
import { DialogueBox, LevelUpModal, PhotoMode, useResidentTalk, WelcomeBack } from './modals/Modals';
import { Coach } from './tutorial/Coach';

const PANELS = {
  build: BuildPanel,
  orders: OrdersPanel,
  inventory: InventoryPanel,
  residents: ResidentsPanel,
  quests: QuestsPanel,
  pulse: PulsePanel,
  profile: ProfilePanel,
  settings: SettingsPanel,
  help: HelpPanel,
  friends: FriendsPanel,
  events: EventsPanel,
  community: CommunityPanel,
  expand: ExpandPanel,
  devtools: DevToolsPanel,
} as const;

export function Overlays() {
  const ui = useGame((s) => s.ui);
  useResidentTalk();
  if (ui.photoMode) return <PhotoMode />;
  const PanelComp = ui.panel ? PANELS[ui.panel] : null;
  return (
    <>
      {ui.placing && <PlaceBar />}
      {!ui.placing && ui.selected && !ui.panel && <BuildingSheet />}
      {PanelComp && <PanelComp />}
      {ui.dialogue && <DialogueBox d={ui.dialogue} />}
      {ui.welcome && !ui.dialogue && <WelcomeBack />}
      {ui.levelUp && !ui.dialogue && <LevelUpModal level={ui.levelUp.level} unlocks={ui.levelUp.unlocks} />}
      <Coach />
    </>
  );
}
