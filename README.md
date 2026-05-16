# HUJI Schedule Planner

A client-side decision-support tool for Hebrew University students to plan their academic schedules. It reconciles complex degree requirements (Legal) with personal availability (Realistic).

## 🚀 Vision
Generate valid academic plans that satisfy degree credits while respecting user constraints, using the official [HUJI Shnaton](https://shnaton.huji.ac.il/) as the source of truth.

## 🛠 Features (In Progress)
- **Anchor + Suggest Engine**: Lock in courses you want, and let the engine suggest the rest.
- **Strategic Bundles**:
  - **Fastest Path**: Prioritizes mandatory courses and high-credit values.
  - **Compact Schedule**: Minimizes the number of days you need to be on campus.
  - **Late Start**: Avoids classes before 10:00 AM.
- **Conflict Detection**: Real-time checking for overlapping lectures and labs.
- **Credit Accounting**: Track progress against degree baskets (Core, Electives, etc.).

## 📂 Project Structure
- `src/engine`: Pure business logic for validation and bundle generation.
- `src/store`: Application state management via Zustand.
- `src/data`: Course catalogs and degree track definitions.
- `scripts/`: Data scrapers and utility scripts.

## 💻 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Run Tests**:
   ```bash
   npm run test
   ```

## 📝 Roadmap
- [ ] Complete HUJI Shnaton Scraper.
- [ ] Implement multi-semester planning.
- [ ] Add prerequisites validation.
- [ ] Visual Calendar UI implementation.

---
*Developed as part of the HUJI Schedule Planner project.*
