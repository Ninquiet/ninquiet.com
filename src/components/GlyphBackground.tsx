import { useEffect, useRef } from 'react';
import { GlyphField } from '../lib/glyphField';
import { PALETTE_EVENT, readAccents } from '../lib/palette';

export default function GlyphBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    const field = new GlyphField(canvas, readAccents());

    const resizeObserver = new ResizeObserver(() => field.resize());
    resizeObserver.observe(canvas);
    field.resize();

    const visibility = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) field.start();
      else field.stop();
    });
    visibility.observe(canvas);

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      field.setPointer(event.clientX - rect.left, event.clientY - rect.top);
    };
    const onLeave = () => field.clearPointer();
    const onPalette = () => field.setAccents(readAccents());

    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    window.addEventListener(PALETTE_EVENT, onPalette);

    return () => {
      field.stop();
      resizeObserver.disconnect();
      visibility.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      window.removeEventListener(PALETTE_EVENT, onPalette);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
