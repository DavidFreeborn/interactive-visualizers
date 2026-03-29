/**
 * "What This Shows" and "What This Does NOT Show" panels.
 *
 * MANDATORY: Every visualizer must include these.
 */

import React from 'react';
import { InfoPanel } from '@viz/core-ui';
import { CONTENT } from '../content';

export const WhatThisShowsPanel: React.FC = () => {
  return (
    <InfoPanel title="What This Shows" collapsible defaultExpanded={false}>
      <ul style={styles.list}>
        {CONTENT.whatThisShows.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </InfoPanel>
  );
};

export const WhatThisDoesNotShowPanel: React.FC = () => {
  const sections = CONTENT.whatThisDoesNotShow;

  return (
    <InfoPanel
      title="What This Does NOT Show"
      variant="warning"
      collapsible
      defaultExpanded={false}
    >
      <div style={styles.warning}>
        {Object.entries(sections).map(([key, section]) => (
          <div key={key} style={styles.section}>
            <h5 style={styles.sectionTitle}>{section.title}</h5>
            <ul style={styles.list}>
              {section.points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </InfoPanel>
  );
};

const styles: Record<string, React.CSSProperties> = {
  list: {
    margin: 0,
    paddingLeft: '20px',
  },
  warning: {
    fontSize: '13px',
  },
  section: {
    marginBottom: '12px',
  },
  sectionTitle: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    fontWeight: 600,
    color: '#d84315',
  },
};
