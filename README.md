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
- **Linting**: Biome (replacing ESLint for better performance)
- **Database**: Drizzle ORM with PostgreSQL
- **Analytics**: Sentry error tracking and performance monitoring
- **Deployment**: Vercel with edge functions

### Project Structure

```
apps/
├── public/          # Customer-facing link-in-bio app
└── admin/           # Shopify embedded admin interface

packages/
├── core/            # Shared business logic
├── ui/              # Shared UI components
└── db/              # Database schema and migrations
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Shopify Partner account
- Instagram/TikTok API credentials (optional)

### Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your credentials

# Set up database
npm run db:push

# Start development servers
npm run dev:admin    # Admin interface (http://localhost:3001)
npm run dev:public   # Public app (http://localhost:3000)
```

### Available Scripts

```bash
npm run build        # Build all apps
npm run lint         # Run Biome linter
npm run type-check   # TypeScript checking
npm run test         # Run tests
```

## 📚 Documentation

- **[LINT_ARCHITECTURE.md](./LINT_ARCHITECTURE.md)** - Linting patterns and architecture decisions
- **[docs/](./docs/)** - Technical specifications and API documentation

## 🔧 Code Quality

This project uses **Biome** for fast linting and formatting:
- Zero configuration
- Better performance than ESLint
- Consistent code formatting
- See `LINT_ARCHITECTURE.md` for project-specific patterns

## 🚀 Deployment

Deploy to Vercel with our optimized configuration:

```bash
npm run build
# Deploy via Vercel dashboard or CLI
```

## 🤝 Contributing

1. Follow our linting standards (`npm run lint`)
2. Ensure type safety (`npm run type-check`)
3. Run tests (`npm run test`)
4. Follow conventional commits

## 📄 License

MIT License - see LICENSE file for details