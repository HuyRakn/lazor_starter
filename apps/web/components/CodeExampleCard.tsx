'use client';

interface CodeExampleCardProps {
  title: string;
  description: string;
  code: string;
  language?: 'typescript' | 'javascript';
}

export function CodeExampleCard({ title, description, code, language = 'typescript' }: CodeExampleCardProps) {
  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-5 space-y-3 flex flex-col shadow-2xl" style={{ maxHeight: 'calc(100vh - 80px)' }}>
      <div className="flex-shrink-0">
        <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>
        <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{description}</p>
      </div>
      <div className="flex-1 min-h-0 bg-black/80 rounded-lg p-3.5 overflow-hidden border border-white/10 shadow-inner">
        <pre className="text-xs text-gray-200 font-mono leading-relaxed h-full overflow-y-auto custom-scrollbar">
          <code className="block whitespace-pre-wrap break-words">{code}</code>
        </pre>
      </div>
    </div>
  );
}

