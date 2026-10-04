import React, { useRef, useState } from 'react';
import { Minus, Square, X, Move } from 'lucide-react';
import { WindowState } from '../types.ts';

interface WindowManagerProps {
  window: WindowState;
  isActive: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onUpdatePosition: (x: number, y: number) => void;
  onUpdateSize: (width: number, height: number) => void;
  children: React.ReactNode;
}

export const WindowManager: React.FC<WindowManagerProps> = ({
  window: win,
  isActive,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onUpdatePosition,
  onUpdateSize,
  children,
}) => {
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, winX: 0, winY: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, winW: 0, winH: 0 });

  if (win.minimized) return null;

  const handleMouseDownHeader = (e: React.MouseEvent) => {
    if (win.maximized) return;
    onFocus();
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winX: win.x,
      winY: win.y,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = ev.clientX - dragStartRef.current.mouseX;
      const dy = ev.clientY - dragStartRef.current.mouseY;
      onUpdatePosition(
        Math.max(10, Math.min(window.innerWidth - 100, dragStartRef.current.winX + dx)),
        Math.max(10, Math.min(window.innerHeight - 80, dragStartRef.current.winY + dy))
      );
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFocus();
    isResizingRef.current = true;
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      winW: win.width,
      winH: win.height,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const dw = ev.clientX - resizeStartRef.current.mouseX;
      const dh = ev.clientY - resizeStartRef.current.mouseY;
      onUpdateSize(
        Math.max(380, resizeStartRef.current.winW + dw),
        Math.max(260, resizeStartRef.current.winH + dh)
      );
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const style = win.maximized
    ? { top: 0, left: 0, width: '100vw', height: 'calc(100vh - 48px)', zIndex: win.zIndex }
    : { top: win.y, left: win.x, width: win.width, height: win.height, zIndex: win.zIndex };

  return (
    <div
      style={style}
      onClick={onFocus}
      className={`fixed flex flex-col rounded-xl overflow-hidden border transition-shadow duration-150 backdrop-blur-xl ${
        isActive
          ? 'border-cyan-500/50 shadow-2xl shadow-cyan-950/50 ring-1 ring-cyan-500/30 bg-[#0b0e14]/95'
          : 'border-slate-800/80 shadow-lg shadow-black/60 bg-[#090b10]/90'
      }`}
    >
      {/* Title Bar */}
      <div
        onMouseDown={handleMouseDownHeader}
        className={`h-9 px-3 flex items-center justify-between border-b select-none cursor-move ${
          isActive
            ? 'bg-gradient-to-r from-slate-900/90 via-[#0d1424]/90 to-slate-900/90 border-cyan-500/20 text-cyan-300'
            : 'bg-slate-950/80 border-slate-800/60 text-slate-400'
        }`}
      >
        <div className="flex items-center space-x-2 truncate">
          <span className="text-xs font-mono font-medium tracking-wide flex items-center space-x-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-cyan-400/80 animate-pulse" />
            <span className="truncate">{win.title}</span>
          </span>
        </div>

        {/* Window Controls */}
        <div className="flex items-center space-x-1" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={onMinimize}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-800/70 text-slate-400 hover:text-slate-200 transition"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleMaximize}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-800/70 text-slate-400 hover:text-slate-200 transition"
            title={win.maximized ? 'Restore' : 'Maximize'}
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500/80 hover:text-white text-slate-400 transition"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Window Body */}
      <div className="flex-1 overflow-hidden relative text-slate-200">{children}</div>

      {/* Resize Handle */}
      {!win.maximized && (
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-slate-600 hover:text-cyan-400"
        >
          <svg className="w-2.5 h-2.5" viewBox="0 0 6 6" fill="currentColor">
            <circle cx="5" cy="5" r="0.8" />
            <circle cx="3" cy="5" r="0.8" />
            <circle cx="5" cy="3" r="0.8" />
          </svg>
        </div>
      )}
    </div>
  );
};
