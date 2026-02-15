# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

For mobile testing, access via local network IP (e.g., `http://192.168.1.214:3000`). Update `allowedDevOrigins` in `next.config.ts` if needed.

Regenerate PWA icons after modifying `public/icon.svg`:
```bash
node scripts/generate-icons.js
```

## Architecture

Bill Splitter is a Next.js 16 PWA for splitting restaurant bills among friends. It supports manual item entry or AI-powered receipt scanning via Claude's vision API.

### Key Files

- `app/page.tsx` - Main client component holding all state (people, items, tax, tip, multi-step flow)
- `lib/calculations.ts` - Core logic: `calculateSplit()`, `calculateTipFromPercent()`, `PERSON_COLORS` palette
- `app/api/parse-receipt/route.ts` - API route using Anthropic SDK to parse receipt images via Claude Sonnet vision

### Reusable Components

- `components/Input.tsx` - Input with prefix/suffix support (`$`, `%`), uses forwardRef
- `components/Button.tsx` - Button with variants: primary, secondary, danger, ghost, chip
- `components/PersonChip.tsx` - Colored person badges, exports `colorClasses` used by ItemRow and Summary
- `components/ItemRow.tsx` - Item with person assignment chips (click to toggle, double-click to select only one person)
- `components/TipCalculator.tsx` - Tax/tip input with percent quick-select buttons, "split evenly" checkbox
- `components/Summary.tsx` - Per-person breakdown cards with color-coded headers

### Data Flow

1. People added with colors from `PERSON_COLORS` (cycles through: blue, violet, emerald, orange, pink, cyan, fuchsia, lime, red, amber)
2. Items added manually or via receipt scan (HEIF photos auto-converted via heic2any)
3. Each item's `assignedTo[]` tracks person IDs (empty = everyone shares)
4. `calculateSplit()` computes shares: proportional or even based on `splitTaxTipEvenly` flag

### Image Handling

Receipt upload in `page.tsx` handles:
1. HEIF detection via file extension/type, conversion via dynamic import of `heic2any`
2. Compression to stay under 5MB API limit (canvas resize + JPEG quality reduction)
3. POST to `/api/parse-receipt` which uses Claude vision

### Conventions

- All components are client-side (`'use client'`) - no RSC
- Uses Tailwind CSS 4 with responsive breakpoints (single column mobile, two columns at md:)
- PWA-ready with manifest and iOS safe area support
- `ANTHROPIC_API_KEY` env var required for receipt scanning
