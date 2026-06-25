import { vi } from 'vitest';

type TextControl = {
  onChange: ReturnType<typeof vi.fn>;
  setPlaceholder: ReturnType<typeof vi.fn>;
  setValue: ReturnType<typeof vi.fn>;
  triggerChange?: (value: string) => Promise<void>;
};

export type FakeSetting = {
  desc?: string;
  name?: string;
  text?: TextControl;
};

export const obsidianMock = {
  notices: [] as string[],
  parseFrontMatterTags: vi.fn(),
  settings: [] as FakeSetting[],
};

export class Notice {
  constructor(message: string) {
    obsidianMock.notices.push(message);
  }
}

export const parseFrontMatterTags = obsidianMock.parseFrontMatterTags;

export class PluginSettingTab {
  constructor(
    readonly app: unknown,
    readonly plugin: unknown,
  ) {}
}

export class Setting {
  private readonly record: FakeSetting;

  constructor() {
    this.record = {};
    obsidianMock.settings.push(this.record);
  }

  setName(name: string): this {
    this.record.name = name;
    return this;
  }

  setDesc(desc: string): this {
    this.record.desc = desc;
    return this;
  }

  addText(callback: (text: TextControl) => void): this {
    const text: TextControl = {
      onChange: vi.fn((handler: (value: string) => Promise<void>) => {
        text.triggerChange = handler;
        return text;
      }),
      setPlaceholder: vi.fn(() => text),
      setValue: vi.fn(() => text),
    };
    this.record.text = text;
    callback(text);
    return this;
  }
}
