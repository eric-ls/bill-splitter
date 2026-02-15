# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

Regenerate PWA icons after modifying `public/icon.svg`:
```bash
node scripts/generate-icons.js
```

## Architecture

Bill Splitter is a Next.js 16 PWA for splitting restaurant bills among friends. It supports manual item entry or AI-powered receipt scanning via Claude's vision API.

### Key Files

- `app/page.tsx` - Main client component holding all state (people, items, tax, tip)
- `lib/calculations.ts` - Core split logic with `calculateSplit()` that distributes items, tax, and tip proportionally
- `app/api/parse-receipt/route.ts` - API route using Anthropic SDK to parse receipt images via Claude Sonnet vision

### Data Flow

1. Items are added manually or via receipt scan (POST to `/api/parse-receipt` with base64 image)
2. Each item tracks `assignedTo[]` - array of person IDs who share that item (empty = everyone)
3. `calculateSplit()` computes proportional shares: each person pays their item share + proportional tax/tip based on their subtotal percentage

### Component Hierarchy

```
page.tsx (state)
├── BillInput (receipt upload/camera)
├── PeopleManager (add/remove people)
├── ItemList
│   └── ItemRow (item assignment toggles)
├── TipCalculator (tax/tip inputs)
└── Summary (per-person breakdown)
```

### Conventions

- All components are client-side (`'use client'`) - no RSC
- Uses Tailwind CSS 4 for styling
- PWA-ready with manifest and iOS safe area support
- `ANTHROPIC_API_KEY` env var required for receipt scanning
