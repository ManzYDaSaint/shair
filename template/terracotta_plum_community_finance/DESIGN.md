---
name: Terracotta & Plum Community Finance
colors:
  surface: '#f8f9ff'
  surface-dim: '#d4dae8'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e7eefc'
  surface-container-high: '#e2e8f6'
  surface-container-highest: '#dce3f0'
  on-surface: '#151c25'
  on-surface-variant: '#55433e'
  inverse-surface: '#2a313b'
  inverse-on-surface: '#eaf1ff'
  outline: '#88726d'
  outline-variant: '#dbc1bb'
  surface-tint: '#974732'
  primary: '#944430'
  on-primary: '#ffffff'
  primary-container: '#b25c46'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a2'
  secondary: '#7e4f70'
  on-secondary: '#ffffff'
  secondary-container: '#fec3e9'
  on-secondary-container: '#7b4d6d'
  tertiary: '#1e6753'
  on-tertiary: '#ffffff'
  tertiary-container: '#3b816a'
  on-tertiary-container: '#f5fff8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a2'
  on-primary-fixed: '#3c0700'
  on-primary-fixed-variant: '#79301e'
  secondary-fixed: '#ffd7ef'
  secondary-fixed-dim: '#efb5db'
  on-secondary-fixed: '#320d2a'
  on-secondary-fixed-variant: '#643858'
  tertiary-fixed: '#aaf1d6'
  tertiary-fixed-dim: '#8ed4bb'
  on-tertiary-fixed: '#002117'
  on-tertiary-fixed-variant: '#00513e'
  background: '#f8f9ff'
  on-background: '#151c25'
  surface-variant: '#dce3f0'
typography:
  headline-xl:
    fontFamily: Epilogue
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Epilogue
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Epilogue
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Epilogue
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Epilogue
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Manrope
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1.25rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a warm, dignified, and effortless financial environment for collective wealth circles, rotating savings and credit associations (ROSCAs), and women-led community funds. The visual language merges modern structural clarity with rich, grounded tactile warmth. It explicitly avoids the cold, speculative feel of traditional fintech and crypto apps, favoring instead an empowering, grounded, and communal atmosphere.

The design philosophy combines **Warm Tactile Minimalism** with **Editorial Functionalism**:
- Generous breathing room paired with purposeful data-density for financial clarity.
- Subtle inner glows and soft ambient shadows that simulate crisp, debossed ledger card stock.
- Zero unnecessary chrome or ornamentation; high communicative value in every surface, border, and metric card.
- Reassurance and transparency conveyed through unmistakable status indications and prominent, legible monetary aggregates.

## Colors

The palette balances warm earthen energy with deep communal authority and unmistakable financial feedback tokens:

- **Primary (`#C86D56` - Terracotta Rose)**: Embodies collective warmth, trust, and humanity. Applied to primary call-to-action buttons, key circle progress indicators, active navigation tabs, and focal identity accents.
- **Secondary (`#4A2240` - Deep Plum)**: Evokes heritage, stability, and structure. Reserved for prominent balance numbers, high-level ledger headers, top app bars, and high-emphasis focal tags.
- **Tertiary (`#236B56` - Muted Deep Emerald)**: The verified affirmative state. Applied exclusively to paid statuses, completed collection milestones, on-time contribution badges, and positive balance differentials.
- **Pending Accent (`#C8872A` - Warm Amber)**: Reserved strictly for pending transfers, upcoming due dates, and awaiting review notices.
- **Neutral (`#272E38` - Deep Slate Neutral)**: Drives base legibility across all typography, subtle outline dividers (`#E4E7EB`), elevated card backings (`#FFFFFF`), and canvas foundations (`#FAF7F5` - warm off-white cream to soften screen strain).

## Typography

Typography prioritizes tabular numerical clarity and welcoming human presence. 

- **Display & Headlines (`Epilogue`)**: Distinctive geometric proportions with editorial poise. Used for circle titles, monthly payout milestones, and major monetary aggregates. Epilogue balances contemporary sophistication with a communal, handmade feel.
- **Body & Numerical Labels (`Manrope`)**: Precise, highly legible geometric sans-serif featuring open counters, balanced numerals, and distinct glyphs. Used for member rosters, historical contribution timestamps, input values, and micro-labels.
- **Financial Rule**: All currency displays must render with tabular figures (`tnum`) enabled to prevent layout shifting across monthly contribution tables and list cycles.

## Layout & Spacing

The layout is built for native mobile performance using a flexible 4-column mobile grid reflowing into an 8-column layout on tablets and foldables.

- **Vertical Rhythm**: Built upon a strict 4pt/8pt baseline grid. All padding, stack distributions, and margin spacers adhere to strict intervals of 4px.
- **Screen Margins**: Default outer canvas margins are fixed at `1.25rem` (20px) on standard viewports, condensing to `1rem` (16px) on ultra-compact devices.
- **Touch Safe Areas**: Top headers preserve platform status bar insets with an additional `space-md` breathing offset; bottom sheet containers reserve native home-indicator safe buffers plus a minimum of `space-lg` interactive clearance.
- **Content Stacking**: Financial overviews anchor prominent aggregate cards at the upper viewport, transitioning into tabular member lists spaced by `space-sm` dividers to eliminate visual fragmentation.

## Elevation & Depth

Visual hierarchy employs tactile surface stratification with low-opacity plum-tinted ambient shadows, rejecting harsh charcoal drops:

- **Level 0 (Canvas Base)**: Untinted natural background (`#FAF7F5`). Completely matte.
- **Level 1 (Card & Row Panels)**: Pure surface white (`#FFFFFF`) with a 1px structural hairline outline (`#EFECE9`). Box shadow: `0 2px 8px -2px rgba(74, 34, 64, 0.04), 0 1px 3px 0 rgba(74, 34, 64, 0.02)`.
- **Level 2 (Active Elements & Modals)**: Lifted cards and action sheets. Box shadow: `0 10px 24px -4px rgba(74, 34, 64, 0.08), 0 4px 8px -2px rgba(74, 34, 64, 0.03)`.
- **Level 3 (Floating CTAs & Toast Notifications)**: Floating buttons and contribution confirmations. Box shadow: `0 16px 32px -6px rgba(200, 109, 86, 0.22), 0 6px 12px -3px rgba(74, 34, 64, 0.06)`.
- **Inner Affordance (Inputs & Wells)**: Inset micro-shading on deposit entry fields to simulate pressed card slots (`inset 0 1px 2px rgba(39, 46, 56, 0.06)`).

## Shapes

The shape system adopts a roundedness factor of `2` (`0.5rem` base, up to `1rem` on cards and primary action containers). This geometry strikes an accessible balance between trustworthy fiscal stability and welcoming warmth.

- **Primary Action Elements**: Buttons, total balance highlight cards, and modal sheets utilize `1rem` (16px) curvature.
- **Tabular Rows & List Items**: Outer list containers leverage `1rem` corners, with internal individual row cells employing `0.5rem` on selection or swipe-reveal states.
- **Pills & Status Tags**: Status indicators, category filters, and step indicators override base tokens to use complete pill curvature (`9999px`) for quick scanning.

## Components

### Buttons
- **Primary Action (Deposit/Pay Share)**: Background in Primary Terracotta (`#C86D56`), foreground text in white (`#FFFFFF`), `font-weight: 700`, minimum touch target of 48px height. Active press state triggers a subtle scale transform (`0.98`) and a tone shift to `#B55E48`.
- **Secondary (Invite/View Ledger)**: Background in tinted Plum surface (`rgba(74, 34, 64, 0.06)`), foreground text in Deep Plum (`#4A2240`). No border.
- **Tertiary / Text**: Subtle text-only buttons in Deep Slate (`#272E38`) with underlined micro-copy for secondary disclaimers and administrative overrides.

### Status Chips & Badges
- **Paid / Completed**: Background tint of `#236B56` at 10% opacity, border 1px solid `rgba(35, 107, 86, 0.25)`, text in Tertiary Emerald (`#236B56`), prepended with an enclosed checkmark icon.
- **Pending / Upcoming**: Background tint of `#C8872A` at 10% opacity, border 1px solid `rgba(200, 135, 42, 0.25)`, text in Amber (`#C8872A`).
- **Late / Overdue**: Subtle terracotta wash (`#C86D56` at 12% opacity), text in Deep Terracotta (`#A74F3B`).

### Lists & Ledger Rows
- Segmented ledger items featuring left-aligned member avatars with initial fallbacks in muted terracotta tones.
- Middle column hosts member name (`body-md`) and contribution timestamp (`body-sm`).
- Right-aligned tabular currency displays using `headline-sm` with color-coded status badges directly underneath.
- Separators use gentle hairline borders (`#EFECE9`) inset by the avatar width.

### Checkboxes & Member Selection Toggles
- Custom rounded squares (`border-radius: 6px`) with 2px stroke in `#272E38` at 30% opacity.
- Checked state transitions to full Primary Terracotta (`#C86D56`) fill with a crisp white tick mark.

### Monetary Input Fields
- Prominently styled numeric entry fields with currency prefixes locked in Secondary Plum (`#4A2240`).
- Text size anchored at `headline-xl-mobile` to ensure the member has total visual confidence in the transfer amount before submission.
- Focused state applies an outer halo: `0 0 0 3px rgba(200, 109, 86, 0.15)`.

### Community Cards & Progress Gauges
- Circle summary cards encapsulate the collective pot, monthly individual quota, current recipient name, and progress toward total payout.
- Includes a horizontal pill-shaped progress track (`#EFECE9`) filled with a solid Tertiary Emerald or Primary Terracotta fill.