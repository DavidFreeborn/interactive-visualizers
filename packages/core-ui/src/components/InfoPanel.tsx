/**
 * Information panel component for displaying explanatory content.
 */

import React, { useState } from 'react';

export interface InfoPanelProps {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  variant?: 'default' | 'warning';
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  title,
  children,
  collapsible = false,
  defaultExpanded = true,
  variant = 'default',
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const containerStyle: React.CSSProperties = {
    ...styles.container,
    ...(variant === 'warning' ? styles.warning : {}),
  };

  return (
    <div className="info-panel" style={containerStyle}>
      <div
        style={styles.header}
        onClick={collapsible ? () => setExpanded(!expanded) : undefined}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? expanded : undefined}
      >
        <h3 style={styles.title}>{title}</h3>
        {collapsible && (
          <span style={styles.toggle}>{expanded ? '[-]' : '[+]'}</span>
        )}
      </div>
      {expanded && <div style={styles.content}>{children}</div>}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
  },
  warning: {
    backgroundColor: '#fff8e1',
    borderColor: '#ffcc80',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
  },
  toggle: {
    fontFamily: 'monospace',
    color: '#666',
  },
  content: {
    padding: '0 12px 12px 12px',
    fontSize: '14px',
    lineHeight: 1.5,
  },
};
