import { Plugin } from 'obsidian';
import { registerAutoMove } from './features/auto-move';
import { registerMarkEasier } from './features/mark-easier';
import { registerMarkReviewed } from './features/mark-reviewed';
import { registerOpenInEudic } from './features/open-in-eudic';
import { ObsidianEnhancerSettingTab } from './setting-tab';
import {
  DEFAULT_SETTINGS,
  type EnhancerSettings,
  parseExcludedRoots,
} from './settings';

export default class ObsidianEnhancerPlugin extends Plugin {
  settings: EnhancerSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    registerOpenInEudic(this, () => this.settings.vocabularyTag);
    registerAutoMove(this, () =>
      parseExcludedRoots(this.settings.excludedRootsCsv),
    );
    registerMarkReviewed(this);
    registerMarkEasier(this);

    this.addSettingTab(new ObsidianEnhancerSettingTab(this.app, this));
  }

  async loadSettings(): Promise<void> {
    const data = await this.loadData();
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(data ?? {}),
    };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
