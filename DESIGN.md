Design a dark-theme trading journal web application UI with the following visual system and components:

---

### 🎨 Design System

**Theme:** Dark mode — deep space / cyberpunk trading terminal aesthetic  
**Tone:** Sleek, premium, data-dense but visually breathable. Think Bloomberg terminal meets Web3 dashboard.

**Color Palette (CSS variables):**
- `--bg-base`: #0a0a0f (near-black with purple undertone)
- `--bg-surface`: #0f0f1a
- `--bg-card`: rgba(18, 14, 35, 0.6) (semi-transparent)
- `--primary`: #7c3aed (vivid purple)
- `--primary-light`: #a855f7
- `--primary-glow`: rgba(124, 58, 237, 0.4)
- `--accent`: #c084fc
- `--neon-green`: #39ff85 (for positive PnL)
- `--neon-red`: #ff3a6e (for negative PnL)
- `--border`: rgba(124, 58, 237, 0.35)
- `--text-primary`: #f1e8ff
- `--text-muted`: rgba(200, 180, 255, 0.5)

**Typography:**
- Display/headers: "Syne" (Google Fonts) — bold, geometric, futuristic
- Body/data: "JetBrains Mono" — monospace for numbers, tables, metrics
- Labels/UI: "Outfit" — clean, modern sans

---

### 🪟 Card & Surface Style

All cards must use:
- `background: rgba(18, 14, 35, 0.55)`
- `backdrop-filter: blur(20px) saturate(160%)`
- `border: 1px solid rgba(124, 58, 237, 0.3)`
- `border-radius: 20px`
- `box-shadow: 0 0 0 1px rgba(124,58,237,0.1), 0 8px 40px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.05)`

On hover, cards intensify the neon border:
- `border-color: rgba(168, 85, 247, 0.6)`
- `box-shadow: 0 0 20px rgba(124,58,237,0.25), 0 0 60px rgba(124,58,237,0.08)`

---

### 🔘 Button System

All buttons have `border-radius: 999px` (fully pill-shaped).

**Primary button:**
- Background: linear-gradient(135deg, #7c3aed, #a855f7)
- border: none
- box-shadow: 0 0 16px rgba(124,58,237,0.5), 0 4px 20px rgba(124,58,237,0.3)
- On hover: scale(1.03) + increase glow intensity

**Ghost/outline button:**
- background: transparent
- border: 1.5px solid rgba(124,58,237,0.5)
- color: #a855f7
- On hover: background rgba(124,58,237,0.1) + neon border glow

**Danger button (close trade, delete):**
- border: 1.5px solid rgba(255,58,110,0.5)
- color: #ff3a6e
- On hover: glow with --neon-red

---

### ✨ Neon & Glow Effects

Apply neon glow to:
1. **Metric values** (win rate, PnL, profit factor): `text-shadow: 0 0 10px currentColor`
2. **Positive numbers** (green neon): `color: #39ff85; text-shadow: 0 0 8px rgba(57,255,133,0.6)`
3. **Negative numbers** (red neon): `color: #ff3a6e; text-shadow: 0 0 8px rgba(255,58,110,0.6)`
4. **Active nav items**: left border with `box-shadow: inset 3px 0 #7c3aed, 2px 0 8px rgba(124,58,237,0.6)`
5. **Chart lines**: use purple gradient stroke with glow filter

---

### 📐 Layout & Pages to Design

#### 1. Sidebar Navigation
- Dark glass sidebar, 240px wide
- App logo/name with purple glow effect
- Nav items with icon + label
- Active state: pill highlight `bg: rgba(124,58,237,0.15)` + neon left border
- Sections: Dashboard, Trades, Accounts, Assets, Strategies, Reports, Export

#### 2. Dashboard Page
Top row — 4 metric cards in a grid:
- **Win Rate** — large circular progress ring in purple neon
- **Profit Factor** — large number with neon glow
- **Max Drawdown** — red neon value
- **Total PnL** — green or red neon depending on sign

Below — 2 column layout:
- **Equity Curve Chart** (line chart, purple gradient fill, glow on line)
- **Performance by Strategy** (bar chart, purple bars with glow)

#### 3. Trades Table Page
- Frosted glass table with `border-radius: 16px`
- Row alternating: transparent vs `rgba(124,58,237,0.04)`
- Filter bar at top: pill-shaped dropdowns and inputs
- Status badges: "Open" (purple neon pill), "Closed" (muted pill)
- Direction badges: "Long" (green neon), "Short" (red neon)
- PnL column colored with neon green/red + glow

#### 4. Add/Edit Trade Modal
- Centered modal with heavy blur backdrop
- Glassmorphism card with glowing purple border
- Input fields: dark bg, `border: 1px solid rgba(124,58,237,0.3)`, `border-radius: 12px`
- On focus: border glows purple `box-shadow: 0 0 0 3px rgba(124,58,237,0.25)`
- Pill buttons at bottom: "Cancel" (ghost) + "Save Trade" (primary neon)

#### 5. Accounts Page
- Cards per account/broker showing: name, currency, initial balance, current balance (neon), # of trades
- Balance difference shown as neon green/red with % change badge

---

### 🌌 Background & Atmosphere

- Base: `#0a0a0f` solid dark
- Subtle radial gradient in top-left corner: `radial-gradient(ellipse 800px 600px at 0% 0%, rgba(124,58,237,0.08) 0%, transparent 70%)`
- Second ambient glow bottom-right: `radial-gradient(ellipse 600px 500px at 100% 100%, rgba(168,85,247,0.05) 0%, transparent 70%)`
- Optional: very subtle noise texture overlay at 3-4% opacity for depth

---

### 🔢 Data Display Details

- All financial numbers use JetBrains Mono
- Positive values: `#39ff85` with subtle glow
- Negative values: `#ff3a6e` with subtle glow
- Neutral/zero: `#f1e8ff`
- Percentages formatted as: `+12.4%` or `-3.2%` with colored badges
- Tables have `border-collapse: separate; border-spacing: 0 4px` for row gap feel

---

### 🎭 Micro-interactions & Motion

- Cards: `transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1)` on hover (lift + glow)
- Buttons: `transition: transform 0.15s, box-shadow 0.2s` with hover scale
- Modal open: fade-in + slide-up `translateY(20px → 0)` with backdrop blur appearing
- Number counters: animate from 0 to value on page load
- Chart: draw animation on mount (stroke-dasharray reveal)
- Nav items: smooth background fill on hover/active

---

### 📦 Deliver

A complete UI mockup or working HTML/React prototype showing:
1. Dashboard with sidebar + metric cards + charts
2. Trades list table with filters
3. Add trade modal
4. Visual design system (colors, buttons, cards, badges, inputs)

Use Syne + JetBrains Mono + Outfit from Google Fonts.
Implement in React + Tailwind with inline styles for custom effects, or pure HTML/CSS.