import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Activity, Brain, Network, ArrowRight, ChevronDown } from 'lucide-react';
import * as THREE from 'three';

const NetworkScene = () => {
  const mountRef = useRef(null);
  useEffect(() => {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.03);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const nodes = [];
    const geometry = new THREE.SphereGeometry(0.08, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0x6366f1 });
    for (let i = 0; i < 60; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
      scene.add(mesh);
      nodes.push({ mesh, velocity: new THREE.Vector3((Math.random()-0.5)*0.01, (Math.random()-0.5)*0.01, (Math.random()-0.5)*0.01) });
    }
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.15 });
    const lines = [];
    camera.position.z = 6;

    const animate = () => {
      requestAnimationFrame(animate);
      nodes.forEach(n => { n.mesh.position.add(n.velocity); if (n.mesh.position.length() > 8) n.velocity.negate(); });
      lines.forEach(l => scene.remove(l)); lines.length = 0;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[i].mesh.position.distanceTo(nodes[j].mesh.position) < 2.5) {
            const geo = new THREE.BufferGeometry().setFromPoints([nodes[i].mesh.position, nodes[j].mesh.position]);
            const line = new THREE.Line(geo, lineMaterial); scene.add(line); lines.push(line);
          }
        }
      }
      renderer.render(scene, camera);
    };
    animate();
    const handleResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); mountRef.current?.removeChild(renderer.domElement); renderer.dispose(); };
  }, []);
  return <div ref={mountRef} className="absolute inset-0 z-0" />;
};

const Landing = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-sentinel-900 relative overflow-hidden">
      <NetworkScene />
      <div className="relative z-10">
        <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sentinel-accent/10 border border-sentinel-accent/20 text-sentinel-accent text-sm font-medium mb-8">
              <Shield size={16} /> Enterprise Blockchain Intelligence
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6"><span className="text-white">Block</span><span className="text-sentinel-accent">Sentinel</span></h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4">See the risk behind every transaction.</p>
            <p className="text-gray-500 max-w-xl mx-auto mb-10">AI-powered blockchain transaction intelligence for real-time risk detection, explainable analysis and investigation.</p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => navigate('/signup')} className="btn-primary flex items-center gap-2 text-lg px-8 py-4">Explore Platform <ArrowRight size={18} /></button>
              <button onClick={() => navigate('/login')} className="btn-secondary text-lg px-8 py-4">Sign In</button>
            </div>
          </motion.div>
          <motion.div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500 cursor-pointer" animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }} onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
            <ChevronDown size={24} />
          </motion.div>
        </section>

        <section id="features" className="py-24 px-4 border-t border-sentinel-600/10 bg-sentinel-900/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {[{ label: 'LIVE TRANSACTIONS', value: '12,482', icon: Activity }, { label: 'ANALYZED', value: '8,931', icon: Brain }, { label: 'HIGH RISK', value: '127', icon: Shield }, { label: 'ALERTS', value: '34', icon: AlertTriangle }].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <stat.icon className="mx-auto mb-3 text-sentinel-accent" size={28} />
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="py-24 px-4 border-t border-sentinel-600/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16">How BlockSentinel Works</h2>
            <div className="space-y-4">
              {['BLOCKCHAIN', 'DATA INGESTION', 'FEATURE ENGINE', 'AI ANALYSIS', 'RISK SCORE', 'EXPLAINABLE AI', 'ALERT', 'INVESTIGATION'].map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-sentinel-accent"></div>
                  <div className={`px-6 py-3 rounded-lg border ${i % 2 === 0 ? 'bg-sentinel-accent/10 border-sentinel-accent/30 text-sentinel-accent' : 'bg-sentinel-800 border-sentinel-600/30 text-gray-300'} font-mono text-sm`}>{step}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 border-t border-sentinel-600/10 bg-sentinel-900/80">
          <div className="max-w-md mx-auto card">
            <div className="text-center mb-6">
              <div className="text-sm text-gray-500 mb-2">TRANSACTION RISK</div>
              <div className="text-6xl font-bold text-sentinel-critical">87<span className="text-2xl text-gray-500">/100</span></div>
              <div className="badge badge-critical mt-2 inline-block">CRITICAL</div>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-400 mb-3">Why?</div>
              {['Rapid fund movement', 'Unusual transaction frequency', 'High-risk counterparty', 'Abnormal wallet behaviour'].map((reason, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-300"><div className="w-1.5 h-1.5 rounded-full bg-sentinel-critical"></div>{reason}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 border-t border-sentinel-600/10 text-center">
          <h2 className="text-3xl font-bold mb-6">Turn blockchain activity into actionable intelligence.</h2>
          <button onClick={() => navigate('/signup')} className="btn-primary text-lg px-10 py-4">Enter BlockSentinel</button>
        </section>

        <footer className="py-8 px-4 border-t border-sentinel-600/10 text-center text-gray-500 text-sm">BlockSentinel v1.0 — Enterprise Blockchain Intelligence</footer>
      </div>
    </div>
  );
};

export default Landing;
