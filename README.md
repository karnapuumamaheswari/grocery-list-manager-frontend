# Grocery List Manager - Frontend

## Project Title
Smart Grocery List Manager (Frontend)

## Description
Responsive React frontend for grocery list, pantry tracking, recipe suggestions, budgeting, and history dashboards.

## Features
- Smart grocery list management
- Pantry tracking with expiry/low-stock alerts
- Pantry-first recipe suggestions and add-missing flow
- Budget limit with over-budget suggestions
- Purchase history analytics
- Auth via Supabase

## Tech Stack
- React + TypeScript
- Tailwind CSS
- shadcn/ui
- Axios
- Vite

## Folder Structure
`src/components`, `src/pages`, `src/context`, `src/services`, `src/hooks`, `src/utils`

## Installation
1. Install dependencies:
```bash
npm install
```
2. Set environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`
- `VITE_SESSION_TIMEOUT_MINUTES` (optional)
3. Run:
```bash
npm run dev
```

## Deployment (Netlify)
- Build command: `npm run build`
- Publish directory: `dist`
- Netlify config: `netlify.toml`

## Backend API Link
Set via `VITE_API_URL` (Render URL).

## Login Credentials
Use your own signup/login via Supabase Auth.

## Screenshots / Demo
Add screenshots and video walkthrough link before final submission.

