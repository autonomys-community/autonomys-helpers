import React, { useState, useCallback } from 'react';

interface CopyableTextProps {
  text: string;
  displayText?: string;
  className?: string;
}

const CopyableText: React.FC<CopyableTextProps> = ({ text, displayText, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [text]);

  return (
    <span
      role="button"
      tabIndex={0}
      className={`${className}`}
      title={copied ? 'Copied!' : `Click to copy: ${text}`}
      onClick={handleCopy}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCopy(); }}
      style={{ cursor: 'pointer' }}
    >
      {displayText ?? text}
      {copied ? (
        <svg
          className="ms-1"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ verticalAlign: 'middle', color: '#198754' }}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          className="ms-1"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ verticalAlign: 'middle', opacity: 0.5 }}
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </span>
  );
};

export default CopyableText;
