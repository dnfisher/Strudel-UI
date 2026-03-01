import { useState } from 'react';

interface CodePreviewProps {
  code: string;
}

export function CodePreview({ code }: CodePreviewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="border-t border-white/10 bg-[#0d0d14]">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30">{isOpen ? '▼' : '▶'}</span>
          <span className="text-xs font-medium text-white/50">Generated Strudel Code</span>
        </div>
        {isOpen && (
          <span
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="text-[10px] text-white/30 hover:text-white/60 cursor-pointer px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </span>
        )}
      </button>

      {/* Code */}
      {isOpen && (
        <pre className="px-4 pb-3 pt-0 text-xs leading-relaxed font-mono text-emerald-400/80 overflow-x-auto whitespace-pre-wrap">
          {code || '// Add some steps to get started!'}
        </pre>
      )}
    </div>
  );
}
