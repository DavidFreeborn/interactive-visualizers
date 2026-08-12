import React, { useState, useRef, useCallback } from 'react';
import { usePlayback } from '@viz/core-ui';
import type { DotsConfig, RenderOptions, Interaction, DotsMetrics, BehaviorType } from '../model/types';
import { DEFAULT_CONFIG, DEFAULT_RENDER_OPTIONS, MAX_PARTICLES, DEFAULT_PARTICLE_COUNTS } from '../model/types';
import { DotsSimulation } from '../sim/DotsSimulation';
import { DotsCanvas } from './DotsCanvas';
import { DotsControls } from './DotsControls';
import { PRESETS, type Preset } from '../presets';
import { CONTENT } from '../content';

interface DotsViewProps {
  initialConfig?: Partial<DotsConfig>;
  initialRenderOptions?: Partial<RenderOptions>;
  width?: number;
  height?: number;
}

const styles = {
  container:{display:'flex',flexDirection:'column' as const,gap:16,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'},
  header:{display:'flex',alignItems:'baseline',gap:16},
  title:{fontSize:24,fontWeight:700,margin:0,color:'#1a1a1a'},
  main:{display:'flex',gap:16},
  canvasSection:{flex:1,minWidth:0},
  controlsSection:{flex:'0 0 280px'},
  metricsBar:{display:'flex',gap:20,padding:'8px 12px',background:'#f8f9fa',borderRadius:4,fontSize:12,marginTop:8,flexWrap:'wrap' as const},
  metric:{display:'flex',alignItems:'center',gap:6},
  metricLabel:{color:'#888'}, metricValue:{fontWeight:600,fontFamily:'monospace',color:'#333'},
  interactionHint:{fontSize:12,color:'#999',marginLeft:'auto'},
  infoPanel:{padding:'14px 18px',background:'#f8f9fa',borderRadius:4,marginTop:12},
  infoPanelTitle:{fontSize:13,fontWeight:600,marginBottom:8,color:'#1a1a1a',letterSpacing:'0.2px'},
  infoPanelText:{margin:0,fontSize:13,color:'#444',lineHeight:1.65,whiteSpace:'pre-wrap' as const},
  credit:{fontSize:12,color:'#888',fontStyle:'italic' as const,marginTop:8},
};

export const DotsView: React.FC<DotsViewProps> = ({
  initialConfig = {}, initialRenderOptions = {}, width = 900, height = 600,
}) => {
  const [config,setConfig]=useState<DotsConfig>(()=>({...DEFAULT_CONFIG,width,height,...initialConfig}));
  const [renderOptions,setRenderOptions]=useState<RenderOptions>(()=>({
    ...DEFAULT_RENDER_OPTIONS,
    ...renderForBehavior((initialConfig.behavior??DEFAULT_CONFIG.behavior)),
    ...initialRenderOptions,
  }));
  const [zoom,setZoom]=useState(1);
  const simRef=useRef(new DotsSimulation(config,renderOptions));
  const [,forceRender]=useState(0);
  const triggerRender=useCallback(()=>forceRender(c=>c+1),[]);
  const [metrics,setMetrics]=useState<DotsMetrics>(()=>simRef.current.getMetrics());

  const syncFromSimulation=useCallback(()=>{
    setMetrics(simRef.current.getMetrics());
    triggerRender();
  },[triggerRender]);

  const handleStep=useCallback(()=>{simRef.current.step();syncFromSimulation();},[syncFromSimulation]);
  const playback=usePlayback({onStep:handleStep,initialSpeed:1});
  const handleInteraction=useCallback((interaction:Interaction)=>simRef.current.setInteraction(interaction),[]);

  const handleConfigChange=useCallback((change:Partial<DotsConfig>)=>{
    // Behavior switches are one atomic reset. This prevents transient states in
    // which the behavior, parameters, topology, and particle cap disagree.
    if(change.behavior){
      const behavior=change.behavior;
      const naturalTopology=behavior==='friends-enemies'||behavior==='swarmalators'?'plane':'torus';
      const next:DotsConfig={
        ...config,
        ...change,
        topology:naturalTopology,
        numParticles:Math.min(change.numParticles??DEFAULT_PARTICLE_COUNTS[behavior],MAX_PARTICLES[behavior]),
      };
      setConfig(next);
      simRef.current.resetWithConfig(next);
      const ro=renderForBehavior(behavior);
      setRenderOptions(prev=>({...prev,...ro}));
      simRef.current.updateRenderOptions(ro);
      syncFromSimulation();
      return;
    }

    if(change.seed!==undefined && change.seed!==config.seed && Object.keys(change).length===1){
      const next={...config,seed:change.seed};
      setConfig(next);
      simRef.current.resetWithSeed(change.seed);
      syncFromSimulation();
      return;
    }

    const next={...config,...change};
    setConfig(next);
    simRef.current.updateConfig(change);
    syncFromSimulation();
  },[config,syncFromSimulation]);

  const handleRenderOptionsChange=useCallback((change:Partial<RenderOptions>)=>{
    setRenderOptions(prev=>({...prev,...change}));
    simRef.current.updateRenderOptions(change);
    triggerRender();
  },[triggerRender]);

  const handlePresetSelect=useCallback((preset:Preset)=>{
    const next={...preset.config,width,height};
    setConfig(next);
    simRef.current.resetWithConfig(next);
    const ro=renderForBehavior(next.behavior);
    setRenderOptions(prev=>({...prev,...ro}));
    simRef.current.updateRenderOptions(ro);
    syncFromSimulation();
  },[width,height,syncFromSimulation]);

  const handleReset=useCallback(()=>{simRef.current.reset();syncFromSimulation();},[syncFromSimulation]);
  const handleNewSeed=useCallback(()=>{
    const seed=Math.floor(Math.random()*1_000_000);
    setConfig(prev=>({...prev,seed}));
    simRef.current.resetWithSeed(seed);
    syncFromSimulation();
  },[syncFromSimulation]);

  const info=CONTENT.behaviors[config.behavior];
  const state=simRef.current.getState();

  return <div style={styles.container}>
    <header style={styles.header}><h1 style={styles.title}>{CONTENT.title}</h1></header>
    <div style={styles.main}>
      <div style={styles.canvasSection}>
        <DotsCanvas state={state} options={renderOptions} width={width} height={height} zoom={zoom} onInteraction={handleInteraction}/>
        <div style={styles.metricsBar}>
          <Metric label="Frame" value={`${metrics.frame}`}/>
          <Metric label="Speed" value={metrics.avgSpeed.toFixed(2)}/>
          {metrics.orderParameter!==undefined&&<Metric label="Order" value={metrics.orderParameter.toFixed(2)}/>} 
          {metrics.phaseSynchronization!==undefined&&<Metric label="Sync Z" value={metrics.phaseSynchronization.toFixed(2)}/>} 
          {metrics.spacePhaseOrder!==undefined&&<Metric label="Space-phase S" value={metrics.spacePhaseOrder.toFixed(2)}/>} 
          <span style={styles.interactionHint}>Click to attract · Right-click to repel</span>
        </div>
        {info&&<div style={styles.infoPanel}><div style={styles.infoPanelTitle}>{info.name}</div><p style={styles.infoPanelText}>{info.description}</p>{info.credit&&<p style={styles.credit}>{info.credit}</p>}</div>}
      </div>
      <div style={styles.controlsSection}>
        <DotsControls config={config} renderOptions={renderOptions} presets={PRESETS}
          isPlaying={playback.isPlaying} simulationSpeed={playback.speed} zoom={zoom}
          onSimulationSpeedChange={playback.setSpeed} onZoomChange={setZoom}
          onConfigChange={handleConfigChange} onRenderOptionsChange={handleRenderOptionsChange}
          onPresetSelect={handlePresetSelect} onPlay={playback.play} onPause={playback.pause}
          onStep={handleStep} onReset={handleReset} onNewSeed={handleNewSeed}/>
      </div>
    </div>
  </div>;
};

const Metric:React.FC<{label:string;value:string}>=({label,value})=><div style={styles.metric}><span style={styles.metricLabel}>{label}</span><span style={styles.metricValue}>{value}</span></div>;

function renderForBehavior(behavior:BehaviorType):Partial<RenderOptions>{
  return {
    showArrows:behavior==='boids',
    colorScheme:behavior==='particle-life'?'type':behavior==='swarmalators'?'phase':'monochrome',
    particleRadius:behavior==='friends-enemies'?1:behavior==='particle-life'||behavior==='swarmalators'?4:2,
  };
}

export default DotsView;
