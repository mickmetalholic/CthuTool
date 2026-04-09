import boxen from 'boxen';
import pc from 'picocolors';

export type WelcomePanelModel = {
  readonly title: string;
  readonly body: string;
};

export const defaultWelcomePanel: WelcomePanelModel = {
  title: 'CthuTool CLI Demo',
  body: 'Type your name to get a personalized greeting.',
};

const colorize = (text: string): string => {
  if (!pc.isColorSupported) {
    return text;
  }
  return pc.cyan(text);
};

export const renderWelcomePanel = (
  panel: WelcomePanelModel = defaultWelcomePanel,
): string => {
  const rendered = boxen(`${colorize(panel.title)}\n${panel.body}`, {
    borderStyle: 'round',
    borderColor: pc.isColorSupported ? 'cyan' : 'white',
    padding: 1,
  });
  if (!rendered.includes(panel.body)) {
    throw new Error('welcome panel readability assertion failed');
  }
  return rendered;
};
