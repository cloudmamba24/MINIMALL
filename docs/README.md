# 📖 MINIMALL Documentation

**MINIMALL** is a dual-deployment Shopify embedded app that transforms e-commerce stores into social media link-in-bio platforms, allowing merchants to import and display Instagram posts, TikTok videos, and manual uploads with original captions, hashtags, and engagement metrics.

## 🏗️ Architecture

- **yourdomain.com**: Public link-in-bio app with social media content
- **admin.yourdomain.com**: Shopify embedded admin interface

## 🚀 Quick Setup

1. **Environment**: Use the comprehensive `.env.local` file in the project root with all required variables
2. **Database**: Set up PostgreSQL and run `npm run db:push`
3. **Social APIs**: Configure Instagram Basic Display API (required), TikTok API (optional)
4. **Shopify**: Create app in Shopify Partners with proper OAuth scopes
5. **Deploy**: `npm run build` for both apps

## 🔗 Social Media Integration

- **Instagram**: Real post importing via Instagram Basic Display API
- **TikTok**: Video importing (requires business verification)  
- **Manual**: Direct upload with caption/hashtag support
- **Layouts**: Instagram Grid, TikTok Vertical, Pinterest Masonry, Stories modes

## 🛠️ Development

```bash
npm install
npm run dev:admin    # http://localhost:3001
npm run dev:public   # http://localhost:3000
```

## 📡 API Endpoints

- `/api/debug/instagram` - Test Instagram API connection
- `/api/debug/tiktok` - Test TikTok API connection  
- `/api/debug/social-import` - Test social import flow
- `/api/debug/health` - Full system health check