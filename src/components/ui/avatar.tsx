import React from "react";

interface AvatarProps {
  className?: string;
  children: React.ReactNode;
}

export function Avatar({ className = "", children }: AvatarProps) {
  const classes = `relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`;
  
  return <div className={classes}>{children}</div>;
}

export function AvatarFallback({ className = "", children }: AvatarProps) {
  const classes = `flex h-full w-full items-center justify-center rounded-full bg-slate-100 ${className}`;
  
  return <div className={classes}>{children}</div>;
} 