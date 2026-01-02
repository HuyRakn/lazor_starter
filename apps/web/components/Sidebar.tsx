'use client';

import { useState } from 'react';
import { Card } from '@lazor-starter/ui';

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  component: React.ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
  defaultActive?: string;
}

export function Sidebar({ items, defaultActive }: SidebarProps) {
  const [activeItem, setActiveItem] = useState<string>(defaultActive || items[0]?.id || '');

  const currentItem = items.find(item => item.id === activeItem);

  return (
    <div className="flex gap-4 h-full">
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0">
        <div className="sticky top-8 space-y-2">
          {items.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveItem(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  isActive
                    ? 'bg-white/10 border border-white/20 text-white shadow-lg'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/8 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <Card className="p-6 md:p-8 h-full">
          {currentItem?.component || (
            <div className="text-center text-gray-400 py-12">
              Select a function from the sidebar
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}


