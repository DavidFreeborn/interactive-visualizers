import React from 'react';
import ReactDOM from 'react-dom/client';
import { DotsView } from '@viz/dots';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '1rem 1.5rem 2rem' }}>
      <DotsView />
    </div>
  </React.StrictMode>
);
