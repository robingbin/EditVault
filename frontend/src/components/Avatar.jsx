import React from "react";
import { cn } from "../lib/utils";

const palette = {
  A: "bg-teal-500/20 text-teal-300 border-teal-500/40",
  X: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  G: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  U: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  T: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
};

export default function Avatar({ name, size = 44, className = "" }) {
  const letter = (name || "?").charAt(0).toUpperCase();
  const color = palette[letter] || "bg-[#143a37] text-[#2dd4bf] border-[#1f5450]";
  return (
    <div
      className={cn(
        "rounded-xl border flex items-center justify-center font-semibold shrink-0",
        color,
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {letter}
    </div>
  );
}
