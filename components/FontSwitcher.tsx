'use client';

import { useState, useEffect, useCallback } from 'react';

// Maps CSS variable names to human-readable labels
const FONT_OPTIONS: { label: string; cssVar: string; style: string }[] = [
  { label: 'DM Sans', cssVar: '--font-body', style: 'clean sans-serif' },
  { label: 'Bricolage Grotesque', cssVar: '--font-bricolage', style: 'modern geometric' },
  { label: 'Fraunces', cssVar: '--font-fraunces', style: 'soft serif' },
  { label: 'Playfair Display', cssVar: '--font-playfair', style: 'elegant serif' },
  { label: 'DM Serif Display', cssVar: '--font-dm-serif', style: 'classic display' },
  { label: 'Instrument Serif', cssVar: '--font-instrument-serif', style: 'editorial' },
  { label: 'Source Serif 4', cssVar: '--font-source-serif', style: 'readable serif' },
];

const STORAGE_KEY = 'jobsnl-heading-font-var';

/**
 * Reads the actual computed font-family from a CSS variable on <body>,
 * then applies it to --font-heading on <html> so Tailwind's font-heading class works.
 */
function applyFontFromVar(cssVar: string): boolean {
  const value = getComputedStyle(document.body).getPropertyValue(cssVar).trim();
  if (value) {
    document.documentElement.style.setProperty('--font-heading', value);
    return true;
  }
  return false;
}

export default function FontSwitcher() {
  const [selectedVar, setSelectedVar] = useState(FONT_OPTIONS[0].cssVar);
  const [isOpen, setIsOpen] = useState(false);
  const [resolvedFonts, setResolvedFonts] = useState<Record<string, string>>({});

  // On mount, restore from localStorage and resolve all font family names
  useEffect(() => {
    // Small delay to ensure fonts are loaded and CSS variables are available
    const timer = setTimeout(() => {
      // Resolve all computed font-family values for preview rendering
      const resolved: Record<string, string> = {};
      for (const opt of FONT_OPTIONS) {
        const value = getComputedStyle(document.body).getPropertyValue(opt.cssVar).trim();
        if (value) {
          resolved[opt.cssVar] = value;
        }
      }
      setResolvedFonts(resolved);

      // Restore saved preference
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && FONT_OPTIONS.some(f => f.cssVar === stored)) {
        setSelectedVar(stored);
        applyFontFromVar(stored);
      } else {
        // Default: use DM Sans (body font)
        applyFontFromVar(FONT_OPTIONS[0].cssVar);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleSelect = useCallback((cssVar: string) => {
    setSelectedVar(cssVar);
    localStorage.setItem(STORAGE_KEY, cssVar);
    applyFontFromVar(cssVar);
    setIsOpen(false);
  }, []);

  const currentOption = FONT_OPTIONS.find(f => f.cssVar === selectedVar) || FONT_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-border bg-card hover:bg-muted transition-colors text-muted-foreground"
        title="Switch heading font"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
        </svg>
        <span
          className="hidden sm:inline text-sm font-bold"
          style={{ fontFamily: resolvedFonts[selectedVar] || undefined }}
        >
          Aa
        </span>
        <span className="hidden md:inline">{currentOption.label}</span>
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
            <div className="py-1 max-h-80 overflow-y-auto">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.cssVar}
                  onClick={() => handleSelect(font.cssVar)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-muted transition-colors flex items-center justify-between ${
                    selectedVar === font.cssVar ? 'bg-primary/10' : ''
                  }`}
                >
                  <div>
                    <span
                      className="text-lg block leading-tight text-foreground"
                      style={{ fontFamily: resolvedFonts[font.cssVar] || undefined }}
                    >
                      {font.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {font.style}
                    </span>
                  </div>
                  {selectedVar === font.cssVar && (
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
