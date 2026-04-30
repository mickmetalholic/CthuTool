import { type App, PluginSettingTab, Setting } from 'obsidian';
import type ObsidianEnhancerPlugin from './main';

export class ObsidianEnhancerSettingTab extends PluginSettingTab {
  private readonly plugin: ObsidianEnhancerPlugin;

  constructor(app: App, plugin: ObsidianEnhancerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Vocabulary Tag')
      .setDesc('Only notes with this frontmatter tag can be opened in Eudic.')
      .addText((text) =>
        text
          .setPlaceholder('vocabulary')
          .setValue(this.plugin.settings.vocabularyTag)
          .onChange(async (value) => {
            this.plugin.settings.vocabularyTag = value.trim() || 'vocabulary';
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Excluded Root Folders')
      .setDesc('Comma separated root folders ignored by Auto Move.')
      .addText((text) =>
        text
          .setPlaceholder('config,Notes,attachments')
          .setValue(this.plugin.settings.excludedRootsCsv)
          .onChange(async (value) => {
            this.plugin.settings.excludedRootsCsv = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
