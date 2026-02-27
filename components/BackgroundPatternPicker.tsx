'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PATTERNS: Record<string, { label: string; light: string; dark: string; size: string }> = {
  noise: {
    label: 'Noise',
    light: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
    dark: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
    size: '256px 256px',
  },
  dots: {
    label: 'Dot grid',
    light: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1' fill='%23000' opacity='0.07'/%3E%3C/svg%3E")`,
    dark: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1' fill='%23fff' opacity='0.07'/%3E%3C/svg%3E")`,
    size: '20px 20px',
  },
  diagonal: {
    label: 'Diagonal lines',
    light: `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 16L16 0' stroke='%23000' stroke-opacity='0.06' stroke-width='0.5'/%3E%3C/svg%3E")`,
    dark: `url("data:image/svg+xml,%3Csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 16L16 0' stroke='%23fff' stroke-opacity='0.06' stroke-width='0.5'/%3E%3C/svg%3E")`,
    size: '16px 16px',
  },
  topographic: {
    label: 'Topographic',
    light: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='t'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.02' numOctaves='3' seed='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23t)' opacity='0.04'/%3E%3C/svg%3E")`,
    dark: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='t'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.02' numOctaves='3' seed='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23t)' opacity='0.06'/%3E%3C/svg%3E")`,
    size: '400px 400px',
  },
  crosshatch: {
    label: 'Linen',
    light: `url("data:image/svg+xml,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6h12M6 0v12' stroke='%23000' stroke-opacity='0.04' stroke-width='0.5'/%3E%3C/svg%3E")`,
    dark: `url("data:image/svg+xml,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6h12M6 0v12' stroke='%23fff' stroke-opacity='0.05' stroke-width='0.5'/%3E%3C/svg%3E")`,
    size: '12px 12px',
  },
}

const STORAGE_KEY = 'bg-pattern'

function applyPattern(key: string) {
  const pattern = PATTERNS[key]
  if (!pattern) return
  const isDark = document.documentElement.classList.contains('dark')
  const value = isDark ? pattern.dark : pattern.light
  document.documentElement.style.setProperty('--bg-pattern', value)
  document.body.style.backgroundSize = pattern.size
}

export function BackgroundPatternPicker() {
  const [mounted, setMounted] = React.useState(false)
  const [selected, setSelected] = React.useState('noise')

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const key = stored && PATTERNS[stored] ? stored : 'noise'
    setSelected(key)
    applyPattern(key)
    setMounted(true)
  }, [])

  // Re-apply pattern when dark mode changes
  React.useEffect(() => {
    if (!mounted) return
    const observer = new MutationObserver(() => {
      applyPattern(selected)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [mounted, selected])

  function handleChange(value: string) {
    setSelected(value)
    localStorage.setItem(STORAGE_KEY, value)
    applyPattern(value)
  }

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-md bg-background" />
    )
  }

  return (
    <Select value={selected} onValueChange={handleChange}>
      <SelectTrigger
        className="w-9 h-9 p-0 border-0 bg-background hover:bg-muted justify-center [&>svg]:hidden"
        aria-label="Background pattern"
      >
        <SelectValue>
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {Object.entries(PATTERNS).map(([key, { label }]) => (
          <SelectItem key={key} value={key}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
