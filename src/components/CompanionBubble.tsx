import { useEffect, useRef, useState } from "react";

export type CompanionPanel = {
  id: string;
  /** Plugin id that opened it (cleaned up when the plugin is disabled). */
  owner?: string;
  html: string;
  speech?: string;
  /** Live state pushed into the iframe via postMessage (no reload). */
  state?: Record<string, unknown>;
  /** Frame size in CSS px (default 150×100). Use ~320×180 for video PiP. */
  width?: number;
  height?: number;
  /** Nested media embeds (YouTube). Looser sandbox + iframe allow. */
  allowMedia?: boolean;
};

type Props = {
  companions: CompanionPanel[];
  onClose: (id: string) => void;
  /** Return keyboard focus to the editor (media iframes steal keys otherwise). */
  onFocusEditor?: () => void;
};

type Pos = { x: number; y: number };

function clampPos(x: number, y: number, w: number, h: number): Pos {
  const pad = 8;
  const maxX = Math.max(pad, window.innerWidth - w - pad);
  const maxY = Math.max(pad, window.innerHeight - h - pad);
  return {
    x: Math.min(maxX, Math.max(pad, x)),
    y: Math.min(maxY, Math.max(pad, y)),
  };
}

function Buddy({
  panel,
  index,
  onClose,
  onFocusEditor,
}: {
  panel: CompanionPanel;
  index: number;
  onClose: (id: string) => void;
  onFocusEditor?: () => void;
}) {
  const frame = useRef<HTMLIFrameElement | null>(null);
  const root = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(panel.state);
  stateRef.current = panel.state;
  const focusEditorRef = useRef(onFocusEditor);
  focusEditorRef.current = onFocusEditor;

  const w = panel.width ?? 150;
  const h = panel.height ?? 100;
  const pip = Boolean(panel.allowMedia) || w >= 240;
  // PiP keeps a slim grab edge so the video stays clickable; buddies drag anywhere.
  const grabH = pip ? 10 : 0;

  const [pos, setPos] = useState<Pos>(() =>
    clampPos(
      window.innerWidth - w - 16,
      window.innerHeight - (h + grabH) - 48 - index * (h + grabH + 12),
      w,
      h + grabH,
    ),
  );
  const [dragging, setDragging] = useState(false);
  const [z, setZ] = useState(40 + index);
  const drag = useRef<{
    ox: number;
    oy: number;
    sx: number;
    sy: number;
  } | null>(null);

  const push = () => {
    const win = frame.current?.contentWindow;
    if (win && stateRef.current) {
      win.postMessage({ type: "nppx:companion", state: stateRef.current }, "*");
    }
  };

  useEffect(push, [panel.state]);

  // Media embeds keep focus after a click and swallow every keybinding.
  // Blur them after the click lands so typing stays in Monaco.
  useEffect(() => {
    if (!panel.allowMedia) return;
    const release = () => {
      const f = frame.current;
      if (!f || document.activeElement !== f) return;
      f.blur();
      focusEditorRef.current?.();
    };
    const onFocusIn = (e: FocusEvent) => {
      if (e.target === frame.current) window.setTimeout(release, 200);
    };
    document.addEventListener("focusin", onFocusIn);
    const iv = window.setInterval(release, 350);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      window.clearInterval(iv);
    };
  }, [panel.allowMedia]);

  useEffect(() => {
    const onResize = () =>
      setPos((p) => clampPos(p.x, p.y, w, h + grabH));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [w, h, grabH]);

  const beginDrag = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest(".companion-close")) return;
    e.preventDefault();
    setZ(Date.now() % 100000);
    setDragging(true);
    drag.current = { ox: pos.x, oy: pos.y, sx: e.clientX, sy: e.clientY };
    root.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setPos(
      clampPos(
        d.ox + (e.clientX - d.sx),
        d.oy + (e.clientY - d.sy),
        w,
        h + grabH,
      ),
    );
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    try {
      root.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  return (
    <div
      ref={root}
      className={
        "companion-bubble" +
        (pip ? " companion-pip" : " companion-buddy") +
        (dragging ? " dragging" : "")
      }
      style={{ width: w, left: pos.x, top: pos.y, zIndex: z }}
      title="Drag to move"
      onPointerDown={pip ? undefined : beginDrag}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {pip ? (
        <div
          className="companion-grab"
          aria-hidden="true"
          title="Drag to move"
          onPointerDown={beginDrag}
        />
      ) : null}
      <button
        type="button"
        className="companion-close"
        aria-label={`Dismiss ${panel.id}`}
        onClick={() => onClose(panel.id)}
      >
        ×
      </button>
      {panel.speech ? (
        <div className="companion-speech">{panel.speech}</div>
      ) : null}
      <iframe
        ref={frame}
        className="companion-frame"
        title={panel.id}
        tabIndex={-1}
        style={{ width: w, height: h }}
        sandbox={
          panel.allowMedia
            ? "allow-scripts allow-same-origin allow-presentation allow-popups"
            : "allow-scripts"
        }
        allow={
          panel.allowMedia
            ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            : undefined
        }
        srcDoc={panel.html}
        referrerPolicy="no-referrer"
        onLoad={push}
      />
    </div>
  );
}

/** Freely draggable floating buddies / PiP players. */
export function CompanionBubble({ companions, onClose, onFocusEditor }: Props) {
  if (!companions.length) return null;
  return (
    <div className="companion-layer" aria-live="polite">
      {companions.map((c, i) => (
        <Buddy
          key={c.id}
          panel={c}
          index={i}
          onClose={onClose}
          onFocusEditor={onFocusEditor}
        />
      ))}
    </div>
  );
}
