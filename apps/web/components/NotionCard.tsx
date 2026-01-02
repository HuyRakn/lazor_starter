'use client';

import Link from 'next/link';

interface NotionCardProps {
  icon: string;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  tags?: string[];
  color?: 'purple' | 'blue' | 'green' | 'pink' | 'yellow';
}

const colorClasses = {
  purple: 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10',
  blue: 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10',
  green: 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10',
  pink: 'border-pink-500/30 bg-pink-500/5 hover:bg-pink-500/10',
  yellow: 'border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10',
};

export function NotionCard({ 
  icon, 
  title, 
  description, 
  href, 
  onClick,
  tags = [],
  color = 'purple' 
}: NotionCardProps) {
  const content = (
    <div className={`group relative rounded-xl border p-4 transition-all cursor-pointer ${colorClasses[color]}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2">
            {description}
          </p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-xs rounded-md bg-white/5 text-gray-300 border border-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }

  return content;
}


