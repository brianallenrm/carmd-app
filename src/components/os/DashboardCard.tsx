import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'external';
  isLarge?: boolean;
}

export default function DashboardCard({
  title,
  description,
  href,
  icon: Icon,
  variant = 'secondary',
  isLarge = false,
}: DashboardCardProps) {
  const isExternal = variant === 'external';

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 transition-all duration-300 h-full",
        "border shadow-sm group cursor-pointer",
        variant === 'primary' 
          ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-100/50" 
          : variant === 'external'
            ? "bg-emerald-50/50 border-emerald-100 text-emerald-900 hover:bg-emerald-50"
            : "bg-white border-gray-100 text-gray-900 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50/50",
        isLarge ? "md:col-span-2" : ""
      )}
    >
      <Link 
        href={href} 
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="flex flex-col h-full"
      >
        <div className="flex items-start justify-between">
          <div className={cn(
            "p-3 rounded-xl transition-colors duration-300",
            variant === 'primary' ? "bg-white/10 ring-1 ring-white/30" : 
            variant === 'external' ? "bg-emerald-100 text-emerald-600" :
            "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
          )}>
            <Icon size={24} />
          </div>
          {isExternal && (
            <div className="text-emerald-500/50 group-hover:text-emerald-500 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </div>
          )}
        </div>
        
        <div className="mt-8">
          <h3 className={cn(
            "text-lg font-bold tracking-tight",
            variant === 'primary' ? "text-white" : "text-gray-900"
          )}>
            {title}
          </h3>
          <p className={cn(
            "mt-2 text-sm leading-relaxed",
            variant === 'primary' ? "text-blue-100" : "text-gray-500"
          )}>
            {description}
          </p>
        </div>

        {/* Action hint (visible on hover) */}
        <div className={cn(
          "mt-auto pt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0",
          variant === 'primary' ? "text-white/80" : 
          variant === 'external' ? "text-emerald-600" : "text-blue-600"
        )}>
          {isExternal ? "Abrir Documento" : "Entrar ahora"}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
        </div>
      </Link>
      
      {/* Decorative background circle */}
      <div className={cn(
        "absolute -right-8 -bottom-8 h-32 w-32 rounded-full blur-3xl transition-all duration-500 group-hover:scale-110",
        variant === 'primary' ? "bg-blue-400/30" : 
        variant === 'external' ? "bg-emerald-200/20" : "bg-blue-100/40"
      )} />
    </motion.div>
  );
}
