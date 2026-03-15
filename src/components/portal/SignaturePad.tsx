"use client";

import { useRef, useEffect, useState } from "react";

type SignaturePadProps = {
  onCapture: (dataUrl: string) => void;
  onClear?: () => void;
  width?: number;
  height?: number;
};

export function SignaturePad({ onCapture, onClear, width = 400, height = 150 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasDrawn(true);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endDraw() {
    setIsDrawing(false);
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas!.width, canvas!.height);
    setHasDrawn(false);
    onClear?.();
  }

  function capture() {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL("image/png");
    onCapture(dataUrl);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border-2 border-dashed border-border bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block cursor-crosshair touch-none"
          style={{ width: "100%", maxWidth: width, height: "auto", aspectRatio: `${width}/${height}` }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="text-sm text-muted hover:text-white"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={capture}
          disabled={!hasDrawn}
          className="text-sm text-primary-light hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Use signature
        </button>
      </div>
    </div>
  );
}
