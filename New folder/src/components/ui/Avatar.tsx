import React from 'react';

export interface AvatarProps {
  name: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  avatarUrl?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  color = '#3B82F6',
  size = 'md',
  avatarUrl,
  className = '',
}) => {
  const getInitials = (str: string) => {
    if (!str) return '?';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
    xl: 'w-14 h-14 text-base font-semibold',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full font-medium text-white shrink-0 select-none overflow-hidden ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: color }}
      title={name}
      aria-label={name}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};
