// @vitest-environment jsdom
import React from 'react';
import {render,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
vi.mock('@viz/signaling',()=>({ClassicSignalingGamesApp:()=>null,CompositionalSignalingGamesApp:()=>null,EnglishTownGeneratorApp:()=>null}));
vi.mock('@viz/manifold',()=>({ManifoldView:()=>null}));
vi.mock('@viz/polarization',()=>({PolarizationView:()=>null}));
vi.mock('@viz/zollman',()=>({ZollmanView:()=>null}));
vi.mock('@viz/dots',()=>({DotsView:()=>null}));
import {App} from './App';
afterEach(()=>{cleanup();document.body.innerHTML='';});
it('keeps the website signalling collection limited to its two models',()=>{
 document.body.innerHTML='<div id="root" data-collection="signalling"></div>';
 const view=render(<App/>,{container:document.getElementById('root')!});
 expect(view.getByRole('heading',{level:1}).textContent).toBe('Signalling Games Visualisers');
 expect(view.getAllByRole('button')).toHaveLength(2);
});
it('preserves all seven tools in the upstream showcase',()=>{
 const view=render(<App/>);
 expect(view.getAllByRole('button')).toHaveLength(7);
});
