// Simple freehand drawing canvas modal used inline in the note editor.
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eraser, X } from "lucide-react";

const COLORS = ["#0f172a", "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];

export function DrawingModal({
  onClose, onSave,
}: { onClose: () => void; onSave: (blob: Blob) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(3);
  const [erase, setErase] = useState(false);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  function pos(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvasRef.current!.width / r.width),
      y: (e.clientY - r.top) * (canvasRef.current!.height / r.height),
    };
  }
  function down(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function move(e: React.PointerEvent) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.globalCompositeOperation = erase ? "destination-out" : "source-over";
    ctx.strokeStyle = color;
    ctx.lineWidth = size * (erase ? 4 : 1);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
  function up() { drawingRef.current = false; }

  function clear() {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
  }

  function save() {
    canvasRef.current!.toBlob((b) => {
      if (b) onSave(b);
    }, "image/png");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3" onClick={onClose}>
      <Card
        className="flex w-full max-w-2xl flex-col gap-3 p-3 sm:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Draw</p>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); setErase(false); }}
                aria-label={`color ${c}`}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${color === c && !erase ? "scale-110 border-foreground" : "border-transparent"}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground">Size</label>
            <input type="range" min={1} max={20} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-24" />
          </div>
          <Button size="sm" variant={erase ? "default" : "outline"} onClick={() => setErase((v) => !v)}>
            <Eraser className="mr-1 h-3.5 w-3.5" /> Erase
          </Button>
          <Button size="sm" variant="outline" onClick={clear}>Clear</Button>
          <div className="flex-1" />
          <Button size="sm" onClick={save} className="bg-gradient-primary text-primary-foreground">Insert</Button>
        </div>
        <canvas
          ref={canvasRef}
          width={960}
          height={640}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          className="w-full touch-none rounded-lg border border-border bg-white"
        />
      </Card>
    </div>
  );
}
