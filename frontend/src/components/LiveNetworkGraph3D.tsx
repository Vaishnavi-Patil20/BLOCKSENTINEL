import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useBlockchain } from "../context/BlockchainContext";

function Node({ position, label, active }: { position: [number, number, number]; label: string; active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => { if (ref.current) ref.current.scale.setScalar(active ? 1.2 + Math.sin(state.clock.elapsedTime * 3) * 0.05 : 1); });
  return <><mesh ref={ref} position={position}><sphereGeometry args={[0.14, 20, 20]} /><meshStandardMaterial color={active ? "#ef4444" : "#06b6d4"} emissive={active ? "#ef4444" : "#06b6d4"} emissiveIntensity={0.5}/></mesh><Text position={[position[0],position[1]+0.25,position[2]]} fontSize={0.12} color="#94a3b8" anchorX="center" anchorY="middle">{label}</Text></>;
}

function Edge({ start, end }: { start: [number, number, number]; end: [number, number, number] }) { return <line><bufferGeometry><bufferAttribute attach="attributes-position" count={2} array={new Float32Array([...start,...end])} itemSize={3}/></bufferGeometry><lineBasicMaterial color="#1e293b"/></line>; }
function Particle({ start, end, speed }: { start: [number, number, number]; end: [number, number, number]; speed: number }) { const ref=useRef<THREE.Mesh>(null); useFrame((state)=>{if(ref.current){const t=(state.clock.elapsedTime*speed)%1;ref.current.position.lerpVectors(new THREE.Vector3(...start),new THREE.Vector3(...end),t);}}); return <mesh ref={ref}><sphereGeometry args={[0.025,8,8]}/><meshBasicMaterial color="#eab308"/></mesh>; }

export const LiveNetworkGraph3D: React.FC = () => {
  const { transactions } = useBlockchain();
  const nodes = useMemo(() => {
    const ids = Array.from(new Set(transactions.slice(0,20).flatMap(t => [t.from_address, t.to_address].filter(Boolean) as string[]))).slice(0,20);
    const count = Math.max(ids.length,1);
    return ids.map((addr,i)=>{ const theta=(i/count)*Math.PI*2; const hash=Array.from(addr).reduce((a,c)=>((a*31+c.charCodeAt(0))>>>0),17); const r=3.4+((hash>>>7)%700)/1000; return { id:addr, label:`${addr.slice(0,6)}…${addr.slice(-4)}`, position:[r*Math.cos(theta),r*.62*Math.sin(theta),((hash>>>17)%2000-1000)/600] as [number,number,number], isRecent:i<5 }; });
  }, [transactions]);
  const edges = useMemo(()=>transactions.slice(0,15).map(t=>{const from=nodes.find(n=>n.id===t.from_address);const to=nodes.find(n=>n.id===t.to_address);return from&&to?{start:from.position,end:to.position}:null;}).filter(Boolean) as {start:[number,number,number];end:[number,number,number]}[],[transactions,nodes]);
  if(nodes.length===0) return <div className="w-full h-96 bg-sentinel-surface border border-sentinel-border rounded-xl flex items-center justify-center text-slate-600 text-sm">Waiting for real network data…</div>;
  return <div className="w-full h-96 bg-sentinel-surface border border-sentinel-border rounded-xl overflow-hidden relative"><div className="absolute z-10 top-3 left-4 text-xs text-slate-500 bg-black/30 px-2 py-1 rounded">Real observed addresses · click/drag to inspect</div><Canvas camera={{position:[0,0,8],fov:60}}><ambientLight intensity={0.3}/><pointLight position={[10,10,10]} intensity={0.5}/>{nodes.map(n=><Node key={n.id} position={n.position} label={n.label} active={n.isRecent}/>)}{edges.map((e,i)=><Edge key={i} start={e.start} end={e.end}/>)}{edges.slice(0,5).map((e,i)=><Particle key={`p-${i}`} start={e.start} end={e.end} speed={0.35+(i%4)*0.1}/>)}<OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.4}/></Canvas></div>;
};
