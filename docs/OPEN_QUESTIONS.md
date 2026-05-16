# Open Questions and Risks: HUJI Schedule Planner

## 1. Open Questions
1. **Catalog Access**: How will the system transition from static mock data to real HUJI data? Will there be an API or a periodic scraper?
2. **Section Choice**: Should the system automatically pick the "best" lecture/exercise section for the user, or should it present all valid combinations as separate plans?
3. **Double Counting**: Are there edge cases where a course counts for a basket but *not* for the total degree credits? (e.g., Cornerstones vs Electives).
4. **Campus Travel**: Should the engine account for travel time between Safra and Mt. Scopus?

## 2. Technical Risks
- **Combinatorial Explosion**: If the catalog is large and the requirements are loose, the number of valid course combinations could grow too large for a simple permutation algorithm.
    - *Mitigation*: Use a greedy algorithm with a limited search depth for the MVP.
- **Local Storage Limits**: Large degree histories might exceed the 5MB Local Storage limit.
    - *Mitigation*: Compress stored JSON or use IndexedDB if necessary.
- **Data Integrity**: HUJI's Shnaton is notorious for last-minute changes (rooms, times).
    - *Mitigation*: Clearly label the "Last Updated" date for the catalog data.

## 3. Tradeoffs
- **Performance vs. Optimality**: The suggestion engine prioritizes fast, "good enough" bundles over a mathematically perfect global optimum.
- **Simplicity vs. Completeness**: The MVP ignores exam schedules and registration priorities to focus on the core scheduling problem.
- **Client-Side vs. Server-Side**: Building the engine on the client ensures speed and privacy but limits our ability to use heavy-duty constraint solvers (like Google OR-Tools).
