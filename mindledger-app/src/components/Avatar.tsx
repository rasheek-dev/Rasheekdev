import React from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, className = 'w-8 h-8 text-[11px]' }) => {
  if (src) {
    return <img src={src} alt={name} className={`${className} rounded-full object-cover border border-slate-200 shrink-0`} />;
  }
  const initials = name
    .replace(/^(dr|mr|mrs|ms)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return (
    <div
      className={`${className} rounded-full bg-[#f4f3fe] text-[#392cb3] border border-[#d4d0fb] font-bold flex items-center justify-center shrink-0`}
      aria-label={name}
    >
      {initials || '?'}
    </div>
  );
};
