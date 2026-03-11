import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'light' | 'dark' | 'colored';
}

export function GlassCard({ children, className, onClick, variant = 'light' }: GlassCardProps) {
  // REDESIGNED: Matches Landing Page "Vibe"
  // Solid White, Large Rounded Corners, Soft Shadow, No Glassmorphism
  const baseStyles = "rounded-[2rem] border transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1";
  
  const variants = {
    light: "bg-white border-slate-100",
    dark: "bg-slate-900 text-white border-slate-800", // Kept for fallback, but main vibe is light
    colored: "bg-rose-50 border-rose-100" // Soft pastel fallback
  };

  return (
    <div 
      onClick={onClick}
      className={twMerge(baseStyles, variants[variant], onClick && "cursor-pointer active:scale-[0.98]", className)}
    >
      {children}
    </div>
  );
}
