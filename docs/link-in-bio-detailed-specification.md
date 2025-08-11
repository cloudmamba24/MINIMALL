# Link-in-Bio Detailed Specification

## Executive Snapshot

### Site Purpose & Positioning
GREAT.STORE's Maker‑hosted "link in bio" microsite is essentially a shoppable landing page. It combines the feel of an Instagram feed with ecommerce functionality—visitors can browse lifestyle media, open shoppable posts, filter a product catalogue and flip through a lookbook—all without leaving the page. When ready to purchase, they are directed to the main Great.Store domain.

### Primary User Journeys

#### Discover on Instagram Tab
The default landing tab presents a multi‑row grid of 1:1 media cards reminiscent of an Instagram feed. Hovering reveals tiny bag icons for shoppable posts. Clicking any card opens a lightbox with left/right navigation; a right‑hand panel lists "Products in this image" and each product can be opened in a quick‑view overlay. Some cards include bespoke overlays such as a "Search" bar graphic or "Coming Soon" poster; these still trigger the same lightbox behaviour.

#### Shop by Category or Collection
Switching to the Shop tab displays a hero strip and a "Continue shopping" panel summarising items in the cart. Below, filter chips (New, Bestsellers, Hoodies, T‑shirts, Sale) control a horizontal product carousel. Circular collection chips (#BEACH, ICONIC, XMAS, etc.) filter an image grid. Users can click any product card to open a quick‑view overlay where they choose size/colour and add to cart.

#### Browse the Lookbook
The Lookbook tab delivers an editorial experience: full‑width photos, alternating image/text sections and hotspots (small white dots) embedded on images. Clicking a hotspot opens the same quick‑view overlay used elsewhere.

#### Product Exploration & Purchasing
Quick‑view overlays show a gallery, size and colour selectors, quantity steppers, description and related products. The "Add to Cart" button pops the item into a mini‑cart. Users can adjust quantities or proceed to checkout, which opens on the primary Great.Store site.

### Design System Vibe
The site leans into a minimalist, high‑fashion aesthetic. Black and white dominate, with plenty of white space and uppercase sans‑serif typography. Accent colours (bright red sale badges, vivid blue for "New Arrival" labels) punctuate the neutral palette. Components have modest border radii and light elevation; animations use gentle fades and slides to maintain an editorial feel.

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
    "md: 0 4px 8px rgba(0,0,0,0.10)"
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
    "accent": {
      "sale": "#E11D48",
      "new": "#1D4ED8"
    }
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

#### Instagram Tab (Default)
- **URL**: `https://mkr.bio/greatstore` loads the Instagram‑style feed
- **Header Elements**: Brand logo, tagline, social icons and "Visit Great.Store" CTA at the top
- **Navigation**: Tab bar (Instagram, Shop, Lookbook) follows header
- **Layout**: Three‑column grid on desktop (2 columns on tablet, 1 on mobile)
- **Card Types**: Each card is clickable and may contain overlay label (e.g., "Coming Soon", search graphic)
- **Shopping Indicators**: Cards with products show tiny shopping bag icon; clicking opens lightbox with product panel

#### Shop Tab
- **URL**: `https://mkr.bio/greatstore?QNTabId=navigation&QNCategoryId={id}` displays shopping catalogue
- **Hero Section**: Hero strip sits above "Continue Shopping" (visible when cart has items)
- **Category Filters**: Category chips (New, Bestsellers, Hoodies, T‑shirts, Sale) control horizontal product carousel
- **Collections**: Round collection chips (#BEACH, ICONIC, XMAS, YOU, #GLCL)
- **Content Grid**: Vertical image grid with parallax effect anchors bottom of page

#### Lookbook Tab
- **URL**: `…?QNTabId=navigation&QNCategoryId={id}` with different QNCategoryId loads editorial lookbook
- **Layout**: Features hero collage and alternating image/text sections
- **Interactive Elements**: Product hotspots embedded in images

#### Media Lightbox Overlay
- **Trigger**: Clicking media card on Instagram or lookbook hotspot
- **Display**: Overlays page with image or video and left/right arrows
- **Product Integration**: Right drawer lists "Products in this image" with product cards opening quick‑view overlay

#### Product Overlay (Quick View)
- **Access**: Opened from product cards, hotspots or lightbox's product list
- **Animation**: Slides out from right (covers screen on mobile)
- **Content**: Contains gallery, selectors and add‑to‑cart button

#### Mini Cart
- **Access**: Via bag icon in header or automatically when product added
- **Animation**: Slides in from right
- **Content**: Lists items, quantity steppers and total

#### Checkout
- **Location**: External page on main Great.Store domain
- **Transition**: Microsite stops at mini‑cart; clicking "Checkout" navigates externally

### Routing Patterns

```json
{
  "routes": [
    { "pattern": "/greatstore", "notes": "Instagram feed with tab bar" },
    { "pattern": "/greatstore?QNTabId=navigation&QNCategoryId=:id", "notes": "Shop or Lookbook pages controlled by Maker category ID" },
    { "pattern": "/greatstore?…&QVMediaId=:mediaId", "notes": "Lightbox overlay for a specific media asset" },
    { "pattern": "/greatstore?…&QNProductId=:productId", "notes": "Quick‑view overlay for a product" }
  ]
}
```

### Header, Navigation & Footer Behaviors

#### HeaderBar
- **Logo**: Black circle logo with uppercase brand name
- **Elements**: Tagline and social icons (Instagram, TikTok, Twitter)
- **CTA**: Black‑bordered button labeled "Visit Great.Store" opens main ecommerce site
- **Scroll Behavior**: Header and tab bar are not sticky; scroll out of view until returning to top

#### Tab Navigation
- **Items**: Three tabs ("INSTAGRAM", "SHOP", "LOOKBOOK") live directly under header
- **Functionality**: Function like anchor links; switching tabs updates query parameters and loads new content without page refresh
- **Visual States**: Active tab indicated with bold underline and darker text
- **Layout**: Horizontally centered and appears consistently on desktop and mobile

#### Navigation Elements
- **Back Arrow**: On pages deeper than root (e.g., overlay states) left‑pointing arrow appears at far left of header row; closes current overlay or returns to prior tab; may collapse into single stacked nav row on mobile
- **Cart Icon**: Bag icon sits in top right with small circular badge showing item count; clicking toggles mini cart; badge updates in real time when items added

#### Footer
- **Status**: No dedicated footer; page ends after last section
- **External**: External footers handled on main site

### Search & Filters

#### Search Functionality
- **Global Search**: Microsite does not include global search box
- **Filtering Method**: Done via chips

#### Category Chips
- **Location**: Appear in horizontal bar
- **Options**: New, Bestsellers, Hoodies, T‑shirts, Sale
- **Behavior**: Only one chip active at a time; clicking triggers quick fade‑out of old products and fade‑in of new ones

#### Collection Chips
- **Format**: Small circular avatars labeled NEW IN, #BEACH, ICONIC, XMAS, YOU, #GLCL
- **Function**: Control vertical image grid
- **Interaction**: Each chip scrolls grid into view and updates URL to reflect selected collection

#### Instagram Feed Search
- **Visual Element**: Some posts contain graphic that looks like search bar ("great store hoodies – Search")
- **Functionality**: Part of image, not functional input

## Component Library

### MediaCard (Instagram Grid)

```json
{
  "name": "MediaCard",
  "purpose": "Displays a photo or poster in the Instagram feed grid.",
  "anatomy": ["container","image","overlayChip","bagIcon"],
  "props": {
    "type": ["image","poster"],
    "hasProducts": "boolean",
    "overlayLabel": "string or null"
  },
  "states": ["default","hover","focus","pressed"],
  "interactions": [
    "hover: if hasProducts, show small shopping bag icon in bottom‑left and subtle zoom on image",
    "click: open lightbox overlay with the media centred and product panel"
  ],
  "layout": {
    "width_px": 300,
    "height_px": 300,
    "margin_px": 8,
    "imageRadius_px": 8
  },
  "typography": {
    "overlayLabel": { "size_px": 12, "weight": 600, "color": "#FFFFFF", "transform": "uppercase" }
  },
  "colors": {
    "overlayBg": "rgba(17,17,17,0.6)",
    "iconBg": "#FFFFFF",
    "iconColor": "#111111"
  },
  "dataBindings": {
    "inputs": ["mediaUrl","thumbnail","productRefs[]","overlayLabel"],
    "outputs": ["onClick -> openLightbox(mediaId)"]
  },
  "accessibility": {
    "role": "button",
    "altTextRule": "Describe the photo or poster succinctly.",
    "aria": ["aria-label on wrapper summarising image content"]
  }
}
```

### ProductCard (Shop Carousel & Grid)

```json
{
  "name": "ProductCard",
  "purpose": "Shows a product summary in carousels and grids.",
  "anatomy": ["image","badgeStack","title","priceRow","variantIcons"],
  "props": {
    "labels": { "sale": "boolean", "bestseller": "boolean", "newArrival": "boolean" },
    "imageAspect": ["4:5"],
    "showVariants": "boolean"
  },
  "states": ["default","hover","focus"],
  "interactions": [
    "hover: card elevates slightly and shadow deepens",
    "click: open quick‑view overlay"
  ],
  "contentRules": {
    "titleMaxChars": 50,
    "priceFormats": ["$48","$48 $56","$29 – $34"],
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
    "aria": ["aria-labelledby linking card wrapper to product name"]
  }
}
```

### CategoryChip & CollectionChip

```json
{
  "name": "CategoryChip",
  "purpose": "Filter products in the Shop tab by category.",
  "anatomy": ["chip"],
  "props": { "label": "string", "active": "boolean" },
  "states": ["default","active","hover","focus"],
  "interactions": ["click: updates QNCategoryId and refreshes the product list"],
  "layout": { "height_px": 32, "padding_x_px": 12, "radius_px": 16, "gap_px": 8 },
  "typography": { "label": { "size_px": 14, "weight": 500 } },
  "colors": { "defaultBg": "#F3F4F6", "activeBg": "#111111", "defaultText": "#111111", "activeText": "#FFFFFF" },
  "accessibility": { "role": "tab", "aria-selected": "active" }
}
```

```json
{
  "name": "CollectionChip",
  "purpose": "Filter the Shop grid by collection (e.g., NEW IN, #BEACH).",
  "anatomy": ["avatar","label"],
  "props": { "imageUrl": "string", "label": "string", "active": "boolean" },
  "states": ["default","active","hover"],
  "interactions": ["click: scroll image grid into view and update collection"],
  "layout": { "width_px": 64, "height_px": 80, "gap_px": 8 },
  "typography": { "label": { "size_px": 10, "weight": 500, "align": "center" } },
  "accessibility": { "role": "button", "aria-label": "Filter by collection" }
}
```

### ProductOverlay (Quick View)

```json
{
  "name": "ProductOverlay",
  "purpose": "Presents detailed product information in a side panel.",
  "anatomy": ["wrapper","gallery","infoSection","selectors","quantityStepper","actionButtons","description","relatedProducts"],
  "props": { "productId": "string", "images": "array", "sizes": "array", "colors": "array", "price": "string", "description": "string", "relatedProducts": "array" },
  "states": ["idle","sizeMissing","adding","added","error"],
  "interactions": [
    "select size: toggles selected state; required before adding",
    "select colour: updates selection and swatch border",
    "change quantity: +/- buttons adjust a numeric field (min 1)",
    "add to cart: button shows spinner then opens mini cart",
    "view details: link navigates to external PDP"
  ],
  "layout": {
    "width_px": 420,
    "padding_px": 16,
    "gap_px": 12
  },
  "typography": {
    "title": { "size_px": 20, "weight": 700 },
    "price": { "size_px": 18, "weight": 600 },
    "description": { "size_px": 14, "weight": 400 }
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
    "aria": ["aria-modal=true","aria-label set to product title"]
  }
}
```

### MiniCart

```json
{
  "name": "MiniCart",
  "purpose": "Displays cart contents in a sliding side panel.",
  "anatomy": ["backdrop","panel","itemList","subtotal","actions"],
  "props": { "items": "array", "total": "string" },
  "states": ["closed","opening","open","closing"],
  "interactions": [
    "click bag icon: open mini cart",
    "click backdrop or close button: close panel",
    "adjust quantity: +/- steppers per item",
    "remove item: trash icon or 'Remove' link",
    "checkout: navigate to external checkout",
    "continue shopping: close panel"
  ],
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
  "purpose": "Composes editorial sections in the Lookbook tab.",
  "anatomy": ["gridContainer","imageTiles","headline","subheadline","cta"],
  "props": { "images": "array", "headline": "string", "paragraph": "string", "ctaText": "string", "ctaLink": "string" },
  "states": ["default"],
  "interactions": [
    "scroll: images parallax slightly at different speeds",
    "click hotspot: open product overlay"
  ],
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
  "purpose": "Displays branding, tagline, social icons, CTA and tab navigation at the top of the page.",
  "anatomy": ["logo","tagline","socialIcons","ctaButton","tabNav"],
  "props": { "activeTab": "Instagram|Shop|Lookbook" },
  "states": ["default","scrolled"],
  "interactions": [
    "click logo: scroll to top",
    "click social icon: open respective social profile in new tab",
    "click CTA: open main ecommerce site",
    "click tab: switch between Instagram, Shop and Lookbook"
  ],
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

### InstagramHome (Default Tab)

```json
{
  "template": "InstagramHome",
  "sections": [
    { "name": "HeaderBar", "height_px": 200 },
    { "name": "MediaGrid", "behaviors": ["3 columns on desktop","2 columns on md","1 column on mobile"], "gap_px": 16 }
  ],
  "pagination": { "type": "infinite scroll", "trigger": "scroll near bottom", "pageSize": 24 }
}
```

### Shop Template

```json
{
  "template": "Shop",
  "sections": [
    { "name": "HeroStrip", "height_px": 360, "motion": "parallax fade" },
    { "name": "ContinueShopping", "height_px": 200, "behaviors": ["hidden when cart empty"] },
    { "name": "CategoryFilter", "height_px": 48 },
    { "name": "ProductCarousel", "cols": { "sm": 2, "md": 3, "lg": 5 }, "cardGap_px": 24 },
    { "name": "CollectionSelector", "height_px": 80, "scrollable": true },
    { "name": "ImageGrid", "cols": { "sm": 1, "md": 2, "lg": 4 }, "gap_px": 24 }
  ],
  "pagination": { "type": "horizontal carousels", "trigger": "scroll within row", "pageSize": 6 }
}
```

### Product Overlay Template

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
    ] }
  ],
  "pagination": { "type": "none" }
}
```

### Lookbook Template

```json
{
  "template": "Lookbook",
  "sections": [
    { "name": "HeroCollage", "height_px": 480 },
    { "name": "EditorialSections", "behaviors": ["alternating image/text layout","hotspots embedded in images"] },
    { "name": "FloatingBackToTop", "position": "bottom-left", "size_px": 40 }
  ],
  "pagination": { "type": "scroll" }
}
```

## Interaction Flows

### Add to Cart Flow

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
    "SizeMissing": "Display red helper text 'Please select a size' below size selector.",
    "Adding": "Add button shows spinner (~200 ms minimum).",
    "Added": "Mini cart slides in with updated item count and toast message.",
    "Error": "Show inline error message; overlay remains open."
  }
}
```

### Open Media Quick View Flow (Instagram & Lookbook)

```json
{
  "flow": "OpenMediaQuickView",
  "states": ["Thumbnail","Lightbox","ProductPanel","ProductOverlay","Closed"],
  "events": ["clickThumbnail","clickProductCard","close"],
  "transitions": {
    "Thumbnail.clickThumbnail": "Lightbox",
    "Lightbox.clickProductCard": "ProductOverlay",
    "Lightbox.close": "Closed",
    "ProductOverlay.close": "Lightbox"
  },
  "uiFeedback": {
    "Lightbox": "Page dims and the media enlarges; left/right arrows allow navigation.",
    "ProductPanel": "Right panel lists products in the image; not visible for posts without products.",
    "ProductOverlay": "Side panel with selectors, description and add‑to‑cart button.",
    "Closed": "Return focus to the grid or lookbook section."
  }
}
```

### Filter by Category Flow

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
    "Loading": "Current products fade out and skeleton cards appear for ~300 ms.",
    "Filtered": "New products fade in; selected chip adopts dark background and white text."
  }
}
```

### Mini Cart Flow

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
    "Open.checkout": "redirect"
  },
  "uiFeedback": {
    "Opening": "Mini cart slides in from right over ~300 ms and page content darkens.",
    "Closing": "Panel slides out and overlay fades away.",
    "updateQty/removeItem": "Quantities and totals update instantly without reloading the page."
  }
}
```

## Forms & Validation

### Size Selector
- **Requirement**: Required in product overlay
- **Validation**: Clicking "Add to Cart" without selecting size triggers red helper message underneath size grid

### Quantity Stepper
- **Controls**: Pair of buttons labelled "–" and "+" adjust quantity
- **Constraints**: Value cannot go below 1 and is not directly editable via keyboard

### Colour Selector
- **Display**: Swatches displayed as circles or small thumbnails
- **Selection**: Only one may be active at a time
- **Visual Feedback**: Active swatch shows border

### Mini Cart Controls
- **Item Controls**: Quantity steppers and "Remove" links provided for each cart item
- **Checkout**: "Checkout" button is simple anchor that navigates to external checkout page
- **Forms**: Microsite contains no payment or address forms

### Keyboard Behavior
- **Navigation**: All buttons and interactive elements reachable via tabbing
- **Activation**: Pressing Enter activates focused control
- **Modal Control**: ESC closes lightboxes and overlays

## Media & Motion

### Images
- **Implementation**: Use responsive img elements with `object-fit: cover`
- **Aspect Ratios**:
  - Instagram feed cards: 1:1 ratio
  - Product cards in Shop tab: 4:5
  - Lookbook images: vary but often fill available columns while maintaining aspect ratio
- **Quality**: High‑density images (2×) supplied via srcset

### Lazy Loading
- **Behavior**: Off‑screen images defer loading until near viewport
- **Placeholders**: Show blurred thumbnail or empty container

### Lightbox & Overlays
- **Animation**: Opening lightbox gently scales image from thumbnail and fades in over ~250 ms
- **Product Overlay**: Slides in from right over ~250 ms with easing curve

### Mini Cart
- **Animation**: Appears via slide‑in transition (about 300 ms) and dims rest of page
- **Closing**: Reverses animation
- **Reduced Motion**: On devices with `prefers‑reduced‑motion`, slide distances shrink and durations shorten (~100 ms)

### Hover Interactions
- **Product Cards**: Elevate and lighten shadows on hover
- **Instagram Cards**: Shoppable cards show small bag icon; icon fades in over ~150 ms

## Accessibility (A11y)

### Semantic Structure
- **Header**: Uses `<header>` element with proper `role="banner"`
- **Tab Bar**: `role="tablist"` with each tab as `role="tab"` and `aria-selected` on active tab
- **Modals**: Product overlays and mini cart are dialogs (`role="dialog"` with `aria-modal="true"` and labelled by product title or heading)

### Focus Management
- **Modal Behavior**: Opening any overlay traps focus within it
- **Initial Focus**: First interactive element receives focus automatically
- **Close Controls**: Close buttons have clear focus styles and ESC closes overlay
- **Return Focus**: When overlay closes, focus returns to triggering element (e.g., product card or media tile)

### Keyboard Navigation
- **Traversal**: Users can traverse all interactive elements via Tab
- **Controls**: Size, colour and quantity controls use buttons so they are inherently focusable
- **Lightbox**: Navigation arrows respond to left/right arrow keys
- **Labels**: Bag icon and cart's close button have descriptive `aria-label` attributes

### Screen Reader Labels
- **Images**: Include alt text derived from product titles or descriptive captions
- **Icons**: Bag icon uses `aria-label="Open cart"`
- **Hotspots**: Hotspot dots in lookbook read "Shop this product"
- **Hidden Text**: Indicates number of items in cart
- **Tab Controls**: Each tab sets `aria-controls` pointing to corresponding panel

### Contrast & Colour
- **Primary Text**: #111 on white background yields high contrast (> 12:1)
- **Interactive Elements**: Active chips and buttons invert to white on black to maintain > 7:1 contrast
- **Accent Colours**: Sale red, new blue also meet WCAG AA for given font sizes

### Reduced Motion
- **Media Query**: Microsite respects `prefers-reduced-motion` media query
- **Adjustments**: Shortens or disables non‑essential animations (e.g., parallax effects) and avoids long slide transitions

## Data, Storage & Analytics

### Local Storage
- **Cart Persistence**: `maker-cart` key stores array of cart items with product IDs, variant identifiers and quantity; keeps cart persistent between page refreshes
- **Configuration Cache**: Another key caches Maker configuration JSON to reduce load times

### Query Parameters
- **Query Model**: Microsite relies on Maker's query model
- **Parameters**:
  - `QNTabId`: Determines which top‑level tab to display
  - `QNCategoryId`: Picks category or collection
  - `QVMediaId`: Identifies current media in lightbox
  - `QNProductId`: Opens specific product overlay
- **Updates**: Changing these params updates view via client‑side routing

### Analytics
- **Event Collection**: Interaction events (view media, add to cart, open cart, select category, etc.) collected for analytics
- **Event Data**: Each event includes event name, timestamp and relevant identifiers (product ID, category ID)
- **Implementation**: Analytics calls abstracted away by Maker's internal JS and not configurable via microsite

### External API Calls
- **Demo Status**: Microsite is demo and does not require developer to integrate with external APIs
- **Data Source**: Product data, images and configuration pre‑fetched by Maker's platform
- **Development Note**: When building clone, mimic asynchronous loading and state updates without implementing network requests

## Performance & Technical Notes

### Framework & Libraries
- **Platform**: Built with Maker's in‑browser runtime
- **Technology Stack**: Uses React components, CSS modules and Swiper.js library for carousels
- **Development Note**: When rebuilding, only need to reproduce behavior and styling—not underlying tech

### Asset Loading
- **Optimization**: Preconnect and preload tags reference remote resources (Shopify images, Cloudinary assets)
- **Content**: Demo content should be replaced with your own images
- **Loading Strategy**: Lazy loading ensures first contentful paint remains fast

### Interaction Responsiveness
- **Client-Side**: All interactive transitions occur client‑side
- **Network Requests**: No blocking network requests on user interaction (aside from analytics)
- **Performance**: Filtering products or adding to cart updates UI immediately then syncs to storage

## Edge, Error & Empty States

### 404 or Invalid Category
- **Behavior**: Attempting to load unknown QNCategoryId results in empty product grid
- **Message**: Neutral message ("No products found in this collection")
- **Navigation**: Link back to Shop tab
- **404 Page**: No dedicated 404 page within microsite

### Empty Cart
- **Display**: When no items in cart, mini cart shows illustration
- **Message**: Text "Your cart is empty"
- **Action**: Button labelled "Continue shopping" that dismisses panel

### Missing Size Selection
- **Trigger**: In product overlay, clicking "Add to Cart" without choosing size
- **Visual Feedback**: Highlights size grid in red
- **Message**: Shows helper message prompting selection

### Network Errors
- **Demo Status**: Because this is demo using Maker's offline configuration, there is no dynamic data fetching
- **Real Integration**: In real integration, Maker components handle failures by showing toast notifications ("Something went wrong. Please try again.") while preserving user's state

### Infinite Scroll End
- **Behavior**: Instagram feed uses manual "infinite" scrolling
- **End State**: When no more posts available, grid simply stops populating
- **Message**: No explicit "End of feed" message

---

*This expanded report provides precise descriptions of Instagram feed interactions (including lightbox/product overlays), refined design tokens, comprehensive component definitions, updated page templates, interaction state machines, accessibility guidelines, and clarifications on data handling (no external API calls needed for demo store). The specification serves as a complete guide for recreating the site's experience and functionality.*