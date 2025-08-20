import React from "react";

export default function ProgressBar({ value, goal }: { value: number; goal: number }) {
  const pct = Math.min(100, Math.max(0, (value / goal) * 100));
  const over = value > goal;
  const near = !over && pct >= 90;
  const barColor = over ? "bg-calai-error" : near ? "bg-calai-warn" : "bg-calai-secondary";
  const label = over ? `Over by ${Math.round(value - goal)} cal` : `${Math.round(goal - value)} cal remaining`;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-slate-600 mb-1">
        <span>{Math.round(value)} / {goal} cal</span>
        <span>{label}</span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
        <div style={{ width: `${pct}%` }} className={`h-full ${barColor} transition-all`} />
      </div>
    </div>
  );
}
