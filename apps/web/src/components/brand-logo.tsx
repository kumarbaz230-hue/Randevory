import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'auto';
  showSlogan?: boolean;
  showBadge?: boolean;
  href?: string;
  className?: string;
}

export function BrandLogo({
  size = 'md',
  variant = 'auto',
  showSlogan = false,
  showBadge = false,
  href = '/',
  className = '',
}: BrandLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs rounded-lg',
    md: 'w-9 h-9 text-sm rounded-xl',
    lg: 'w-11 h-11 text-base rounded-xl',
    xl: 'w-14 h-14 text-xl rounded-2xl',
  };

  const textSizes = {
    sm: 'text-base font-extrabold',
    md: 'text-xl font-black tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
    xl: 'text-3xl font-black tracking-tight',
  };

  const sloganSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  const content = (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Modern RANDEVORY Emblem */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center shrink-0 bg-gradient-to-br from-brand-600 via-blue-600 to-indigo-700 text-white font-black shadow-md shadow-brand-500/25 ring-1 ring-white/20`}
      >
        {/* Subtle geometric backdrop */}
        <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent pointer-events-none" />
        {/* Modern Stylized R */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5 drop-shadow-sm"
        >
          <path
            d="M6 4.5H13C15.4853 4.5 17.5 6.51472 17.5 9C17.5 11.4853 15.4853 13.5 13 13.5H6V4.5Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 13.5V19.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M12.5 13.5L17.5 19.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="13" cy="9" r="1.5" fill="currentColor" />
        </svg>
      </div>

      {/* Brand Typography & Slogan */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`${textSizes[size]} ${
              variant === 'dark' ? 'text-white' : 'text-slate-900'
            }`}
          >
            RANDEV<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">ORY</span>
          </span>

          {showBadge && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
              PRO
            </span>
          )}
        </div>

        {showSlogan && (
          <span
            className={`${sloganSizes[size]} font-medium text-slate-500 mt-0.5 tracking-tight`}
          >
            İşini kolaylaştır, zamanını kazan.
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
