import React, { useEffect, useState } from 'react';
import posthog from 'posthog-js';

export const MobileWarningModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const check = () => {
      const hasTouchScreen = navigator.maxTouchPoints > 0;
      const isNarrowScreen = window.innerWidth < 768;
      const hasMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (hasMobileUA || (hasTouchScreen && isNarrowScreen)) {
        setIsOpen(true);

        posthog.capture('mobile_warning_modal_shown', {
          screen_width: window.innerWidth,
          user_agent: navigator.userAgent,
        });
      }
    };

    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isOpen) return null;

  const DESKTOP_LINK = 'https://aura0.app';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DESKTOP_LINK);
    } catch {
      // Fallback for mobile browsers
      const el = document.createElement('textarea');
      el.value = DESKTOP_LINK;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }

    posthog.capture('mobile_warning_link_copied');

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 pointer-events-none">
      <div className="bg-gray-900 rounded-lg shadow-xl p-6 mx-4 w-full max-w-md pointer-events-auto">
        <h2 className="text-lg font-semibold text-gray-50 mb-2">Desktop Only</h2>
        <p className="text-sm leading-relaxed text-gray-300 mb-6">
          This site isn't optimized for mobile devices.
        <br/>
        <br/>
          Send this link to your friends to remind yourself to come back.
        </p>
        <button
          onClick={handleCopy}
          className={`w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 transition-colors duration-200 ${
            copied
              ? 'bg-green-800/60 text-green-300'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <span className="text-sm truncate">{DESKTOP_LINK}</span>
          <span className={`text-xs font-medium shrink-0 transition-colors duration-200 ${copied ? 'text-green-300' : 'text-blue-400'}`}>
            {copied ? '✓ Copied!' : 'Copy'}
          </span>
        </button>
      </div>
    </div>
  );
};