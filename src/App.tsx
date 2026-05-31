import { useEffect } from 'react';
import { usePlannerStore } from './store/usePlannerStore';
import { MOCK_TRACKS } from './data/huji-mock-catalog';
import { WizardStepper } from './components/wizard/WizardStepper';
import './App.css';

function App() {
  const { selectedTrack, setTrack } = usePlannerStore();

  useEffect(() => {
    if (!selectedTrack) setTrack(MOCK_TRACKS[1]);
  }, [selectedTrack, setTrack]);

  return (
    <div className="app-shell">
      <header className="app-top-bar">
        <h1 className="app-title">HUJI Planner</h1>
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
            Reset
          </button>
        </div>
      </header>
      <WizardStepper />
    </div>
  );
}

export default App;
