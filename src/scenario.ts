import { Quaternion, Euler } from 'three';
export const RADIUS = 7;
export const WHEEL_RADIUS = .44;
export const HALF_WHEELBASE = 1.47;
export const DURATION = 28;
export type Pose = { position: [number, number, number]; quaternion: [number, number, number, number]; wheelAngle: number; vapor: number; phase: string; speed: number };
export interface Scenario { id: string; title: string; duration: number; evaluate(time: number): Pose }
const clamp = (n:number,a=0,b=1)=>Math.min(b,Math.max(a,n));
const smooth = (n:number)=>{const t=clamp(n);return t*t*(3-2*t)};
export function wheelPath(s:number):[number,number] {
 const r=RADIUS-WHEEL_RADIUS;
 return s<=0 ? [s,WHEEL_RADIUS] : [r*Math.sin(s/r),RADIUS-r*Math.cos(s/r)];
}
/** Locate two wheel axles on the offset surface, preserving the rigid wheelbase even across the floor join. */
export function contactPose(s:number) {
 let low=HALF_WHEELBASE,high=1.7;
 for(let i=0;i<25;i++){const h=(low+high)/2,a=wheelPath(s-h),b=wheelPath(s+h);if(Math.hypot(b[0]-a[0],b[1]-a[1])<2*HALF_WHEELBASE)low=h;else high=h;}
 const h=(low+high)/2,rear=wheelPath(s-h),front=wheelPath(s+h);
 return {position:[(rear[0]+front[0])/2,(rear[1]+front[1])/2,0] as [number,number,number],angle:Math.atan2(front[1]-rear[1],front[0]-rear[0]),rear,front};
}
const top=(RADIUS-WHEEL_RADIUS)*Math.PI*170/180;
function state(t:number){
 if(t<13)return {s:-9+(top+9)*smooth(t/13),phase:'Subida',vapor:0};
 return {s:top,phase:t<18?'Giro para volar':t<19?'Vuelo controlado':t<DURATION?'Aterrizaje':'Maniobra completada',vapor:t<26?Math.min(1,(t-13)/1.2):1-smooth((t-26)/1.5)};
}
export const rampFlight:Scenario={id:'ramp-flight',title:'Rampa · Vuelo · Aterrizaje',duration:DURATION,evaluate(time){
 const t=clamp(time,0,DURATION),st=state(t),contact=contactPose(st.s);let position=contact.position,angle=contact.angle;
 if(t>=13){const a=smooth((t-13)/5),b=smooth((t-19)/8);position=[contact.position[0]+(-10-contact.position[0])*a,contact.position[1]+(11.5-contact.position[1])*a-(11.5-WHEEL_RADIUS)*b,0];angle=contact.angle*(1-a);}
 const q=new Quaternion().setFromEuler(new Euler(0,0,angle));
 const dt=.01;const before=state(Math.max(0,t-dt)).s,after=state(Math.min(13,t+dt)).s;
 return {position,quaternion:q.toArray() as Pose['quaternion'],wheelAngle:-st.s/WHEEL_RADIUS,vapor:clamp(st.vapor),phase:st.phase,speed:t<13?Math.abs(after-before)/(2*dt):0};
}};
const smoothStep=(n:number)=>{const t=clamp(n);return t*t*(3-2*t)};
export const potholeFlight:Scenario={id:'bache-volador',title:'Bache volador',duration:12,evaluate(time){
 const t=clamp(time,0,12);let x=-12,y=WHEEL_RADIUS,phase='Aproximación',wheelAngle=0,vapor=0;
 if(t<3){x=-12+5*smoothStep(t/3);wheelAngle=-(x+12)/WHEEL_RADIUS;}
 else if(t<5){x=-7;y=WHEEL_RADIUS+4*smoothStep((t-3)/2);wheelAngle=-5/WHEEL_RADIUS;phase='Despegue';vapor=smoothStep((t-3)/.8);}
 else if(t<8){const u=(t-5)/3;x=-7+14*smoothStep(u);y=WHEEL_RADIUS+4;wheelAngle=-5/WHEEL_RADIUS;phase='Cruce del bache';vapor=1;}
 else if(t<10){x=7;y=WHEEL_RADIUS+4*(1-smoothStep((t-8)/2));wheelAngle=-5/WHEEL_RADIUS;phase='Aterrizaje';vapor=1-smoothStep((t-8)/1.2);}
 else {x=7+5*smoothStep((t-10)/2);wheelAngle=-(5+x-7)/WHEEL_RADIUS;phase=t<12?'Salida':'Maniobra completada';}
 const q=new Quaternion();
 const u=t<3?t/3:t<5?(t-3)/2:t<8?(t-5)/3:t<10?(t-8)/2:(t-10)/2;
 const speed=t<3?10*u*(1-u):t<5||t<10&&t>=8?12*u*(1-u):t<8?28*u*(1-u):15*u*(1-u);
 return {position:[x,y,0],quaternion:q.toArray() as Pose['quaternion'],wheelAngle,vapor,phase,speed};
}};
export function advance(time:number,delta:number,playing:boolean,duration=DURATION){const next=playing?Math.min(duration,time+Math.max(0,delta)):time;return {time:next,playing:playing&&next<duration};}
