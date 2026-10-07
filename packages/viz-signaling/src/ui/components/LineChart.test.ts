// @vitest-environment jsdom
import React from 'react';
import {render,act,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {LineChart} from './LineChart';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('keeps data and labels inside the measured plot when its container shrinks',()=>{
 let resize:ResizeObserverCallback=()=>{};
 const disconnect=vi.fn();
 vi.stubGlobal('ResizeObserver',class {constructor(fn:ResizeObserverCallback){resize=fn}observe(){}disconnect=disconnect});
 const {getByRole,getByText}=render(React.createElement(LineChart,{title:'Payoff',rounds:[0,100],series:[{id:'a',label:'Payoff',color:'#222',values:[0,1]}],yMin:0,yMax:1,verticalMarkers:[{id:'end',round:100,label:'Intervention'}]}));
 for(const width of [420,245,320]){
  act(()=>resize([{contentRect:{width}}] as ResizeObserverEntry[],{} as ResizeObserver));
  const svg=getByRole('img');expect(svg.getAttribute('width')).toBe(String(width));
  const marker=getByText('Intervention');expect(marker.getAttribute('text-anchor')).toBe('end');
  expect(Number(marker.getAttribute('x'))).toBeLessThan(width);
  for(const path of svg.querySelectorAll('path'))expect(path.getAttribute('d')).not.toMatch(/NaN|Infinity/);
 }
 cleanup();expect(disconnect).toHaveBeenCalled();
});
