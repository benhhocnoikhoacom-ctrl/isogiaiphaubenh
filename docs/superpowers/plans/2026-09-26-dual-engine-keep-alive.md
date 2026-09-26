# Dual-Engine Keep-Alive & 17:05 Overdue Sweep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Forever-Active Dual Engine Architecture (GitHub Actions + Vercel Cron) combined with daily 17:05 VN Overdue Sweep and Web warm-up.

**Architecture:** 
1. Endpoint API `/api/cron/keep-alive`: Runs Supabase keep-alive ping and triggers `syncTasksForCurrentPeriod()` for full overdue sweep and warm-up.
2. Layer 1 (GitHub Actions): Scheduled at `5 10 * * *` (17:05 VN) to ping Supabase, call Web API, and use `gautamkrishnar/keepalive-workflow@v2` to prevent 60-day auto-disable.
3. Layer 2 (Vercel Cron): Scheduled at `5 10 * * *` (17:05 VN) via `vercel.json` as an independent failsafe.

**Tech Stack:** Next.js Route Handler, Supabase REST API, GitHub Actions, Vercel Crons.

---

### Task 1: Create Cron API Endpoint
- File: `app/api/cron/keep-alive/route.ts`
- Purpose: Execute Supabase ping and `syncTasksForCurrentPeriod()` to update overdue tasks and warm serverless runtime.

### Task 2: Create Vercel Cron Configuration
- File: `vercel.json`
- Purpose: Configure Vercel native cron job to hit `/api/cron/keep-alive` daily at `5 10 * * *` (17:05 VN / 10:05 UTC).

### Task 3: Upgrade GitHub Actions Keep-Alive Workflow
- File: `.github/workflows/supabase-keep-alive.yml`
- Purpose: Update schedule to `5 10 * * *`, ping Supabase, call web API, and integrate `keepalive-workflow@v2`.

### Task 4: Update Architecture & Business Design Documentation
- File: `THIET_KE_KIEN_TRUC_VA_NGHIEP_VU.md`
- Purpose: Record Dual-Engine Forever-Active architecture and 17:05 VN Overdue Sweep.

### Task 5: Build Verification, Test API, Commit & Push
- Verify `npm run build` exits with code 0.
- Push to both GitHub repositories.
