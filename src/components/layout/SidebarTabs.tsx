import React, { useState } from 'react';
import { Catalog } from '../roadmap/Catalog';
import { History } from '../roadmap/History';
import { Settings } from './Settings';

export const SidebarTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'history' | 'settings'>('catalog');

  return (
    <div className="sidebar-tabs">
      <div className="tab-buttons">
        <button 
          className={activeTab === 'catalog' ? 'active' : ''} 
          onClick={() => setActiveTab('catalog')}
        >
          Catalog
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''} 
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''} 
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'catalog' && <Catalog />}
        {activeTab === 'history' && <History />}
        {activeTab === 'settings' && <Settings />}
      </div>
    </div>
  );
};
