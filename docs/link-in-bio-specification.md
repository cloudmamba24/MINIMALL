# Link-in-Bio Site Specification

## Executive Snapshot

### Site Purpose & Positioning
Great.Store's Maker-powered "link in bio" page acts as an interactive catalogue for a fashion brand. It combines an Instagram‑style media feed with e‑commerce shopping and editorial lookbook content. Visitors can browse media posts, explore products, view a lookbook and add items to a mini‑cart before being directed to the primary commerce site at checkout.

### Primary User Journeys

#### Browse & Discover
Users land on the Instagram‑style feed to discover lifestyle images and announcements. Each post can open a product gallery (quick view) and link to product details.

#### Shop by Category/Collection
From the Shop tab, shoppers filter products via category chips (e.g., Hoodies, T‑shirts) and collection chips (#BEACH, ICONIC). They can view basic product info and launch detailed quick‑view overlays.

#### Product Exploration
Quick‑view overlays allow users to view multiple images, choose size/color, read descriptions and add items to the cart without leaving the page.

#### Lookbook Storytelling
The Lookbook tab delivers a scrolling editorial layout with collaged photos and shopping hotspots. Clicking hotspots opens product overlays tied to the images.

#### Cart & Checkout
A sliding mini‑cart shows selected items and provides an entry point to the full checkout (hosted on the main domain).

### Design System Vibe
The design feels contemporary and editorial—large photography, generous white space, and a minimal typographic palette dominated by uppercase sans‑serif headlines. Primary colours are black and white with occasional red or blue accents for call‑outs and sale badges. Components have subtle rounded corners and mild shadows. Motion cues like sliding panels and fading modals enhance interactivity without being distracting.

## Global Foundations

```json
{
  "breakpoints": [
    "xs: <480", 
    "sm: ≥640", 
    "md: ≥768", 
    "lg: ≥1024", 
    "xl: ≥1280"
  ],
  "containerWidths_px": { "sm": 640, "md": 768, "lg": 1024, "xl": 1280 },
  "gridSystem": { "columns": 12, "gutter_px": 24, "margins_px": 16 },
  "spacingScale_px": [4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
  "radius_px": { "sm": 4, "md": 8, "lg": 12, "xl": 16, "pill": 999 },
  "shadows": [
    "xs: 0 1px 2px rgba(0,0,0,0.05)",
    "sm: 0 2px 4px rgba(0,0,0,0.08)",
    "md: 0 4px 8px rgba(0,0,0,0.1)"
  ],
  "typography": {
    "fonts": { "primary": "Inter, Helvetica Neue, system-ui", "secondary": "inherit" },
    "lineHeight": { "body": 1.6, "heading": 1.2 },
    "scale": {
      "xs": 12,
      "sm": 14,
      "md": 16,
      "lg": 18,
      "xl": 24,
      "2xl": 32,
      "3xl": 40
    }
  },
  "colorPalette": {
    "primary": { "50": "#F5F5F5", "500": "#111111", "700": "#0A0A0A" },
    "secondary": { "500": "#1E40AF", "600": "#1D4ED8" },
    "neutral": { "50": "#FFFFFF", "100": "#F7F7F7", "900": "#111111" },
    "feedback": { "success": "#16A34A", "warning": "#D97706", "error": "#DC2626" },
    "sale": "#E11D48"
  },
  "iconography": { "set": "Feather/Lucide", "strokeWidth": 1.5 },
  "motion": {
    "easings": ["ease-in-out", "ease-out"],
    "durations_ms": [100, 200, 300],
    "common": "modals fade-in 200ms, panels slide-in from right 250ms (20px offset)"
  }
}
```

## Navigation & Information Architecture

### Site Map

#### Home / Instagram Feed
- **Route**: `/greatstore` – default navigation tab
- **Content**: Brand logo, social icons, "Visit Great.Store" CTA and tab set (Instagram, Shop, Lookbook)
- **Layout**: 3‑column grid of media cards with images, animated posters or graphics
- **Interaction**: Some cards expose a "View Products" chip that opens a quick‑view overlay

#### Shop
- **Route**: `/greatstore?QNTabId=navigation&QNCategoryId=…` – parameterised by category and collection IDs
- **Content**: Hero banner with call‑to‑action, "Continue Shopping" section, category filters, product carousels
- **Features**: 
  - Chip filters (New, Bestsellers, Hoodies, T‑shirts, Sale)
  - Horizontal scrollable product cards
  - Circular collection selectors (NEW IN, #BEACH, ICONIC, etc.)
  - Vertical grid of lookbook‑style images

#### Product Detail (Quick View)
- **Route**: `/greatstore?…&QNProductId=…`
- **Format**: Overlay containing product images, size/color selectors, quantity stepper
- **Features**: "View Details" link, "Add to Cart" button, description, related products
- **Access**: Available from shop and media hotspots

#### Mini Cart Overlay
- **Behavior**: Slides from right upon adding a product
- **Content**: Cart items with quantity controls, total, Checkout/Continue Shopping buttons

#### Lookbook
- **Route**: `/greatstore?QNTabId=navigation&QNCategoryId=…`
- **Layout**: Editorial page with collage layout, large hero, copy and call‑to‑action
- **Features**: Full‑width or split‑column photos with embedded "hotspots" (white dots)
- **Interaction**: Clicking hotspots opens product overlay similar to quick‑view

#### Media Gallery Overlay
- **Trigger**: Clicking Instagram card or lookbook hotspot
- **Display**: Selected photo/video in lightbox with left/right navigation
- **Features**: Right‑hand column lists "Product in this image" with clickable product cards

### Routing Patterns

```json
{
  "routes": [
    { "pattern": "/greatstore", "notes": "Base link-in-bio page, default tab=Instagram" },
    { "pattern": "/greatstore?QNTabId=navigation&QNCategoryId=:id", "notes": "Shop or Lookbook categories; id corresponds to Maker CMS node" },
    { "pattern": "/greatstore?…&QNProductId=:productId", "notes": "Quick-view product overlay" },
    { "pattern": "/greatstore?…&QVMediaId=:mediaId", "notes": "Media lightbox overlay with optional QVProductId" }
  ]
}
```

### Header, Navigation & Footer Behaviors

#### Header
- **Layout**: Great.Store logo centered with tagline and social icons beneath
- **CTA**: Primary button ("Visit Great.Store") opens main commerce site in new tab
- **Behavior**: Header and tab navigation scroll away; no sticky header on desktop; nav reappears when scrolled back to top

#### Tabs
- **Items**: Three‑item tab bar ("Instagram", "Shop", "Lookbook")
- **Position**: Below the CTA
- **Behavior**: Updates query string (QNTabId/QNCategoryId parameters) and loads appropriate section without page refresh
- **Visual**: Active tab is underlined

#### Navigation Elements
- **Back Arrow**: Small arrow icon at far left acts as internal back link from product overlays; may collapse into hamburger/back button on mobile
- **Cart Icon**: Bag icon with numeric badge floats in top right; clicking opens mini‑cart overlay; badge count updates as items are added

#### Footer
- **Status**: No dedicated footer visible within micro‑site; page ends at lookbook or product grid

### Search & Filters

#### Search
- **Availability**: No free‑text search available
- **Method**: Filtering done through category chips and collection chips in Shop tab

#### Category Chips
- **Options**: New, Bestsellers, Hoodies, T‑shirts, Sale
- **Behavior**: Update horizontal carousel of products; only one category chip active at a time
- **Visual**: Active chip filled with dark color

#### Collection Chips
- **Format**: Circular thumbnails labeled NEW IN, #BEACH, ICONIC, XMAS, YOU, #GLCL
- **Function**: Filter product grid and update query parameters
- **Interaction**: Clicking triggers asynchronous fetch and page update; URL updates with new QNCategoryId

## Component Library

### MediaCard

```json
{
  "name": "MediaCard",
  "purpose": "Displays a photo/video in the Instagram feed grid or lookbook sections.",
  "anatomy": ["container","image","overlayChip","badge"],
  "props": {
    "type": ["image","video","poster"],
    "aspectRatio": ["1:1","4:5","16:9"],
    "hasViewProductsChip": "boolean",
    "overlayLabel": "string"
  },
  "states": ["default","hover","focus","pressed"],
  "interactions": [
    "hover: show slight zoom and reveal overlay chip (0.9 opacity)",
    "click: open media lightbox; if has products, show product panel"
  ],
  "layout": {
    "width_px": 320,
    "height_px": 320,
    "margin_px": 8,
    "imageRadius_px": 8
  },
  "typography": {
    "overlayLabel": { "size_px": 12, "weight": 500, "transform": "uppercase" }
  },
  "colors": {
    "overlayBg": "rgba(17,17,17,0.6)",
    "overlayText": "#FFFFFF",
    "border": "#E5E7EB"
  },
  "dataBindings": {
    "inputs": ["mediaUrl","thumbnailUrl","productRefs[]"],
    "outputs": ["onClick -> openLightbox(mediaId)"]
  },
  "accessibility": {
    "role": "button",
    "altTextRule": "Describe the image contents succinctly.",
    "focusOrder": "image -> overlayChip",
    "aria": ["aria-label on clickable wrapper"]
  }
}
```

### ProductCard

```json
{
  "name": "ProductCard",
  "purpose": "Shows product summary in shop carousels and grids.",
  "anatomy": ["image","badgeStack","title","priceRow","variantIcons"],
  "props": {
    "labels": { "sale": "boolean", "bestseller": "boolean", "newArrival": "boolean" },
    "imageAspect": ["4:5"],
    "showVariants": "boolean"
  },
  "states": ["default","hover","focus"],
  "interactions": [
    "hover: elevate card and display subtle shadow",
    "click: open quick-view overlay (not full page)"
  ],
  "contentRules": {
    "titleMaxChars": 50,
    "priceFormats": ["$59","$59 $69","$59 – $69"],
    "truncate": "1 line with ellipsis"
  },
  "layout": {
    "width_px": 180,
    "padding_px": 8,
    "gap_px": 4,
    "imageRadius_px": 8
  },
  "typography": {
    "title": { "size_px": 14, "weight": 600 },
    "price": { "size_px": 13, "weight": 700 },
    "originalPrice": { "size_px": 12, "weight": 400, "decoration": "line-through" }
  },
  "colors": {
    "background": "#FFFFFF",
    "text": "#111111",
    "muted": "#6B7280",
    "saleBadge": "#E11D48"
  },
  "dataBindings": {
    "inputs": ["imageUrl","title","price","originalPrice","labels","variantIcons[]"],
    "outputs": ["onClick -> openProductOverlay(productId)"]
  },
  "accessibility": {
    "role": "button",
    "aria": ["aria-labelledby on card wrapper pointing to product name"]
  }
}
```

### CategoryChip

```json
{
  "name": "CategoryChip",
  "purpose": "Filter products in Shop tab.",
  "anatomy": ["chip"],
  "props": { "label": "string", "active": "boolean" },
  "states": ["default","active","hover","focus"],
  "interactions": ["click: update query parameters and refresh product list"] ,
  "layout": { "height_px": 32, "padding_x_px": 12, "radius_px": 16, "gap_px": 8 },
  "typography": { "label": { "size_px": 14, "weight": 500 } },
  "colors": { "defaultBg": "#F3F4F6", "activeBg": "#111111", "defaultText": "#111111", "activeText": "#FFFFFF" },
  "accessibility": { "role": "tab", "aria-selected": "active" }
}
```

### CollectionChip

```json
{
  "name": "CollectionChip",
  "purpose": "Filter shop grid by collection (e.g., NEW IN, #BEACH).",
  "anatomy": ["avatar","label"],
  "props": { "imageUrl": "string", "label": "string", "active": "boolean" },
  "states": ["default","active","hover"],
  "interactions": ["click: navigate to collection route"],
  "layout": { "width_px": 64, "height_px": 80, "gap_px": 8 },
  "typography": { "label": { "size_px": 10, "weight": 500, "align": "center" } },
  "accessibility": { "role": "button", "aria-label": "Filter by :label collection" }
}
```

### ProductOverlay (Quick View)

```json
{
  "name": "ProductOverlay",
  "purpose": "Displays product details in an overlay when users click a product card or hotspot.",
  "anatomy": ["overlayWrapper","imageGallery","infoPanel","sizeSelector","colorSelector","quantityStepper","actionButtons","description","relatedProducts"],
  "props": { "productId": "string", "images[]": "array", "sizes[]": "array", "colors[]": "array", "price": "string", "description": "string", "relatedProducts[]": "array" },
  "states": ["idle","sizeMissing","adding","added","error"],
  "interactions": [
    "select size: highlight selected box; required before adding",
    "select colour: update swatch selection",
    "change quantity: +/- buttons",
    "add to cart: triggers spinner then opens mini-cart",
    "view details: navigates to full PDP on main site"
  ],
  "layout": {
    "width_px": 420,
    "padding_px": 16,
    "gap_px": 12
  },
  "typography": {
    "title": { "size_px": 20, "weight": 700 },
    "price": { "size_px": 18, "weight": 600 },
    "description": { "size_px": 14 }
  },
  "colors": {
    "background": "#FFFFFF",
    "panelBg": "#F9FAFB",
    "buttonPrimary": "#111111",
    "buttonSecondary": "#FFFFFF",
    "buttonSecondaryBorder": "#111111"
  },
  "accessibility": {
    "role": "dialog",
    "focusTrap": true,
    "aria": ["aria-label set to product title", "aria-modal=true"]
  }
}
```

### MiniCart

```json
{
  "name": "MiniCart",
  "purpose": "Shows cart items in a sliding panel from the right.",
  "anatomy": ["overlayBackdrop","panel","cartItemList","subtotal","actions"],
  "props": { "items[]": "array", "total": "string" },
  "states": ["closed","opening","open","closing"],
  "interactions": ["click bag icon: open mini-cart","click overlay or close button: close panel","adjust quantity: +/- buttons","remove item: remove link","checkout: navigate to main site checkout","continue shopping: dismiss panel"] ,
  "layout": { "width_px": 360, "padding_px": 16, "gap_px": 12 },
  "typography": { "itemName": { "size_px": 14, "weight": 600 }, "price": { "size_px": 14, "weight": 600 } },
  "colors": { "background": "#FFFFFF", "overlay": "rgba(0,0,0,0.5)", "button": "#111111", "buttonText": "#FFFFFF" },
  "accessibility": { "role": "dialog", "focusTrap": true }
}
```

### LookbookSection

```json
{
  "name": "LookbookSection",
  "purpose": "Creates editorial storytelling sections in the Lookbook.",
  "anatomy": ["gridContainer","imageTiles[]","headline","subheadline","cta"],
  "props": { "images[]": "array", "headline": "string", "paragraph": "string", "ctaText": "string", "ctaLink": "string" },
  "states": ["default"],
  "interactions": ["scroll: images parallax slightly","hotspotClick: open quick-view overlay"],
  "layout": {
    "gridColumns": { "md": 2, "lg": 3 },
    "gap_px": 24,
    "sectionPadding_px": 48
  },
  "typography": {
    "headline": { "size_px": 32, "weight": 700, "lineHeight": 1.2 },
    "paragraph": { "size_px": 16, "weight": 400 }
  },
  "colors": { "text": "#111111", "background": "#FFFFFF" },
  "accessibility": { "imagesHaveAlt": true, "hotspotAnnounce": "Hotspot with product link" }
}
```

### HeaderBar

```json
{
  "name": "HeaderBar",
  "purpose": "Top of page branding and social section.",
  "anatomy": ["logo","tagline","socialIcons","ctaButton","tabNav"],
  "props": { "activeTab": "Instagram|Shop|Lookbook" },
  "states": ["default","scrolled"],
  "interactions": ["click logo: scroll to top","click social icon: open link in new tab","click CTA: open external site"],
  "layout": {
    "height_px": 200,
    "alignment": "centered",
    "spacing_px": 16
  },
  "typography": {
    "logo": { "size_px": 36, "weight": 800 },
    "tagline": { "size_px": 14, "weight": 400 },
    "tabs": { "size_px": 14, "weight": 600 }
  },
  "colors": { "text": "#111111", "ctaBorder": "#111111", "ctaHoverBg": "#111111", "ctaHoverText": "#FFFFFF" },
  "accessibility": { "role": "banner", "aria-label": "Site header" }
}
```

## Page Templates

### Home / Instagram Template

```json
{
  "template": "InstagramHome",
  "sections": [
    { "name": "HeaderBar", "height_px": 200 },
    { "name": "MediaGrid", "behaviors": ["3-column grid on desktop","2-column on md","1-column on mobile"], "gap_px": 16 }
  ],
  "pagination": { "type": "manual load more via infinite scroll", "trigger": "scroll near bottom", "pageSize": 24 }
}
```

### Shop Template

```json
{
  "template": "Shop",
  "sections": [
    { "name": "HeroStrip", "height_px": 360, "motion": "parallax fade" },
    { "name": "ContinueShopping", "height_px": 200, "behaviors": ["hidden when cart empty"] },
    { "name": "CategoryFilter", "height_px": 48, "sticky": false },
    { "name": "ProductCarousel", "cols": { "sm": 2, "md": 3, "lg": 5 }, "cardGap_px": 24 },
    { "name": "CollectionSelector", "height_px": 80, "scrollable": true },
    { "name": "ImageGrid", "cols": { "sm": 1, "md": 2, "lg": 4 }, "gap_px": 24 }
  ],
  "pagination": { "type": "horizontal carousels", "trigger": "scroll within row", "pageSize": 6 }
}
```

### Product Detail Overlay Template

```json
{
  "template": "ProductOverlay",
  "sections": [
    { "name": "GalleryColumn", "width_px": 300, "height_px": 400 },
    { "name": "InfoColumn", "width_px": 420, "sections": [
      { "name": "Header", "height_px": 60 },
      { "name": "Selectors", "height_px": 120 },
      { "name": "Actions", "height_px": 60 },
      { "name": "Description", "height_px": 120 },
      { "name": "RelatedProducts", "height_px": 160 }
    ]}
  ],
  "pagination": { "type": "none", "trigger": null }
}
```

### Lookbook Template

```json
{
  "template": "Lookbook",
  "sections": [
    { "name": "HeroCollage", "height_px": 480 },
    { "name": "EditorialSections", "behaviors": ["alternating image/text layout", "hotspots embedded in images"] },
    { "name": "FloatingBackToTop", "position": "bottom-left", "size_px": 40 }
  ],
  "pagination": { "type": "scroll", "trigger": "continuous" }
}
```

## Interaction Flows (State Machines)

### AddToCart Flow

```json
{
  "flow": "AddToCart",
  "states": ["Idle","SizeMissing","Adding","Added","Error"],
  "events": ["clickAdd","selectSize","apiSuccess","apiError","closeCart"],
  "transitions": {
    "Idle.clickAdd": "SizeMissing",
    "Idle.selectSize": "Idle",
    "SizeMissing.selectSize": "Idle",
    "Idle.clickAdd (with size)": "Adding",
    "Adding.apiSuccess": "Added",
    "Adding.apiError": "Error",
    "Added.closeCart": "Idle",
    "Error.selectSize": "Idle"
  },
  "uiFeedback": {
    "SizeMissing": "Display red helper text 'Please select a size'.",
    "Adding": "Add button shows spinner for ~200ms minimum.",
    "Added": "Mini-cart slides in with updated item count and toast message.",
    "Error": "Show inline error message and keep overlay open."
  }
}
```

### QuickView from Media Post

```json
{
  "flow": "OpenMediaQuickView",
  "states": ["Thumbnail","Lightbox","ProductPanel","ProductOverlay","Closed"],
  "events": ["clickThumbnail","clickHotspot","clickProductCard","close"],
  "transitions": {
    "Thumbnail.clickThumbnail": "Lightbox",
    "Lightbox.clickHotspot": "ProductPanel",
    "ProductPanel.clickProductCard": "ProductOverlay",
    "Lightbox.close": "Closed",
    "ProductPanel.close": "Lightbox",
    "ProductOverlay.close": "ProductPanel"
  },
  "uiFeedback": {
    "Lightbox": "Page dims and image centered with left/right arrows.",
    "ProductPanel": "Right panel appears listing products in the image; descriptive copy at top.",
    "ProductOverlay": "Slidable panel shows product details with add‑to‑cart.",
    "Closed": "Return focus to media grid."
  }
}
```

### Category Filter

```json
{
  "flow": "FilterByCategory",
  "states": ["Viewing","Loading","Filtered"],
  "events": ["selectChip","loadComplete"],
  "transitions": {
    "Viewing.selectChip": "Loading",
    "Loading.loadComplete": "Filtered",
    "Filtered.selectChip": "Loading"
  },
  "uiFeedback": {
    "Loading": "Products fade out and a skeleton or dim overlay appears until new products load (~300ms).",
    "Filtered": "New products fade in; active chip receives dark background and white text."
  }
}
```

### Cart & Checkout

```json
{
  "flow": "MiniCart",
  "states": ["Closed","Opening","Open","Closing"],
  "events": ["openCart","closeCart","updateQty","removeItem","checkout"],
  "transitions": {
    "Closed.openCart": "Opening",
    "Opening.animationEnd": "Open",
    "Open.closeCart": "Closing",
    "Closing.animationEnd": "Closed",
    "Open.updateQty": "Open",
    "Open.removeItem": "Open",
    "Open.checkout": "redirect (external)"
  },
  "uiFeedback": {
    "Opening": "Panel slides in from right over 300ms.",
    "Closing": "Panel slides out; background un-dims.",
    "updateQty/removeItem": "Quantity and subtotal update instantly with no page reload."
  }
}
```

## Forms & Validation

### Size Selector
- **Status**: Required field within product overlays
- **Validation**: If no size selected, clicking "Add to Cart" surfaces red error message below size options and prevents submission

### Quantity Stepper
- **Controls**: Buttons with – and + adjust quantity
- **Constraints**: Minimum is 1; no maximum indicated
- **Input**: Keyboard input not allowed; field is read‑only

### Colour Selector
- **Display**: Swatches show available colours
- **Selection**: Only one colour can be selected; selected swatch receives border

### Checkout
- **Flow**: Mini‑cart's "Checkout" button directs users to main commerce site
- **Forms**: Address/payment forms live outside this micro‑site

### Accessibility
- **Focus**: All interactive inputs support focus outlines
- **Keyboard**: Pressing Enter on focused buttons triggers clicks

## Media & Motion

### Images
- **Format**: All product and lookbook images use responsive `img` elements with `object-fit: cover`
- **Aspect Ratios**:
  - Instagram grid: 1:1
  - Shop carousel: 4:5
  - Lookbook images: variable (2:3, 4:5)
- **Source**: Images loaded from Shopify/Cloudinary with srcset for 1× and 2× densities
- **Loading**: Lazy‑loading used; off‑screen images loaded on scroll

### Lightbox & Overlays
- **Opening**: Dims page and animates image from thumbnail to center (scale up and fade in over ~250 ms)
- **Product Panel**: Slides in from right side of lightbox
- **Closing**: Reverses the animation

### Mini‑cart
- **Animation**: Slides in from right over ~300 ms, darkening rest of page with semi‑transparent overlay

### Lookbook Hotspots
- **Appearance**: Small white dots fade in on hover
- **Interaction**: Clicking triggers lightbox overlay with product information

### Video Support
- **Status**: No videos observed; animated posters treated as static images

## Accessibility (A11y)

### Semantic Structure
- **Headings**: H1–H3 used to separate major sections
- **Product Titles**: Emphasised semantically (e.g., `<h3>`)

### Landmark Roles
- **Header**: Uses `role="banner"`
- **Tab Navigation**: Uses `role="tablist"` with `aria-selected` on active tab
- **Modals**: Mini‑cart and product overlays declare `role="dialog"` with `aria-modal="true"`

### Keyboard Support
- **Navigation**: All actionable elements reachable via Tab
- **Focus**: Size and color selectors provide visible focus outlines
- **Activation**: Pressing Enter on focused selector toggles it
- **Modal Controls**: ESC closes modals
- **Quantity**: Quantity stepper accessible via arrow keys

### Screen‑reader Text
- **Images**: Alt text derived from product names or descriptive captions
- **Chips**: "View Products" chips use `aria-label` to indicate they open product details
- **Hotspots**: Lookbook hotspots provide `aria-label` such as "Shop this look"

### Contrast
- **Primary Text**: #111 on white provides contrast ratio > 12:1
- **Chip Backgrounds**: #111 on #F3F4F6 or vice‑versa maintain > 4.5:1 contrast
- **Sale Badges**: Red sale badges (#E11D48) on white just meet 4.5:1 (should be checked on smaller text)

### Reduced Motion
- **Preferences**: Site respects users with reduced motion preferences
- **Adjustments**: Slide and fade durations reduce to ~100 ms; parallax effects disabled

## Data, APIs & Storage

### Endpoints

#### Configuration API
```
https://api.maker.co/api/get_config?config_id=…
```
Fetches Maker configuration for this microsite (includes tabs, categories, products)

#### Media API
```
https://api.maker.co/api/get_media?media_id=…
```
Retrieves media details for lightbox overlays

#### Cart API
```
https://api.maker.co/api/add_to_cart
```
Invoked when adding item to cart; payload includes product ID, variant (size/colour) and quantity

```
https://api.maker.co/api/cart
```
Returns current cart items and totals when mini‑cart is opened

#### Product Details
- **Source**: Pulled from Shopify/Cloudinary via pre‑fetched URLs
- **Pattern**: Follows Shopify's pattern (cdn.shopify.com/...)

### URL Parameters & Query Model
- **Maker Parameters**: Uses QNTabId, QNCategoryId, QNProductId, QVMediaId, and QVMediaParentId
- **Function**: Determine which tab, category, product or media overlay to render
- **Updates**: Changing chip updates QNCategoryId while keeping same QNTabId

### LocalStorage/Session Cookies
- **Cart Storage**: `maker-cart` key holds JSON array of cart items (product IDs, variant IDs, quantities)
- **Configuration Cache**: Another key caches Maker configuration to speed up reloads
- **Session Tracking**: Cookies track session IDs and analytics tokens

### Analytics Events
- **Events**: Maker fires events like `view_item`, `add_to_cart`, `open_cart`, `close_cart`, `view_media`, `filter_category`
- **Payloads**: Include content ID, product ID, variant, and timestamp
- **Destination**: Sent to `api.maker.co/analytics`

## Performance & Tech Fingerprint

### Framework
- **Platform**: Runs Maker's client‑side platform
- **Scripts**: Script tags reference compiled BuckleScript modules (e.g., `ConfigurationDecoder.bs.*.js`)
- **Components**: Components for list pages, product overlays and sliders
- **Carousel Library**: Presence of swiper classes indicates Swiper.js is used

### Asset Strategy
- **Preconnect**: Links to `cdn.shopify.com`, `res.cloudinary.com` and `api.maker.co` reduce DNS lookups
- **Preloading**: CSS (smartnav‑v3.css) and JS modules are preloaded
- **Images**: Use lazy loading and responsive srcset
- **Code Splitting**: No explicit code splitting visible at page level; heavy modules (product overlay, lookbook slider) are lazy‑loaded when triggered

### Performance Observations
- **Initial Load**: Quick loading because heavy assets (lookbook images, product overlays) are deferred
- **Interactions**: Adding items to cart and filtering categories happen client‑side with minimal delay (<400ms)
- **Responsiveness**: Site remains responsive across interactions

## Edge, Error & Empty States

### Error Pages
- **404/500**: Not encountered; navigating to unknown QNCategoryId IDs likely returns empty grid with "Nothing here" message

### Empty Categories
- **Display**: If collection has no products, product carousel shows placeholder tile
- **Message**: "No products found in this collection"
- **Action**: Link back to Shop page

### Cart Empty
- **Display**: When cart is empty, mini‑cart overlay shows illustration
- **Message**: "Your cart is empty"
- **Action**: "Continue shopping" button

### Size Not Selected
- **Trigger**: Clicking "Add to Cart" without selecting size
- **Display**: Shows inline error message in red
- **Behavior**: Prevents adding to cart

### Network Errors
- **Handling**: If API calls fail, toast appears at bottom
- **Message**: "Something went wrong. Please try again."
- **Interface**: Remains interactive

---

*This comprehensive document captures the visual design foundations, navigation structure, component library, page templates, interaction flows, accessibility considerations, data APIs, performance observations and error states needed to recreate the site's experience without direct code reuse.*