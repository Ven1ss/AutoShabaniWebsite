# AUTO SHABANI — Premium Car Spare Parts

A fully responsive, dark-themed landing page for **AUTO SHABANI**, Kosovo's premium car spare parts brand. Built for branding, authority, and trust—no e-commerce.

## Tech Stack

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or yarn/pnpm)

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Global styles, scroll behavior
│   ├── layout.tsx       # Root layout, metadata, fonts
│   └── page.tsx         # Home page (sections + loading)
├── components/
│   ├── Header.tsx       # Fixed nav with scroll-based background
│   ├── Hero.tsx         # Full-screen hero + parallax
│   ├── About.tsx        # Trust & excellence copy
│   ├── Brands.tsx       # Brand grid
│   ├── Experience.tsx   # Four value pillars
│   ├── Vision.tsx       # Vision statement
│   ├── Contact.tsx      # Phone, Instagram, location
│   ├── Footer.tsx       # Dark footer
│   └── LoadingScreen.tsx # Initial load animation
```

## Design

- **Background:** Cool light steel (`#F4F6F8` / `#E8ECF0`)
- **Accent:** Automotive signal red (`#C8102E`)
- **Fonts:** Barlow Condensed (display), Manrope (body), Ethnocentric (brand)
- **Hero:** Full-bleed workshop photography with brand-first typography
- **Behavior:** Smooth scroll, scroll-triggered section reveals, light loading screen

Contact details are live in `Contact.tsx`.
