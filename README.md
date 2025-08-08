# MiniMall - Ultra-Fast Link-in-Bio Platform

A high-performance, edge-first link-in-bio platform built specifically for Shopify merchants. Delivers sub-1.5 second load times globally with seamless commerce integration.

## 🚀 Features

- **⚡ Ultra-Fast Performance**: <1.5s LCP with edge computing and React Server Components
- **🛒 Native Shopify Integration**: Direct cart and checkout flow integration
- **📱 Mobile-First Design**: Responsive, app-like experience optimized for mobile
- **🎨 JSON-Driven Rendering**: Instant config updates without code deployments
- **🌐 Global Edge Distribution**: Powered by Cloudflare R2 and Vercel Edge Runtime
- **⚙️ Embedded Admin**: Full configuration interface within Shopify admin

## 🏗️ Architecture

This is a monorepo built with:

- **Frontend**: Next.js 14 with React Server Components
- **Styling**: Tailwind CSS 3.4 with shadcn/ui components
- **Backend**: tRPC for type-safe APIs
- **Database**: Drizzle ORM with PlanetScale/Neon
- **Storage**: Cloudflare R2 for JSON configs and assets
- **Deployment**: Vercel Edge Runtime for global performance

### Project Structure

```
├── apps/
│   ├── public/         # Customer-facing link-in-bio sites (Edge Runtime)
│   └── admin/          # Shopify embedded admin interface
├── packages/
│   ├── core/           # Shared types, utilities, and business logic
│   ├── ui/             # Reusable UI components (shadcn/ui based)
│   └── db/             # Database schemas and migrations (Drizzle)
└── ContextFiles/       # Project specifications and documentation
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ 
- npm/pnpm/yarn
- Shopify Partner Account
- Cloudflare R2 Account
- Database (PlanetScale recommended for production, Neon for staging)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cloudmamba24/minimall.git
   cd minimall
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp ContextFiles/Keys.example.txt ContextFiles/Keys.txt
   # Edit Keys.txt with your actual API credentials
   ```

4. **Configure environment files**
   Create `.env.local` files in both apps with the required variables:
   
   **apps/public/.env.local:**
   ```
   R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   R2_ACCESS_KEY=your_r2_access_key_id
   R2_SECRET=your_r2_secret_access_key
   R2_BUCKET_NAME=linkinbio-configs
   STOREFRONT_API_TOKEN=your_storefront_api_token
   NEXT_PUBLIC_BASE_URL=https://your-domain.com
   ```
   
   **apps/admin/.env.local:**
   ```
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret_key
   DATABASE_URL=your_database_connection_string
   NEXT_PUBLIC_SHOPIFY_API_KEY=your_api_key
   ```

5. **Set up database**
   ```bash
   cd packages/db
   npm run db:push  # Push schema to database
   ```

6. **Start development servers**
   ```bash
   npm run dev  # Starts both apps concurrently
   ```

   Or start individual apps:
   ```bash
   # Public site (http://localhost:3000)
   cd apps/public && npm run dev
   
   # Admin interface (http://localhost:3001)
   cd apps/admin && npm run dev
   ```

## 📖 Usage

### Creating a Link-in-Bio Site

1. **Install the Shopify App** (when ready for production)
2. **Configure Your Site** using the embedded admin interface
3. **Customize Design** with drag-and-drop builder
4. **Publish Changes** - updates go live globally within seconds

### Site URL Structure

- **Public Sites**: `https://yourdomain.com/g/{configId}`
- **Draft Preview**: `https://yourdomain.com/g/{configId}?draft={versionId}`

## 🔧 Technical Details

### Performance Budgets

- **LCP**: < 1.5 seconds (4G, Moto G4)
- **FID/INP**: < 120 milliseconds  
- **JS Bundle**: ≤ 120 KB (Brotli compressed)
- **CLS**: < 0.1
- **Edge Cold Start**: < 200 milliseconds

### JSON Configuration Schema

Sites are rendered from JSON configurations stored in Cloudflare R2:

```json
{
  "id": "config-id",
  "version": "1.0.0",
  "categories": [
    {
      "id": "instagram", 
      "title": "Instagram",
      "card": ["grid", { "shape": ["square"] }],
      "categoryType": ["feed", { 
        "displayType": "grid",
        "itemsPerRow": 3
      }]
    }
  ],
  "settings": {
    "theme": {
      "primaryColor": "#000000",
      "backgroundColor": "#FFFFFF"
    },
    "checkoutLink": "https://shop.myshopify.com/cart"
  }
}
```

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect Repository** to Vercel
2. **Configure Environment Variables** in Vercel dashboard
3. **Deploy**: Automatic deployments on push to main

### Environment Variables

Required for production deployment:

```bash
# Public App
R2_ENDPOINT=
R2_ACCESS_KEY=
R2_SECRET=
R2_BUCKET_NAME=
STOREFRONT_API_TOKEN=
NEXT_PUBLIC_BASE_URL=

# Admin App  
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
DATABASE_URL=
NEXT_PUBLIC_SHOPIFY_API_KEY=
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Lint code
npm run lint

# Type checking
npm run type-check

# Build for production
npm run build
```

## 📚 Documentation

- **[Context Files](./ContextFiles/)** - Detailed project specifications
- **[Technical Spec](./ContextFiles/MicroSite.txt)** - Complete technical requirements
- **[Development Guide](./ContextFiles/ToDevelopMicroSite.txt)** - Asset and setup checklist

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🔗 Links

- **Repository**: https://github.com/cloudmamba24/minimall
- **Issues**: https://github.com/cloudmamba24/minimall/issues
- **Shopify Partner Dashboard**: https://partners.shopify.com/

---

**Built with ❤️ for ultra-fast commerce experiences**