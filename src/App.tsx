import { useEffect } from 'react';
import { usePlannerStore } from './store/usePlannerStore';
import { MOCK_TRACKS } from './data/huji-mock-catalog';
import { SidebarTabs } from './components/layout/SidebarTabs';
import { Planner } from './components/builder/Planner';
import { Analysis } from './components/shared/Analysis';
import './App.css';

function App() {
  const { selectedTrack, setTrack } = usePlannerStore();

  useEffect(() => {
    if (!selectedTrack) {
      setTrack(MOCK_TRACKS[1]);
    }
  }, [selectedTrack, setTrack]);

  return (
    <div className="app-shell">
      <header className="app-top-bar">
        <h1>HUJI Planner</h1>
        <div className="track-picker">
          <select 
            value={selectedTrack?.id || ''} 
            onChange={(e) => setTrack(MOCK_TRACKS.find(t => t.id === e.target.value)!)}
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

      <div className="app-content-grid">
        <aside className="column sidebar-column">
          <SidebarTabs />
        </aside>
        
        <main className="column planner-column">
          <Planner />
        </main>
        
        <aside className="column analysis-column">
          <Analysis />
        </aside>
      </div>
    </div>
  );
}

export default App;
