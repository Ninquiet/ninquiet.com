import { PROFILE } from '../../data/profile';
import { PALETTES } from '../palette';
import type { Command, Line, ProjectEntry, TerminalContext } from './types';

const k = (text: string, href?: string) => ({ text, tone: 'k' as const, href });
const p = (text: string) => ({ text, tone: 'p' as const });
const d = (text: string) => ({ text, tone: 'd' as const });

const projectLabel = (project: ProjectEntry) =>
  project.extension === '/' ? `${project.slug}/` : `${project.slug}${project.extension}`;

const findProject = (ctx: TerminalContext, query: string) => {
  const needle = query.replace(/\/$/, '').replace(/\.\w+$/, '').toLowerCase();
  return ctx.projects.find((project) => project.slug === needle);
};

const bar = (filled: number) => '█'.repeat(filled) + '░'.repeat(10 - filled);

const help: Command = {
  name: 'help',
  summary: 'list available commands',
  run: (_args, ctx) => [
    ['available commands:'],
    ...COMMANDS.filter((command) => !command.hidden).map<Line>((command) => [
      '  ',
      k(command.name.padEnd(14)),
      d(command.summary),
    ]),
    [d('tip: tab autocompletes, arrows browse history. ' + `${ctx.projects.length} projects loaded.`)],
  ],
};

const whoami: Command = {
  name: 'whoami',
  summary: 'who is this person',
  run: () => [
    [PROFILE.name.toLowerCase()],
    [d(`${PROFILE.role} @ ${PROFILE.company} (prague, remote)`)],
    [d('designer turned engineer. builds worlds in vr and tools for agents.')],
  ],
};

const ls: Command = {
  name: 'ls',
  summary: 'list projects (ls <category>)',
  run: (args, ctx) => {
    const filter = args.find((arg) => !arg.startsWith('-') && arg !== 'projects' && arg !== '~/projects');
    const items = filter ? ctx.projects.filter((project) => project.category === filter) : ctx.projects;
    if (items.length === 0) {
      const categories = [...new Set(ctx.projects.map((project) => project.category))].join(' ');
      return [[p(`ls: no projects in '${filter}'.`)], [d(`categories: ${categories}`)]];
    }
    return items.map<Line>((project) => [
      d(`${project.year}  `),
      k(projectLabel(project), `/projects/${project.slug}/`),
      d(`  ${project.category}`),
    ]);
  },
  complete: (ctx) => [...new Set(ctx.projects.map((project) => project.category))],
};

const open: Command = {
  name: 'open',
  aliases: ['cd', 'cat'],
  summary: 'open a project (open <name>)',
  run: (args, ctx) => {
    const target = args[0];
    if (!target) return [[p('usage: open <project>')], [d("try 'ls' to see names")]];
    if (target === 'about' || target === 'about.md') return about.run([], ctx);
    if (target === '~' || target === '/' || target === '..') {
      ctx.navigate('/', '~');
      return [[d('cd ~')]];
    }
    if (target === 'projects' || target === '~/projects') {
      ctx.navigate('/projects/', '~/projects');
      return [[d('opening ~/projects ...')]];
    }
    const project = findProject(ctx, target);
    if (!project) return [[p(`no such project: ${target}`)]];
    ctx.navigate(`/projects/${project.slug}/`, projectLabel(project));
    return [[d('opening '), k(projectLabel(project)), d(' ...')]];
  },
  complete: (ctx) => ctx.projects.map((project) => project.slug),
};

const about: Command = {
  name: 'about',
  summary: 'the longer story',
  run: () => [
    ['started in systemic design, fell into code, never climbed out.'],
    [`${PROFILE.years} years shipping unity + xr, web, games,`],
    ['and lately agents that work together.'],
    ['custom gpts used by ', k('400k+'), ' people.'],
  ],
};

const skills: Command = {
  name: 'skills',
  summary: "what i'm good at",
  run: () => [
    [k(bar(10)), ' c# / unity / vr'],
    [k(bar(9)), ' shaders / vfx / performance'],
    [k(bar(8)), ' solid / clean code / git'],
    [k(bar(7)), ' react / typescript ', d('(personal projects)')],
    [k(bar(4)), ' python ', d('(basic)')],
  ],
};

const contact: Command = {
  name: 'contact',
  summary: 'say hi',
  run: () => [
    ['mail     ', k(PROFILE.email, `mailto:${PROFILE.email}`)],
    ['github   ', k('github.com/Ninquiet', PROFILE.github)],
    ['gitlab   ', k('gitlab.com/Ninquiet', PROFILE.gitlab)],
    ['linkedin ', k('linkedin.com/in/ninquiet', PROFILE.linkedin)],
  ],
};

const cv: Command = {
  name: 'cv',
  summary: 'download my cv (pdf)',
  run: () => [['downloading ', k('cv.pdf', PROFILE.cv)], [d('click the link if it does not start on its own')]],
};

const reel: Command = {
  name: 'reel',
  aliases: ['play', './reel.sh', 'insert-coin'],
  summary: 'insert coin: my 60s highlight reel',
  run: (_args, ctx) => {
    ctx.openReel();
    return [[d('inserting coin ...')], [k('CREDIT 01'), d('  loading reel.mp4 '), k(bar(10))]];
  },
};

const sudo: Command = {
  name: 'sudo',
  summary: 'try: sudo hire-me',
  run: (args) => {
    if (args[0] !== 'hire-me') return [[p('nice try. this incident will be reported.')]];
    return [
      ['[sudo] password for recruiter: ********'],
      [k('access granted.'), ' running ./contact.sh ...'],
      ['> ', k(PROFILE.email, `mailto:${PROFILE.email}`)],
      ['> ', k('cv.pdf', PROFILE.cv)],
    ];
  },
};

const theme: Command = {
  name: 'theme',
  summary: `switch colors (${PALETTES.join(' | ')})`,
  run: (args, ctx) => {
    const name = args[0];
    if (!name) return [[d(`usage: theme <${PALETTES.join(' | ')}>`)]];
    return ctx.setPalette(name) ? [[k(`theme set to ${name}`)]] : [[p(`unknown theme: ${name}`)]];
  },
  complete: () => [...PALETTES],
};

const clear: Command = { name: 'clear', summary: 'clear the screen', run: () => 'clear' };

const echo: Command = { name: 'echo', summary: 'print text', hidden: true, run: (args) => [[args.join(' ')]] };

const rm: Command = {
  name: 'rm',
  summary: 'remove files',
  hidden: true,
  run: () => [[p('rm: permission denied. the portfolio stays.')]],
};

export const COMMANDS: Command[] = [help, whoami, ls, open, about, skills, contact, cv, reel, sudo, theme, clear, echo, rm];

export function resolveCommand(name: string): Command | undefined {
  return COMMANDS.find((command) => command.name === name || command.aliases?.includes(name));
}
