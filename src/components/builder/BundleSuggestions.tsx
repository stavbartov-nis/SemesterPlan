import React, { useState, useEffect } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { suggestBundles, SuggestedBundle } from '../../engine/generator';
import { MOCK_COURSES, MOCK_OFFERINGS } from '../../data/huji-mock-catalog';

export const BundleSuggestions: React.FC = () => {
  const { 
    plannedCourses, 
    selectedTrack, 
    preferences, 
    historyCourseIds,
    setPlannedCourses,
    setPreferences
  } = usePlannerStore();

  const [bundles, setBundles] = useState<SuggestedBundle[]>([]);

  const handleTargetChange = (type: 'Mandatory' | 'Core' | 'Elective', value: string) => {
    const numValue = parseInt(value) || 0;
    setPreferences({
      ...preferences,
      targetCreditsByType: {
        ...preferences.targetCreditsByType,
        [type]: numValue
      }
    });
  };

  const handleGenerate = () => {
    if (!selectedTrack) return;
    
    // Only use anchors as the base for suggestions
    const anchors = plannedCourses.filter(pc => pc.isAnchor);
    
    const newBundles = suggestBundles(
      anchors,
      MOCK_COURSES,
      MOCK_OFFERINGS,
      selectedTrack,
      preferences,
      historyCourseIds
    );
    setBundles(newBundles);
  };

  const applyBundle = (bundle: SuggestedBundle) => {
    setPlannedCourses(bundle.courses);
    setBundles([]); // Clear suggestions after applying
  };

  return (
    <div className="bundle-suggestions">
      <div className="suggestion-header">
        <h3>Smart Suggestions</h3>
        <div className="target-inputs">
          {(['Mandatory', 'Core', 'Elective'] as const).map(type => (
            <label key={type}>
              {type}:
              <input 
                type="number" 
                value={preferences?.targetCreditsByType?.[type] || 0} 
                onChange={(e) => handleTargetChange(type, e.target.value)}
                min="0"
                max="30"
              />
            </label>
          ))}
        </div>
        <button className="generate-btn" onClick={handleGenerate}>
          ✨ Generate Plans
        </button>
      </div>
      
      {bundles.length > 0 && (
        <div className="bundles-grid">
          {bundles.map(bundle => (
            <div key={bundle.id} className="bundle-card">
              <h4>{bundle.name}</h4>
              <p className="rationale">{bundle.rationale}</p>
              <div className="bundle-stats">
                <span>{bundle.courses.length} Courses</span>
                <span>{bundle.totalCredits} NKZ</span>
              </div>
              <button className="apply-btn" onClick={() => applyBundle(bundle)}>
                Apply Plan
              </button>
            </div>
          ))}
        </div>
      )}
      
      {bundles.length === 0 && (
        <p className="hint">Tip: Anchor courses you definitely want to keep, then click Generate.</p>
      )}
    </div>
  );
};
