# 🚀 Local Deployment Testing Guide

This guide helps you test deployments locally to catch errors faster than deploying to Vercel every time.

## 🎯 Quick Start

### For Ultra-Fast Feedback (30 seconds)
```bash
npm run quick-check
# or for specific apps:
./scripts/quick-test.sh admin
./scripts/quick-test.sh public
```

### For Comprehensive Validation (2-3 minutes)
```bash
npm run validate
# or for specific apps:
npm run validate:admin
npm run validate:public
```

### For Full Deployment Simulation (5+ minutes)
```bash
npm run deploy:simulate
# or for specific apps:
npm run deploy:simulate:admin
npm run deploy:simulate:public
```

## 🛠️ Available Commands

| Command | Speed | Purpose | When to Use |
|---------|-------|---------|-------------|
| `npm run quick-check` | ⚡ 30s | Type check + lint | After small changes |
| `npm run validate` | 🔍 2-3min | Full Vercel simulation | Before deploying |
| `npm run deploy:simulate` | 🚀 5+min | Complete deployment test | Major changes/releases |
| `npm run pre-deploy` | ✅ 2-3min | Final deployment check | Right before Vercel deploy |

## 🎮 VS Code Integration

Use **Ctrl+Shift+P** → **Tasks: Run Task** → Select:

- **⚡ Quick Check** - Fastest error detection
- **🔍 Validate Deployment** - Full validation
- **🚀 Simulate Deployment** - Complete simulation
- **✅ Pre-Deploy Check** - Final check before deployment

## 📋 What Each Tool Checks

### Quick Check (`npm run quick-check`)
- ✅ TypeScript compilation
- ✅ ESLint/Biome linting  
- ✅ Basic build readiness
- ✅ Dependency consistency
- ⏱️ Estimated build time

### Full Validation (`npm run validate`)
- ✅ All quick check items
- ✅ Production build simulation
- ✅ Environment variable validation
- ✅ Security vulnerability scan
- ✅ Test suite execution
- ✅ Build output verification
- ✅ Vercel config validation

### Deployment Simulation (`npm run deploy:simulate`)
- ✅ All validation items
- ✅ Local server startup (production mode)
- ✅ Health checks on all endpoints
- ✅ Integration testing
- ✅ Performance validation
- 🌐 Live testing URLs

## 🔧 Configuration

### Environment Variables
The validation uses mock environment variables from `scripts/env.validation`. 

To use real environment variables:
1. Copy your production `.env` to `.env.local`
2. The scripts will automatically pick them up

### Customizing Validation
Edit `scripts/validate-deployment.js` to:
- Add custom checks
- Modify validation criteria
- Add app-specific logic

## 💡 Workflow Recommendations

### Daily Development
```bash
# After making changes
npm run quick-check

# If all good, continue coding
# If issues, fix them before continuing
```

### Before Major Commits
```bash
# Full validation
npm run validate

# If all good, commit and push
# If issues, fix before committing
```

### Before Deploying to Vercel
```bash
# Final check
npm run pre-deploy

# Only deploy if this passes
```

### Debugging Deployment Issues
```bash
# Test specific app
npm run deploy:simulate:admin

# Check browser console at http://localhost:3001
# Verify all functionality works
```

## 🚨 Troubleshooting

### "Command not found" errors
```bash
chmod +x scripts/*.sh
```

### TypeScript errors during validation
```bash
npm run type-check
# Fix errors shown, then re-run validation
```

### Build failures
```bash
npm run clean
npm install
npm run validate
```

### Port conflicts during simulation
```bash
# Kill existing processes
pkill -f "next start"
# Or change ports in scripts/local-deployment.sh
```

## ⚡ Performance Tips

1. **Use quick-check frequently** - It's designed to be run after every change
2. **Run validation before important commits** - Catches issues early
3. **Use app-specific commands** - Faster when working on one app
4. **Keep the simulation running** - Test thoroughly before stopping

## 🆚 Comparison with Vercel

| Aspect | Local Testing | Vercel Deploy |
|--------|---------------|---------------|
| **Speed** | 30s - 5min | 2-10min |
| **Cost** | Free | Free (with limits) |
| **Accuracy** | 95% similar | 100% production |
| **Debugging** | Full access | Limited logs |
| **Iteration** | Instant | Wait for deploy |

## 🎯 Success Metrics

You'll know this setup is working when:
- ✅ You catch 90%+ of errors locally
- ✅ Vercel deployments rarely fail
- ✅ You spend less time waiting for deploys
- ✅ You have more confidence in deployments

## 📚 Advanced Usage

### Running in CI/CD
```yaml
# GitHub Actions example
- name: Validate Deployment
  run: npm run validate
```

### Custom Validation Scripts
```bash
# Add to package.json
"validate:custom": "node scripts/validate-deployment.js --custom-checks"
```

### Integration with Git Hooks
```bash
# In .git/hooks/pre-push
#!/bin/sh
npm run quick-check
```

---

**💡 Pro Tip**: Start with `npm run quick-check` after every change, then use `npm run validate` before important commits. This workflow will save you hours of deployment debugging!
