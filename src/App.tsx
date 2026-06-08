import { useEffect } from 'react';
import { usePlannerStore } from './store/usePlannerStore';
import { MOCK_TRACKS, MOCK_COURSES } from './data/huji-mock-catalog';
import { WizardStepper } from './components/wizard/WizardStepper';
import './App.css';

function App() {
  const { selectedTrack, setTrack, historyCourseIds } = usePlannerStore();

  useEffect(() => {
    if (!selectedTrack) setTrack(MOCK_TRACKS[1]);
  }, [selectedTrack, setTrack]);

  // NKZ stat for header (#9)
  const completedCredits = MOCK_COURSES
    .filter(c => historyCourseIds.includes(c.id))
    .reduce((sum, c) => sum + c.credits, 0);

  const totalCredits = selectedTrack
    ? MOCK_COURSES
        .filter(c =>
          selectedTrack.components.some(comp =>
            comp.baskets.some(b => b.courseIds.includes(c.id))
          )
        )
        .reduce((sum, c) => sum + c.credits, 0)
    : 0;

  return (
    <div className="app-shell">
      <header className="app-top-bar">
        <h1 className="app-title">מתכנן לימודים</h1>

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
          <select
            value={selectedTrack?.id || ''}
            onChange={e => setTrack(MOCK_TRACKS.find(t => t.id === e.target.value)!)}
          >
            {MOCK_TRACKS.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            className="reset-btn"
            onClick={() => { localStorage.clear(); window.location.reload(); }}
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
