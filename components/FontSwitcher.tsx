'use client';

import { useState, useEffect } from 'react';

const FONT_OPTIONS: { label: string; value: string; style: string }[] = [
  { label: 'Bricolage Grotesque', value: 'var(--font-bricolage)', style: 'modern geometric' },
  { label: 'Fraunces', value: 'var(--font-fraunces)', style: 'soft serif' },
  { label: 'Playfair Display', value: 'var(--font-playfair)', style: 'elegant serif' },
  { label: 'DM Serif Display', value: 'var(--font-dm-serif)', style: 'classic display' },
  { label: 'Instrument Serif', value: 'var(--font-instrument-serif)', style: 'editorial' },
  { label: 'Source Serif 4', value: 'var(--font-source-serif)', style: 'readable serif' },
];

const STORAGE_KEY = 'jobsnl-heading-font';

export default function FontSwitcher() {
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSelectedFont(stored);
      document.documentElement.style.setProperty('--font-heading', stored);
    } else {
      document.documentElement.style.setProperty('--font-heading', FONT_OPTIONS[0].value);
    }
  }, []);

  const handleSelect = (value: string) => {
    setSelectedFont(value);
    localStorage.setItem(STORAGE_KEY, value);
    document.documentElement.style.setProperty('--font-heading', value);
    setIsOpen(false);
  };

  const currentOption = FONT_OPTIONS.find(f => f.value === selectedFont) || FONT_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border bg-card hover:bg-muted transition-colors text-muted-foreground"
        title="Switch heading font"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
        </svg>
        <span className="hidden sm:inline font-heading" style={{ fontFamily: selectedFont }}>Aa</span>
        <span className="hidden sm:inline">{currentOption.label}</span>
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground">Heading Font Preview</p>
            </div>
            <div className="py-1">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => handleSelect(font.value)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-muted transition-colors flex items-center justify-between ${
                    selectedFont === font.value ? 'bg-primary/10' : ''
                  }`}
                >
                  <div>
                    <span
                      className="text-lg block leading-tight text-foreground"
                      style={{ fontFamily: font.value }}
                    >
                      {font.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {font.style}
                    </span>
                  </div>
                  {selectedFont === font.value && (
                    <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
