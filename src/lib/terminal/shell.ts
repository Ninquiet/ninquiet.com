import { COMMANDS, resolveCommand } from './commands';
import type { CommandOutput, TerminalContext } from './types';

export function tokenize(input: string): string[] {
  return input.trim().split(/\s+/).filter(Boolean);
}

export function execute(input: string, ctx: TerminalContext): CommandOutput {
  const [name, ...args] = tokenize(input.toLowerCase());
  if (!name) return [];
  const command = resolveCommand(name);
  if (!command) {
    return [[{ text: `command not found: ${name}`, tone: 'p' }, '. try ', { text: 'help', tone: 'k' }]];
  }
  return command.run(args, ctx);
}

export function complete(input: string, ctx: TerminalContext): string {
  const endsWithSpace = /\s$/.test(input);
  const tokens = tokenize(input);
  if (tokens.length === 0) return input;

  if (tokens.length === 1 && !endsWithSpace) {
    const names = COMMANDS.filter((command) => !command.hidden).flatMap((command) => [command.name, ...(command.aliases ?? [])]);
    return completeToken(tokens[0], names, (match) => `${match} `) ?? input;
  }

  const command = resolveCommand(tokens[0].toLowerCase());
  const candidates = command?.complete?.(ctx) ?? [];
  const partial = endsWithSpace ? '' : tokens[tokens.length - 1];
  const head = endsWithSpace ? tokens : tokens.slice(0, -1);
  return completeToken(partial, candidates, (match) => [...head, match].join(' ')) ?? input;
}

function completeToken(partial: string, candidates: string[], build: (match: string) => string): string | null {
  const matches = candidates.filter((candidate) => candidate.startsWith(partial.toLowerCase()));
  if (matches.length === 0) return null;
  if (matches.length === 1) return build(matches[0]);
  const prefix = matches.reduce((acc, value) => {
    let i = 0;
    while (i < acc.length && acc[i] === value[i]) i++;
    return acc.slice(0, i);
  });
  return prefix.length > partial.length ? build(prefix).trimEnd() : null;
}
