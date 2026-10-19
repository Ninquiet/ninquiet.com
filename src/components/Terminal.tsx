import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { applyPalette, isPalette } from '../lib/palette';
import { complete, execute } from '../lib/terminal/shell';
import type { Line, ProjectEntry, Segment, TerminalContext } from '../lib/terminal/types';
import styles from './Terminal.module.css';

interface Props {
  projects: ProjectEntry[];
  intro?: string;
}

const MAX_LINES = 200;

function SegmentView({ segment }: { segment: Segment }) {
  if (typeof segment === 'string') return <>{segment}</>;
  const className = segment.tone ? styles[segment.tone] : undefined;
  if (segment.href) {
    return (
      <a className={className} href={segment.href}>
        {segment.text}
      </a>
    );
  }
  return <span className={className}>{segment.text}</span>;
}

export default function Terminal({ projects, intro = 'whoami' }: Props) {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(true);
  const history = useRef<string[]>([]);
  const historyIndex = useRef(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  const ctx = useMemo<TerminalContext>(
    () => ({
      projects,
      navigate: (href) => window.setTimeout(() => window.location.assign(href), 450),
      setPalette: (name) => {
        if (!isPalette(name)) return false;
        applyPalette(name);
        return true;
      },
    }),
    [projects],
  );

  const run = useCallback(
    (raw: string) => {
      const command = raw.trim();
      const echo: Line = [{ text: '❯ ', tone: 'k' }, command];
      if (!command) {
        setLines((prev) => [...prev, echo].slice(-MAX_LINES));
        return;
      }
      history.current = [command, ...history.current.filter((entry) => entry !== command)].slice(0, 50);
      historyIndex.current = -1;
      const output = execute(command, ctx);
      if (output === 'clear') {
        setLines([]);
        return;
      }
      setLines((prev) => [...prev, echo, ...output].slice(-MAX_LINES));
    },
    [ctx],
  );

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hint: Line = [{ text: 'type ', tone: 'd' }, { text: 'help', tone: 'k' }, { text: ' to explore', tone: 'd' }];
    if (reduced) {
      run(intro);
      setLines((prev) => [...prev, hint]);
      setBusy(false);
      return;
    }
    let i = 0;
    let typing = 0;
    const start = window.setTimeout(() => {
      typing = window.setInterval(() => {
        i++;
        setInput(intro.slice(0, i));
        if (i >= intro.length) {
          window.clearInterval(typing);
          window.setTimeout(() => {
            run(intro);
            setInput('');
            setLines((prev) => [...prev, hint]);
            setBusy(false);
          }, 250);
        }
      }, 70);
    }, 500);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(typing);
    };
  }, [intro, run]);

  useEffect(() => {
    const screen = screenRef.current;
    if (screen) screen.scrollTop = screen.scrollHeight;
  }, [lines]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (busy) {
      event.preventDefault();
      return;
    }
    if (event.key === 'Enter') {
      run(input);
      setInput('');
    } else if (event.key === 'Tab') {
      event.preventDefault();
      setInput((value) => complete(value, ctx));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const next = Math.min(historyIndex.current + 1, history.current.length - 1);
      if (next >= 0) {
        historyIndex.current = next;
        setInput(history.current[next]);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = historyIndex.current - 1;
      historyIndex.current = Math.max(next, -1);
      setInput(next >= 0 ? history.current[next] : '');
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      setLines([]);
    }
  };

  return (
    <section className={styles.root} aria-label="Interactive terminal" onClick={() => inputRef.current?.focus()}>
      <div className={styles.title}>
        <span>ninquiet@portfolio: ~</span>
        <span aria-hidden="true">● ● ●</span>
      </div>
      <div ref={screenRef} className={styles.screen} role="log" aria-live="polite">
        {lines.map((line, index) => (
          <div key={index} className={styles.line}>
            {line.map((segment, i) => (
              <SegmentView key={i} segment={segment} />
            ))}
          </div>
        ))}
      </div>
      <label className={styles.prompt}>
        <span className={styles.k} aria-hidden="true">
          ❯
        </span>
        <span className="sr-only">Terminal command</span>
        <input
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={busy ? '' : 'type help'}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </label>
    </section>
  );
}
