// @vitest-environment jsdom
import React from 'react';
import {render, fireEvent, cleanup} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {DotsCanvas} from './DotsCanvas';
import {DotsSimulation} from '../sim/DotsSimulation';
import {DEFAULT_CONFIG, DEFAULT_RENDER_OPTIONS} from '../model/types';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('responsive swarm interaction',()=>{
 for(const displayWidth of [900,450,300]) for(const zoom of [1,2]) it(`preserves world coordinates at ${displayWidth}px and zoom ${zoom}`,()=>{
  const ctx=new Proxy({}, {get:()=>()=>{}});
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(ctx as never);
  vi.spyOn(HTMLCanvasElement.prototype,'getBoundingClientRect').mockReturnValue({left:10,top:20,width:displayWidth,height:displayWidth*2/3} as DOMRect);
  vi.stubGlobal('devicePixelRatio',2);
  const onInteraction=vi.fn();
  const simulation=new DotsSimulation({...DEFAULT_CONFIG,width:900,height:600},DEFAULT_RENDER_OPTIONS);
  const {getByRole}=render(React.createElement(DotsCanvas,{state:simulation.getState(),options:DEFAULT_RENDER_OPTIONS,width:900,height:600,zoom,onInteraction}));
  const canvas=getByRole('application');
  fireEvent.pointerDown(canvas,{clientX:10+displayWidth*.75,clientY:20+displayWidth*.5,button:0});
  expect(onInteraction.mock.lastCall?.[0]).toMatchObject({type:'attract',active:true,x:450+225/zoom,y:300+150/zoom});
  fireEvent.pointerMove(canvas,{clientX:10+displayWidth*.5,clientY:20+displayWidth/3});
  expect(onInteraction.mock.lastCall?.[0]).toMatchObject({x:450,y:300});
  fireEvent.pointerUp(canvas);
  expect(onInteraction.mock.lastCall?.[0].active).toBe(false);
  fireEvent.pointerDown(canvas,{clientX:10+displayWidth/2,clientY:20+displayWidth/3,button:2});
  expect(onInteraction.mock.lastCall?.[0].type).toBe('repel');
  fireEvent.keyDown(canvas,{key:'Escape'});
  expect(onInteraction.mock.lastCall?.[0].active).toBe(false);
 });
});
