import React from 'react';
import type {
  DotsConfig,
  BehaviorType,
  TopologyType,
  RenderOptions,
  BoidsParams,
  FriendsEnemiesParams,
  ParticleLifeParams,
  SwarmalatorsParams,
  NaturalFrequencyMode,
} from '../model/types';
import {
  MAX_PARTICLES,
  DEFAULT_BOIDS_PARAMS,
  DEFAULT_FRIENDS_ENEMIES_PARAMS,
  DEFAULT_PARTICLE_LIFE_PARAMS,
  DEFAULT_SWARMALATOR_PARAMS,
} from '../model/types';
import type { Preset } from '../presets';

interface Props {
  config: DotsConfig;
  renderOptions: RenderOptions;
  presets: Preset[];
  isPlaying: boolean;
  simulationSpeed: number;
  zoom: number;
  onSimulationSpeedChange: (speed: number) => void;
  onZoomChange: (zoom: number) => void;
  onConfigChange: (config: Partial<DotsConfig>) => void;
  onRenderOptionsChange: (options: Partial<RenderOptions>) => void;
  onPresetSelect: (preset: Preset) => void;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onNewSeed: () => void;
}

const styles = {
  container: { display:'flex', flexDirection:'column' as const, gap:16, padding:16, background:'#f8f9fa', borderRadius:8, fontSize:14, minWidth:260 },
  section: { display:'flex', flexDirection:'column' as const, gap:8 },
  sectionTitle: { fontWeight:600, fontSize:12, textTransform:'uppercase' as const, color:'#666', letterSpacing:'0.5px', marginBottom:4 },
  row: { display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 },
  label: { fontSize:13, color:'#333', minWidth:90 },
  muted: { fontSize:12, color:'#777', lineHeight:1.35 },
  input: { padding:'4px 8px', border:'1px solid #ddd', borderRadius:4, fontSize:13, width:72 },
  select: { padding:'4px 8px', border:'1px solid #ddd', borderRadius:4, fontSize:13, flex:1 },
  slider: { flex:1, marginLeft:8 },
  button: { padding:'8px 16px', border:'none', borderRadius:4, cursor:'pointer', fontSize:13, fontWeight:500 },
  primaryButton: { background:'#333', color:'white' },
  secondaryButton: { background:'#e9ecef', color:'#333' },
  buttonRow: { display:'flex', gap:8, flexWrap:'wrap' as const },
  presetList: { display:'flex', flexDirection:'column' as const, gap:4 },
  presetButton: { padding:'6px 10px', border:'1px solid #ddd', borderRadius:4, background:'white', cursor:'pointer', fontSize:12, textAlign:'left' as const },
  value: { width:42, textAlign:'right' as const, fontSize:12, fontFamily:'monospace', color:'#666' },
};

export const DotsControls: React.FC<Props> = ({
  config, renderOptions, presets, isPlaying, simulationSpeed, zoom,
  onSimulationSpeedChange, onZoomChange, onConfigChange, onRenderOptionsChange,
  onPresetSelect, onPlay, onPause, onStep, onReset, onNewSeed,
}) => {
  const behavior = config.behavior;
  const grouped = presets.reduce((acc, preset) => {
    (acc[preset.config.behavior] ||= []).push(preset);
    return acc;
  }, {} as Record<string, Preset[]>);
  const topologyLocked = behavior === 'friends-enemies' || behavior === 'swarmalators';

  return <div style={styles.container}>
    <div style={styles.section}>
      <div style={styles.buttonRow}>
        <button style={{...styles.button,...styles.primaryButton,flex:1}} onClick={isPlaying ? onPause : onPlay}>{isPlaying?'Pause':'Play'}</button>
        <button style={{...styles.button,...styles.secondaryButton}} onClick={onStep} disabled={isPlaying}>Step</button>
      </div>
      <div style={styles.buttonRow}>
        <button style={{...styles.button,...styles.secondaryButton,flex:1}} onClick={onReset}>Reset</button>
        <button style={{...styles.button,...styles.secondaryButton,flex:1}} onClick={onNewSeed}>New seed</button>
      </div>
      <div style={styles.row}><span style={styles.label}>Seed</span><input type="number" style={{...styles.input,flex:1}} value={config.seed} onChange={e=>{const v=parseInt(e.target.value,10); if(Number.isFinite(v)) onConfigChange({seed:v});}} /></div>
    </div>

    <div style={styles.section}>
      <div style={styles.sectionTitle}>Behavior</div>
      <select style={styles.select} value={behavior} onChange={e=>{
        const next=e.target.value as BehaviorType;
        onConfigChange({ behavior:next, behaviorParams:getDefaultBehaviorParams(next, config.seed) });
      }}>
        <option value="boids">Boids</option>
        <option value="friends-enemies">Friends & Enemies</option>
        <option value="particle-life">Particle Life</option>
        <option value="swarmalators">Swarmalators</option>
      </select>
    </div>

    <div style={styles.section}>
      <div style={styles.sectionTitle}>Presets</div>
      <div style={styles.presetList}>{(grouped[behavior]||[]).map(p=><button key={p.name} style={styles.presetButton} onClick={()=>onPresetSelect(p)} title={p.description}>{p.name}</button>)}</div>
    </div>

    <div style={styles.section}>
      <div style={styles.sectionTitle}>Simulation</div>
      <Range label="Speed" min={0.25} max={5} step={0.25} value={simulationSpeed} display={`${simulationSpeed.toFixed(2)}x`} onChange={onSimulationSpeedChange}/>
      <Range label="Zoom" min={0.5} max={3} step={0.1} value={zoom} display={`${zoom.toFixed(1)}x`} onChange={onZoomChange}/>
      <div style={styles.row}><span style={styles.label}>Particles</span><input type="number" style={styles.input} min={10} max={MAX_PARTICLES[behavior]} step={50} value={config.numParticles} onChange={e=>onConfigChange({numParticles:Math.max(10,Math.min(MAX_PARTICLES[behavior],parseInt(e.target.value,10)||10))})}/></div>
    </div>

    <div style={styles.section}>
      <div style={styles.sectionTitle}>Topology</div>
      <select style={{...styles.select,opacity:topologyLocked?0.6:1}} disabled={topologyLocked} value={config.topology} onChange={e=>onConfigChange({topology:e.target.value as TopologyType})}>
        <option value="bounded">Bounded x and y axis</option>
        <option value="cylinder-x">Cylinder (wrap x axis)</option>
        <option value="cylinder-y">Cylinder (wrap y axis)</option>
        <option value="torus">Torus (wrap both)</option>
        <option value="mobius-x">Mobius strip (twist x axis)</option>
        <option value="mobius-y">Mobius strip (twist y axis)</option>
        <option value="plane">Plane (unbounded)</option>
      </select>
      {topologyLocked && <div style={styles.muted}>The topology is fixed to the plane.</div>}
    </div>

    {behavior==='boids' && <BoidsControls params={config.behaviorParams as BoidsParams} onChange={p=>onConfigChange({behaviorParams:{...config.behaviorParams,...p} as BoidsParams})}/>} 
    {behavior==='friends-enemies' && <FriendsControls params={config.behaviorParams as FriendsEnemiesParams} onChange={p=>onConfigChange({behaviorParams:{...config.behaviorParams,...p} as FriendsEnemiesParams})}/>} 
    {behavior==='particle-life' && <ParticleLifeControls seed={config.seed} params={config.behaviorParams as ParticleLifeParams} onChange={p=>onConfigChange({behaviorParams:{...config.behaviorParams,...p} as ParticleLifeParams})}/>} 
    {behavior==='swarmalators' && <SwarmControls params={config.behaviorParams as SwarmalatorsParams} onChange={p=>onConfigChange({behaviorParams:{...config.behaviorParams,...p} as SwarmalatorsParams})}/>} 

    <div style={styles.section}>
      <div style={styles.sectionTitle}>Rendering</div>
      <label><input type="checkbox" checked={renderOptions.showArrows} onChange={e=>onRenderOptionsChange({showArrows:e.target.checked})}/> Show as arrows</label>
      <label><input type="checkbox" checked={renderOptions.showTrails} onChange={e=>onRenderOptionsChange({showTrails:e.target.checked})}/> Show trails</label>
      {renderOptions.showTrails && <>
        <Range label="Trail length" min={5} max={100} step={1} value={renderOptions.trailLength} display={`${renderOptions.trailLength}`} onChange={v=>onRenderOptionsChange({trailLength:v})}/>
        <Range label="Trail opacity" min={0.1} max={1} step={0.1} value={renderOptions.trailOpacity} display={renderOptions.trailOpacity.toFixed(1)} onChange={v=>onRenderOptionsChange({trailOpacity:v})}/>
      </>}
      <Range label="Dot size" min={1} max={6} step={0.5} value={renderOptions.particleRadius} display={`${renderOptions.particleRadius}`} onChange={v=>onRenderOptionsChange({particleRadius:v})}/>
    </div>
  </div>;
};

const Range: React.FC<{label:string;min:number;max:number;step:number;value:number;display:string;onChange:(v:number)=>void;disabled?:boolean}> = ({label,min,max,step,value,display,onChange,disabled}) =>
  <div style={styles.row}><span style={styles.label}>{label}</span><input type="range" style={styles.slider} min={min} max={max} step={step} value={value} disabled={disabled} onChange={e=>onChange(parseFloat(e.target.value))}/><span style={styles.value}>{display}</span></div>;

const BoidsControls: React.FC<{params:BoidsParams;onChange:(p:Partial<BoidsParams>)=>void}> = ({params,onChange}) => <div style={styles.section}>
  <div style={styles.sectionTitle}>Boids</div>
  <Range label="Max speed" min={2} max={20} step={1} value={params.maxSpeed} display={`${params.maxSpeed}`} onChange={v=>onChange({maxSpeed:v})}/>
  <Range label="Separation" min={0} max={3} step={0.1} value={params.separationWeight} display={params.separationWeight.toFixed(1)} onChange={v=>onChange({separationWeight:v})}/>
  <Range label="Alignment" min={0} max={2} step={0.1} value={params.alignmentWeight} display={params.alignmentWeight.toFixed(1)} onChange={v=>onChange({alignmentWeight:v})}/>
  <Range label="Cohesion" min={0} max={2} step={0.1} value={params.cohesionWeight} display={params.cohesionWeight.toFixed(1)} onChange={v=>onChange({cohesionWeight:v})}/>
  <Range label="Vision radius" min={20} max={150} step={5} value={params.cohesionRadius} display={`${params.cohesionRadius}`} onChange={r=>onChange({cohesionRadius:r,alignmentRadius:r*0.75,separationRadius:r*0.25})}/>
</div>;

const FriendsControls: React.FC<{params:FriendsEnemiesParams;onChange:(p:Partial<FriendsEnemiesParams>)=>void}> = ({params,onChange}) => <div style={styles.section}>
  <div style={styles.sectionTitle}>Friends & Enemies</div>
  <div style={styles.row}><span style={styles.label}>Friend graph</span><select style={styles.select} value={params.friendMode??'random'} onChange={e=>onChange({friendMode:e.target.value as 'random'|'cycle'})}><option value="random">Random (Woods)</option><option value="cycle">Single cycle (ribbon)</option></select></div>
  <Range label="Friend pull" min={0.005} max={0.07} step={0.001} value={params.friendWeight} display={params.friendWeight.toFixed(3)} onChange={v=>onChange({friendWeight:v})}/>
  <Range label="Enemy push" min={0.001} max={0.03} step={0.001} value={params.enemyWeight} display={params.enemyWeight.toFixed(3)} onChange={v=>onChange({enemyWeight:v})}/>
  <Range label="Rewire rate" min={0} max={1} step={0.001} value={params.rewireRate} display={`${params.rewireRate.toFixed(3)}/f`} onChange={v=>onChange({rewireRate:v})}/>
</div>;

const ParticleLifeControls: React.FC<{seed:number;params:ParticleLifeParams;onChange:(p:Partial<ParticleLifeParams>)=>void}> = ({seed,params,onChange}) => <div style={styles.section}>
  <div style={styles.sectionTitle}>Particle Life</div>
  <div style={styles.row}><span style={styles.label}>Types</span><input type="number" style={styles.input} min={2} max={8} value={params.numTypes} onChange={e=>{const n=Math.max(2,Math.min(8,parseInt(e.target.value,10)||2)); onChange({numTypes:n,attractionMatrix:deterministicMatrix(n,seed^n)});}}/></div>
  <Range label="Radius" min={30} max={150} step={1} value={params.interactionRadius} display={`${params.interactionRadius}`} onChange={v=>onChange({interactionRadius:v})}/>
  <Range label="Friction" min={0.01} max={0.5} step={0.01} value={params.friction} display={params.friction.toFixed(2)} onChange={v=>onChange({friction:v})}/>
</div>;

const SwarmControls: React.FC<{params:SwarmalatorsParams;onChange:(p:Partial<SwarmalatorsParams>)=>void}> = ({params,onChange}) => {
  const model=params.model??'classic-2017';
  const mode=params.frequencyMode??'F2';
  const local=params.couplingRadius!=null;
  return <div style={styles.section}>
    <div style={styles.sectionTitle}>Swarmalators</div>
    <div style={styles.row}><span style={styles.label}>Model</span><select style={styles.select} value={model} onChange={e=>onChange({model:e.target.value as SwarmalatorsParams['model']})}><option value="classic-2017">Classic (2017)</option><option value="diverse-2023">Diverse / chiral (2023)</option></select></div>
    <Range label="Spatial J" min={-1} max={1} step={0.05} value={params.J} display={params.J.toFixed(2)} onChange={v=>onChange({J:v})}/>
    <Range label="Phase K" min={-1} max={2} step={0.05} value={params.K} display={params.K.toFixed(2)} onChange={v=>onChange({K:v})}/>
    {model==='classic-2017' ? <Range label="Freq variance" min={0} max={0.5} step={0.05} value={params.omegaVariance} display={params.omegaVariance.toFixed(2)} onChange={v=>onChange({omegaVariance:v})}/> : <>
      <div style={styles.row}><span style={styles.label}>Frequencies</span><select style={styles.select} value={mode} onChange={e=>onChange({frequencyMode:e.target.value as NaturalFrequencyMode})}><option value="F1">F1: +1</option><option value="F2">F2: ±1</option><option value="F3">F3: U(1, Ω)</option><option value="F4">F4: ±U(1, Ω)</option></select></div>
      {(mode==='F3'||mode==='F4') && <Range label="Omega max" min={1} max={6} step={0.1} value={params.omegaMax??3} display={(params.omegaMax??3).toFixed(1)} onChange={v=>onChange({omegaMax:v})}/>} 
      <label><input type="checkbox" checked={!!params.chiral} onChange={e=>onChange({chiral:e.target.checked})}/> Chiral inherent motion</label>
      <label><input type="checkbox" checked={!!params.frequencyCoupling} onChange={e=>onChange({frequencyCoupling:e.target.checked})}/> Frequency-coupling offsets</label>
      <label><input type="checkbox" checked={local} onChange={e=>onChange({couplingRadius:e.target.checked ? 1.4 : null})}/> Local coupling</label>
      {local && <Range label="Sigma" min={0.2} max={5} step={0.1} value={params.couplingRadius??1.4} display={(params.couplingRadius??1.4).toFixed(1)} onChange={v=>onChange({couplingRadius:v})}/>} 
    </>}
  </div>;
};

function getDefaultBehaviorParams(type:BehaviorType,seed:number) {
  switch(type) {
    case 'boids': return {...DEFAULT_BOIDS_PARAMS};
    case 'friends-enemies': return {...DEFAULT_FRIENDS_ENEMIES_PARAMS};
    case 'particle-life': return {...DEFAULT_PARTICLE_LIFE_PARAMS, attractionMatrix:deterministicMatrix(DEFAULT_PARTICLE_LIFE_PARAMS.numTypes,seed)};
    case 'swarmalators': return {...DEFAULT_SWARMALATOR_PARAMS};
  }
}

function deterministicMatrix(size:number,seed:number):number[][] {
  let state=seed>>>0;
  const next=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0; return state/0xffffffff*2-1;};
  return Array.from({length:size},()=>Array.from({length:size},()=>next()));
}

export default DotsControls;
