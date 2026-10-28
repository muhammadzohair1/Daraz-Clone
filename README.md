# Stores — Shop the Future

A premium, futuristic product-discovery storefront built as a **static website** — pure HTML5, CSS3 and vanilla JavaScript. No frameworks, no build step, no backend. Products are showcased here; purchasing happens on **Daraz.pk** via outbound links.

---

## 1. What this website is

**Stores** is a curated product showcase / affiliate-style storefront for the Pakistani market. Visitors discover featured products, filter and search the catalog, view details in a quick-view modal, and click through to Daraz to buy. There is deliberately **no cart, checkout, accounts, or payments**.

### Sections
| Section | ID | Highlights |
|---|---|---|
| Floating nav | `#nav` | Translucent glass bar, active-link indicator, hide-on-scroll, animated SVG hamburger |
| Takeover menu | `#takeover-nav` | Full-screen menu with staggered links, contact area, ESC/focus support |
| Hero | `#top` | Dark cinematic hero — "Shop the future.", gradient orbs, masked grid, staggered entrance |
| Marquee | — | Seamless looping strip: "Thoughtfully selected essentials • …" |
| Showcase gallery | `#showcase` | 8-image asymmetric editorial grid with captions + accessible lightbox |
| Products | `#products` | Category filters, live search, sorting, product count, quick-view modal |
| About | `#about` | Honest brand principles (no invented stats) |
| Contact CTA | `#contact` | Dark gradient card with mailto CTA |
| Footer | — | Dark footer, category shortcuts, dynamic copyright year, back-to-top |

### Featured products
1. **Histro Auto-Count Gripper** — Fitness — adjustable 5–60KG, auto counting
2. **Black & White Suit Jacket** — Apparel
3. **Retinol Gold Mask** — Skincare — 100ML (no medical claims)
4. **Summer Collection Tees** — Apparel
5. **Ear Wax Cleaning Kit** — Health — 6-piece set

---

## 2. Tech stack

- **HTML5** — semantic landmarks, ARIA where needed, lazy-loaded images with explicit dimensions
- **CSS3** — design tokens via custom properties, dark hero / light body / dark footer hybrid theme, `clamp()` fluid typography, `clip-path` menu reveal, IntersectionObserver-driven reveals, full responsive breakpoints (1200/900/768/480px), `prefers-reduced-motion` support, `@supports` backdrop-filter fallback
- **Vanilla JS** — product catalog rendered from a centralized `PRODUCTS` array; filters + search + sort compose correctly; quick-view modal and lightbox with focus management; custom rAF hamburger morph with easeInBack/easeOutBack; passive scroll listeners batched with `requestAnimationFrame`
- **Fonts** — Google Fonts **Inter** (400–800)
- **Images** — local AVIF/JPG/WebP assets in `Assets/Img/`

---

## 3. Project structure

```
zohair/
├── Index.html          # Full page: nav, menu, hero, marquee, gallery, products, about, CTA, footer, modal, lightbox
├── favicon.svg
├── robots.txt
├── Assets/
│   ├── Css/Style.css   # Design system, components, responsive, reduced-motion
│   ├── Js/Script.js    # CONFIG + product data + all interactions
│   └── Img/            # AVIF/JPG/PNG/WebP assets
└── README.md
```

---

## 4. Features implemented

- Animated hamburger ⇄ arrow morph + full-screen takeover menu (staggered links, ESC close, scroll lock, focus management)
- Dark cinematic hero with masked headline reveal, drifting gradient orbs, ambient grid, scroll hint
- Seamless marquee (duplicated content, pauses under reduced motion)
- Asymmetric editorial gallery with caption reveals + accessible lightbox (prev/next, keyboard arrows, ESC, click-outside, focus return)
- Product discovery: **category filters, live search (name/description/category), sorting (featured / A–Z / price low→high / high→low), product count, empty state with clear-filters** — all compose correctly
- Quick-view modal with product info table, price (only when verified), Daraz CTA, keyboard-accessible with focus return
- Honest About section (brand principles instead of invented stats)
- Active-section nav highlighting via IntersectionObserver
- Dynamic copyright year, smooth back-to-top
- SEO: title, meta description, Open Graph + Twitter cards, theme-color, favicon
- Reduced-motion fallbacks site-wide; no-JS content still visible (hero title falls back to visible)

---

## 5. Configuration values to replace

Open `Assets/Js/Script.js` → the `CONFIG` object at the top:

| Value | Current state | Action |
|---|---|---|
| `contactEmail` | `hello@stores.com` **(placeholder)** | Replace with your real email (also in `Index.html` mailto links) |
| `darazUrl` | `https://www.daraz.pk` generic | Replace each product's `url` with real Daraz product deep links |
| `price` (each product) | `null` (unverified) | Fill in verified PKR prices — price UI only appears when set |
| `badge` (each product) | `null` | Only set when factually supported (e.g., "New") |
| Social links | `#takeover-social` is hidden | Add verified links in `Index.html` and remove `hidden` |
| OG `og:url` / canonical | Not set | Add when the production domain is known |
| `sitemap.xml` | Not included | Add only when the production domain/URLs are known |

**Intentionally removed vs. the previous version:** fake stats ("10k+ customers", "4.9★ rating", "48h delivery"), unverifiable product claims ("anti-aging", safety claims), fake shipping/returns promises. Re-add only what you can verify.

---

## 6. How to run

Open `Index.html` directly, or serve locally:

```powershell
python -m http.server 8000
# visit http://localhost:8000
```

No build step, no dependencies.

---

## 7. Known limitations

- Product links currently point to the Daraz homepage until deep links are supplied
- No sitemap.xml yet (needs a real production domain)
- Image filenames contain spaces/parentheses (`post (1).jpg`) — works fine, but renaming would be cleaner
- Contact email is a labeled placeholder
