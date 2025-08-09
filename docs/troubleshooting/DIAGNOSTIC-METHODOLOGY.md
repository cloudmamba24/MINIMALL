# Diagnostic Methodology - Root Cause Analysis Framework

> **Purpose**: Prevent solution-oriented thinking and enforce systematic problem diagnosis

## 🚨 STOP - Before You Start Fixing

**Read this framework BEFORE attempting any solutions. Force yourself to complete the diagnostic phase.**

---

## Phase 1: Evidence Collection (DO THIS FIRST)

### ❓ Critical Questions to Answer
Before proposing ANY solution, answer these completely:

1. **What EXACTLY is failing?**
   - [ ] Specific error messages (copy verbatim)
   - [ ] Which components/routes/features
   - [ ] ALL affected areas vs. working areas
   - [ ] Consistent failure pattern or intermittent?

2. **What is the SCOPE of the failure?**
   - [ ] Single feature/route vs. multiple vs. everything
   - [ ] Local development vs. staging vs. production
   - [ ] New issue vs. regression vs. existing issue

3. **What EVIDENCE do you have?**
   - [ ] Error logs (build, runtime, browser console)
   - [ ] Build output analysis
   - [ ] Network requests/responses
   - [ ] Configuration files content

### 🔍 Red Flags - Pattern Recognition Traps

**STOP if you're thinking:**
- "This looks like a [common issue] I've seen before..."
- "Let me try [quick fix] first..."
- "It's probably just a [simple thing]..."

**These thoughts indicate you're pattern-matching instead of diagnosing.**

---

## Phase 2: Root Cause Hypothesis

### 📊 Failure Pattern Analysis

| Failure Pattern | Likely Root Cause | Investigation Focus |
|------------------|-------------------|-------------------|
| **ALL routes/features fail** | Infrastructure/deployment | Configuration, build process, environment |
| **Some routes fail, others work** | Code/logic issues | Specific failing components |
| **Works locally, fails deployed** | Environment/deployment | Config differences, env vars, build process |
| **Intermittent failures** | External dependencies | APIs, databases, network |
| **New deployment fails** | Recent changes | Changed files, configuration, dependencies |

### 🎯 Hypothesis Formation Rules

1. **Evidence-Based Only**: Hypothesis must explain ALL observed symptoms
2. **Occam's Razor**: Simplest explanation that fits all evidence
3. **Testable**: Must be able to prove/disprove quickly

**Example Hypothesis Format:**
> "Based on the evidence that [ALL routes return 404] + [build succeeds with correct routes] + [works locally], the hypothesis is [Vercel deployment configuration issue] because [the app isn't being served at all]."

---

## Phase 3: Diagnostic Tests (Before Any Fixes)

### 🧪 Test Design Principles
- **Minimal**: Test one variable at a time
- **Definitive**: Clear pass/fail criteria
- **Progressive**: Start broad, narrow down

### Common Diagnostic Sequences

#### For Deployment Issues:
1. **Infrastructure Test**: Can the deployment serve ANY content?
2. **Build Test**: Is the app being built correctly?
3. **Configuration Test**: Are deployment configs valid?
4. **Environment Test**: Are required variables present?

#### For Runtime Issues:
1. **Isolation Test**: Reproduce in minimal environment
2. **Dependency Test**: Remove/mock external dependencies
3. **State Test**: Check application state at failure point
4. **Input Test**: Validate input data and edge cases

---

## Phase 4: Solution Implementation

### ⚠️ Solution Guidelines
- **One change at a time**: Test each fix independently
- **Document reasoning**: Why this fix addresses the root cause
- **Verify completely**: Ensure fix resolves ALL symptoms, not just some

### 🚫 Avoid These Anti-Patterns

1. **Shotgun Debugging**: Making multiple changes hoping one works
2. **Symptom Fixing**: Addressing visible problems without fixing root cause
3. **Assumption-Based**: "It's probably..." without verification
4. **Pattern-Only**: "This is usually caused by..." without evidence

---

## Self-Check Questions

**Ask yourself before each action:**

1. **Am I treating symptoms or root cause?**
2. **Do I have evidence for this approach?**
3. **Have I eliminated obvious explanations first?**
4. **Am I making assumptions about what's happening?**
5. **Would this solution explain ALL the symptoms I'm seeing?**

---

## Case Study: The 404 Deployment Failure

### ❌ What Went Wrong

**Observed**: All routes return 404 on deployment
**Pattern-Matched To**: "Routing issues" (wrong)
**Jumped To**: Code fixes, route debugging, environment variables

**Why This Failed**: 
- Ignored the critical clue: "ALL routes fail"
- Pattern-matched to previous similar-looking issues
- Started fixing code instead of diagnosing infrastructure

### ✅ What Should Have Happened

**Systematic Diagnosis**:
1. **Evidence**: ALL routes 404 + build succeeds + works locally = deployment issue
2. **Hypothesis**: Vercel isn't serving the Next.js app (infrastructure problem)
3. **Test**: Check vercel.json configuration and build output directory
4. **Root Cause**: Framework detection failure in monorepo
5. **Fix**: Correct vercel.json with explicit framework setting

**Result**: Single targeted fix instead of multiple unsuccessful attempts

---

## Quick Reference Checklist

Before making any changes:

- [ ] I have collected ALL error messages and symptoms
- [ ] I understand the FULL SCOPE of what's failing vs. working
- [ ] I have a TESTABLE hypothesis that explains all symptoms
- [ ] I have eliminated OBVIOUS causes first (config, environment, build)
- [ ] I am NOT pattern-matching to previous similar issues
- [ ] My proposed solution addresses the ROOT CAUSE, not symptoms

**If you can't check all boxes above, STOP and complete the diagnostic phase.**

---

*Remember: Diagnosis time is never wasted. Solution time without proper diagnosis usually is.*