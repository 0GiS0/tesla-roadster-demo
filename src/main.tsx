import React, { Component, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useProgress } from '@react-three/drei';
import { Scene } from './Scene';
import { advance,DURATION,rampFlight } from './scenario';
import './style.css';
class SceneBoundary extends Component<{children:React.ReactNode;onError:()=>void},{error:boolean}>{state={error:false};componentDidCatch(){this.props.onError()}static getDerivedStateFromError(){return {error:true}}render(){return this.state.error?<div className="fallback"><span className="eyebrow">NO SE HA PODIDO CARGAR LA ESCENA</span><h2>Volvamos a intentarlo.</h2><p>Comprueba la conexión y recarga para recuperar el modelo 3D.</p><button onClick={()=>location.reload()}>Recargar escena ↗</button></div>:this.props.children}}
function supports3D(){try{return !!document.createElement('canvas').getContext('webgl2')}catch{return false}}
const supported=supports3D();
const clock=(n:number)=>`0:${String(Math.floor(n)).padStart(2,'0')}`;
function Icon({name}:{name:'play'|'pause'|'reset'|'camera'}){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{name==='play'?<path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none"/>:name==='pause'?<><path d="M8 5v14M16 5v14" strokeWidth="3"/></>:name==='reset'?<><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/></>:<><path d="M4 7h4l2-3h4l2 3h4v13H4Z"/><circle cx="12" cy="13" r="4"/></>}</svg>}
function Loading(){const {active,progress}=useProgress();return active?<div className="loading" role="status"><span className="loader"/>Preparando la pista <span>{Math.round(progress)}%</span></div>:null}
function App(){
 const [playback,setPlayback]=useState({time:0,playing:false});const [cameraReset,setCameraReset]=useState(0);const [ready,setReady]=useState(false);const last=useRef(0);
 useEffect(()=>{if(!playback.playing)return;let id:number;last.current=performance.now();const tick=(now:number)=>{const delta=Math.min((now-last.current)/1000,.1);last.current=now;setPlayback(p=>advance(p.time,delta,p.playing));id=requestAnimationFrame(tick)};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id)},[playback.playing]);
 const onReady=useCallback(()=>setReady(true),[]);
 const onError=useCallback(()=>{setReady(false);setPlayback(p=>({...p,playing:false}))},[]);
 const phase=rampFlight.evaluate(playback.time).phase;
 const toggle=()=>setPlayback(p=>({time:p.time>=DURATION?0:p.time,playing:!p.playing}));
 return <main>
  <header><a className="wordmark" href={import.meta.env.BASE_URL} aria-label="Roadster, inicio">ROADSTER<span className="wordmark-line"/></a><div className="header-meta"><span className="status-dot"/> PRESENTACIÓN · 2026</div><span className="edition">ESTUDIO DE MOVIMIENTO <span>01 / 01</span></span></header>
  <section className="stage" aria-label="Escena 3D interactiva de la maniobra del Roadster">
   <div className="intro"><div className="eyebrow"><span/> MÁS ALLÁ DEL ASFALTO</div><h1>El suelo era<br/>solo el principio.</h1><p>Una rampa. Un impulso. Otra dimensión.</p></div>
   <SceneBoundary onError={onError}>{supported?<Scene time={playback.time} playing={playback.playing} cameraReset={cameraReset} onReady={onReady}/>:<div className="fallback"><span className="eyebrow">EXPERIENCIA 3D</span><h2>Necesitamos un poco más de potencia.</h2><p>Abre esta página en un navegador con WebGL 2 y aceleración gráfica activada.</p></div>}</SceneBoundary>
   {supported&&<Loading/>}
   <p className="keyboard-hint" id="camera-keyboard-help">Cámara: flechas para girar · + / − para acercar o alejar · Tab para salir</p>
   <div className="scene-label"><span className="cross">+</span><div>RAMPA DE PRUEBAS<span>RECREACIÓN INTERACTIVA</span></div></div>
   <div className="interaction-hint"><span>↔</span> Arrastra para explorar <i/> Pellizca para acercar</div>
  </section>
  <footer className="console"><div className="phase"><span className="eyebrow">LA MANIOBRA</span><span className="phase-title" aria-live="polite">{phase}</span></div>
   <div className="transport"><div className="transport-top"><button className="primary" disabled={!ready||!supported} onClick={toggle}><Icon name={playback.playing?'pause':'play'}/>{playback.playing?'Pausar':playback.time>=DURATION?'Repetir':'Reproducir'}</button><button className="icon-button" disabled={!ready} aria-label="Reiniciar maniobra" title="Reiniciar maniobra" onClick={()=>setPlayback({time:0,playing:false})}><Icon name="reset"/></button><span className="time"><strong>{clock(playback.time)}</strong><span>/</span>{clock(DURATION)}</span></div><input className="timeline" disabled={!ready} aria-label="Tiempo de la maniobra" aria-valuetext={`${Math.floor(playback.time)} segundos de ${DURATION}`} type="range" min="0" max={DURATION} step="0.01" value={playback.time} onChange={e=>setPlayback(p=>({...p,time:Number(e.target.value),playing:p.playing&&Number(e.target.value)<DURATION}))} style={{'--progress':`${playback.time/DURATION*100}%`} as React.CSSProperties}/><div className="timeline-labels"><span>SUBIDA</span><span>VUELO</span><span>ATERRIZAJE</span></div></div>
   <button className="camera-button" aria-label="Restablecer cámara" disabled={!ready} onClick={()=>setCameraReset(n=>n+1)}><Icon name="camera"/><span>Restablecer cámara</span></button>
  </footer><div className="disclaimer"><span>Recreación artística independiente. Sin afiliación con Tesla.</span><span>EXPLORA LO IMPOSIBLE <span className="red">↗</span></span></div>
 </main>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
