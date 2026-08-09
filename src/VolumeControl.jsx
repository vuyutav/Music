import { useState, useRef, useEffect, useCallback } from 'react';

function volumeLabel(value) {
  return `${Math.round(value * 100)}%`;
}

export default function VolumeControl({ volume, onChange }) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const panelRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const setFromPointer = useCallback((clientY) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const pct = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    onChange(pct);
  }, [onChange]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => setFromPointer(e.clientY);
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, setFromPointer]);

  const muted = volume === 0;
  const fillPct = volume * 100;

  return (
    <div className="volume-control" ref={panelRef}>
      <button
        type="button"
        className={`volume-toggle ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        title={`Volume: ${volumeLabel(volume)}`}
        aria-label={`Volume ${volumeLabel(volume)}`}
        aria-expanded={open}
      >
        <span className={`volume-icon ${muted ? 'muted' : ''}`} />
        <span className="volume-toggle-label">{muted ? 'mute' : 'vol'}</span>
      </button>

      {open && (
        <div className="volume-dropdown">
          <div className="volume-dropdown-label">volume</div>
          <div
            className="volume-track"
            ref={trackRef}
            onPointerDown={(e) => {
              e.preventDefault();
              setDragging(true);
              setFromPointer(e.clientY);
            }}
          >
            <div className="volume-track-bg" />
            <div className="volume-track-fill" style={{ height: `${fillPct}%` }} />
            <div
              className="volume-thumb"
              style={{ bottom: `calc(${fillPct}% - calc(3 / 306 * 100vw))` }}
            />
          </div>
          <div className="volume-value">{volumeLabel(volume)}</div>
        </div>
      )}
    </div>
  );
}
