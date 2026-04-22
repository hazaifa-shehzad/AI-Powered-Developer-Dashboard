"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={150}>{children}</TooltipPrimitive.Provider>;
}

export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ children, sideOffset = 8 }: { children: React.ReactNode; sideOffset?: number }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className="z-50 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-white dark:fill-slate-950" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
