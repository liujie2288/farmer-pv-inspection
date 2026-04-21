# PV Inspection System - Frontend Style Guide

## Color System

| Token | Hex | Usage |
|---|---|---|
| navy | `#0B3D91` | Primary brand, headers, headings |
| navy-light | `#0a2a5e` | Gradient mid-stop |
| navy-dark | `#061a3a` | Gradient dark-stop |
| teal | `#00A8CC` | Accent, buttons, links, focus rings |
| teal-dark | `#0090b0` | Hover state for teal |
| gold | `#D4A843` | Secondary accent, rankings |

Font: `"Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`

## Typography

| Context | Classes |
|---|---|
| Page heading (H1) | `text-xl font-bold text-navy` |
| Section heading (H2) in card | `text-sm font-semibold text-navy` |
| Section heading with accent | `text-lg font-bold text-navy border-l-4 border-teal pl-3 my-4` |
| Body text | `text-sm text-gray-700` |
| Secondary text | `text-sm text-gray-500` |
| Muted/hint text | `text-xs text-gray-400` |
| Value in info row | `text-sm font-medium text-gray-900` |

## Cards

### Standard content card
```
bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden
```
With section header: `px-4 py-3 bg-navy/5 border-b border-gray-100`
Body rows: `divide-y divide-gray-50`

### Clickable list card (admin)
```
group cursor-pointer rounded-xl border border-gray-100 bg-white p-5 shadow-sm
hover:border-teal/30 hover:shadow-md transition-all
```

### Mobile inspector card
```
bg-white rounded-xl shadow-sm border border-gray-100 p-4
hover:shadow-md transition-shadow cursor-pointer
```

## Buttons

| Type | Classes |
|---|---|
| Primary (teal) | `bg-teal text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-teal-dark transition-colors` |
| Gradient CTA | `w-full bg-gradient-to-r from-teal to-teal-dark text-white py-3.5 rounded-xl shadow-lg text-lg font-bold hover:shadow-xl disabled:opacity-60` |
| Secondary outline | `border border-teal text-teal text-sm font-medium rounded-lg px-4 py-2 hover:bg-teal/5` |
| Cancel | `bg-gray-100 text-gray-700 text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-200` |
| Danger | `bg-red-600 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-red-700` |
| Icon action | `p-2 text-gray-400 hover:bg-gray-100 hover:text-teal rounded-lg transition-colors` |
| Navy | `bg-navy text-white rounded-xl py-3.5 text-sm font-medium shadow-sm hover:bg-navy/90` |
| Filter pill active | `bg-navy text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-sm` |
| Filter pill inactive | `bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-gray-200` |

## Form Inputs

```
w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal transition
```

Label: `text-sm font-medium text-gray-700 mb-1`
Required: `<span className="text-red-500 ml-0.5">*</span>`
Search input with icon: `pl-10` + icon at `absolute left-3 top-1/2 -translate-y-1/2 text-gray-400`

## Badges / Status Tags

All: `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium`

| Status | Background | Text |
|---|---|---|
| Success/Inspected | `bg-green-50` | `text-green-600` |
| In progress | `bg-teal/10` | `text-teal` |
| Warning/Uninspected | `bg-gray-100` | `text-gray-500` |
| Danger | `bg-red-50` | `text-red-600` |
| Gold/Global plan | `bg-gold/10` | `text-gold` |

## Layout (AppShell)

- TopBar: `h-14 bg-navy text-white sticky top-0 z-30`
- Sidebar desktop: `fixed left-0 top-14 w-64 bg-navy h-[calc(100vh-3.5rem)] z-20`
- Sidebar mobile: `fixed left-0 top-0 h-full w-72 bg-navy`
- Main: `lg:ml-64 p-4 min-h-[calc(100vh-3.5rem)] bg-gray-50`
- Sidebar active nav: `bg-white/15 text-white border-r-3 border-teal font-medium`
- Sidebar inactive nav: `text-white/70 hover:text-white hover:bg-white/10`

## Dialog / Modal

Overlay: `fixed inset-0 z-40 bg-black/50`
Dialog: `bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl`
Title: `text-lg font-bold text-navy mb-4 pr-6`
Content: `text-sm text-gray-600 mb-6`

## Toast

Position: `fixed top-4 left-1/2 -translate-x-1/2 z-50`
Item: `bg-white rounded-xl shadow-lg px-5 py-3 flex items-center gap-3`

## Empty State

```
flex flex-col items-center justify-center py-16 text-gray-400
Icon: size={48} className="mb-4 text-gray-300"
Text: text-base
```

## Progress Bar

Track: `h-1.5 bg-gray-200 rounded-full overflow-hidden`
Fill: `h-full bg-teal rounded-full transition-all duration-500`

## Animations

- `animate-slide-down` (0.3s) — toast entry
- `animate-fade-in` (0.2s) — dialog entry
- `animate-spin` — loading spinners
