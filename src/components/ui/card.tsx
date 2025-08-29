import React from "react";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className = "", children }: CardProps) {
  const classes = `rounded-lg border bg-white text-slate-950 shadow-sm ${className}`;
  
  return <div className={classes}>{children}</div>;
}

export function CardContent({ className = "", children }: CardProps) {
  const classes = `p-6 pt-0 ${className}`;
  
  return <div className={classes}>{children}</div>;
} 