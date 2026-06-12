import { useEffect } from 'react';
import { usePlannerStore } from './store/usePlannerStore';
import { MOCK_TRACKS, MOCK_COURSES } from './data/huji-mock-catalog';
import { WizardStepper } from './components/wizard/WizardStepper';
import catalogData from './data/huji-catalog-2026.json';
import './App.css';

function App() {
  const { selectedTrack, setTrack, historyCourseIds } = usePlannerStore();

  useEffect(() => {
    if (!selectedTrack) setTrack(MOCK_TRACKS[0]);
  }, [selectedTrack, setTrack]);

  // Header NKZ stat: degree total is the sum of basket minimums (120 נ"ז),
  // not the sum of every course that could fill them. Completed credits are
  // capped per basket so over-filling one basket doesn't inflate progress.
  const baskets = selectedTrack?.components.flatMap(comp => comp.baskets) ?? [];
  const totalCredits = baskets.reduce((sum, b) => sum + b.minCredits, 0);
  const completedCredits = baskets.reduce((sum, b) => {
    const done = MOCK_COURSES
      .filter(c => b.courseIds.includes(c.id) && historyCourseIds.includes(c.id))
      .reduce((s, c) => s + c.credits, 0);
    return sum + Math.min(done, b.minCredits);
  }, 0);

  // Provenance: official catalog metadata (year תשפ"ו = meta.year 2026)
  const catalogUpdated = new Date(catalogData.meta.generated).toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="app-shell">
      <header className="app-top-bar">
        <h1 className="app-title">מתכנן לימודים</h1>
        <span className="provenance-badge" title={`עודכן ${catalogUpdated}`}>
          נתוני השנתון הרשמי · תשפ"ו
        </span>

        <div className="header-center">
          {totalCredits > 0 && (
            <div className="nkz-stat">
              <span className="nkz-done">{completedCredits}</span>
              <span className="nkz-sep">/</span>
              <span className="nkz-total">{totalCredits} נ"ז</span>
              <div className="nkz-bar">
                <div
                  className="nkz-bar-fill"
                  style={{ width: `${(completedCredits / totalCredits) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="track-picker">
          <span className="track-name">{selectedTrack?.name}</span>
          <button
            className="reset-btn"
            onClick={() => {
              if (confirm('לאפס את כל התוכנית והנתונים?')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
          >
            איפוס
          </button>
        </div>
      </header>

      <WizardStepper />
    </div>
  );
}

export default App;
