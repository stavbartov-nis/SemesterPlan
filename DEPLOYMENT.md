# Deployment Guide: HUJI Schedule Planner

Since this is a client-side React application built with **Vite**, deployment is straightforward. The project compiles into static HTML, CSS, and JS files that can be hosted on any static hosting provider.

## 🏗️ Pre-deployment Checklist

Before deploying, ensure the project builds correctly:
```bash
npm run build
```
This will generate a `dist/` folder containing the production-ready files.

---

## 🚀 Recommended Hosting Options

### 1. Vercel (Easiest)
Ideal for React projects with zero configuration.
1. Sign in to [Vercel](https://vercel.com).
2. Click **"Add New"** > **"Project"**.
3. Import your GitHub repository (`stavbartov-nis/SemesterPlan`).
4. Vercel will automatically detect **Vite** settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.

### 2. Netlify
Very similar to Vercel, excellent for static sites.
1. Sign in to [Netlify](https://netlify.com).
2. Click **"Add new site"** > **"Import an existing project"**.
3. Connect to GitHub and select the repository.
4. Set the build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Deploy site**.

### 3. GitHub Pages
Good for hosting directly on your GitHub repository.
1. Install the `gh-pages` package:
   ```bash
   npm install -D gh-pages
   ```
2. Update `vite.config.ts` to include the base path (if your repo isn't at the root domain):
   ```typescript
   export default defineConfig({
     base: '/SemesterPlan/', // Replace with your repo name
     plugins: [react()],
   })
   ```
3. Add deployment scripts to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
4. Run: `npm run deploy`.

---

## 🔧 Environment Configuration

If you eventually add an API or external service, use a `.env` file. In Vite, environment variables must be prefixed with `VITE_`:
- Local: `.env.local`
- Production: Set variables in the Vercel/Netlify dashboard under **Environment Variables**.

## 🔄 Continuous Deployment (CI/CD)

Both **Vercel** and **Netlify** will automatically trigger a new deployment every time you push a change to the `main` branch. This is the recommended workflow for this project.

---
*Note: This project uses LocalStorage for persistence. No database setup is required for the MVP.*
