import React, { useState } from 'react';
import { StepAnchors } from './StepAnchors';
import { StepCompleted } from './StepCompleted';
import { StepConstraints } from './StepConstraints';
import { StepGenerate } from './StepGenerate';

const STEPS = [
  { label: 'Anchors',     desc: "Lock in courses you want" },
  { label: 'Completed',   desc: "Mark what you've done" },
  { label: 'Constraints', desc: 'Days, times & credit targets' },
  { label: 'Generate',    desc: 'Build & choose your plan' },
];

export const WizardStepper: React.FC = () => {
  const [active, setActive] = useState(0);

  return (
    <div className="wizard">
      {/* ── Step nav ── */}
      <nav className="wizard-nav">
        {/* connecting track behind the buttons */}
        <div className="wizard-track">
          <div
            className="wizard-track-fill"
            style={{ width: `${(active / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {STEPS.map((step, i) => {
          const state = active === i ? 'active' : active > i ? 'done' : 'pending';
          return (
            <button
              key={i}
              className={`wizard-step-btn ${state}`}
              onClick={() => setActive(i)}
            >
              <span className="step-num">
                {state === 'done' ? '✓' : i + 1}
              </span>
              <span className="step-text">
                <strong>{step.label}</strong>
                <small>{step.desc}</small>
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── Content ── */}
      <div className="wizard-body">
        {active === 0 && <StepAnchors     onNext={() => setActive(1)} />}
        {active === 1 && <StepCompleted   onNext={() => setActive(2)} />}
        {active === 2 && <StepConstraints onNext={() => setActive(3)} />}
        {active === 3 && <StepGenerate />}
      </div>
    </div>
  );
};
