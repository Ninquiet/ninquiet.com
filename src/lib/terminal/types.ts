export type Tone = 'k' | 'p' | 'd';

export type Segment = string | { text: string; tone?: Tone; href?: string };

export type Line = Segment[];

export interface ProjectEntry {
  slug: string;
  title: string;
  category: string;
  extension: string;
  year: number;
}

export interface TerminalContext {
  projects: ProjectEntry[];
  navigate: (href: string, label?: string) => void;
  setPalette: (name: string) => boolean;
}

export type CommandOutput = Line[] | 'clear';

export interface Command {
  name: string;
  aliases?: string[];
  summary: string;
  hidden?: boolean;
  run: (args: string[], ctx: TerminalContext) => CommandOutput;
  complete?: (ctx: TerminalContext) => string[];
}
