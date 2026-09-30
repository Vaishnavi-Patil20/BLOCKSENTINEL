import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Shield,
  ArrowRight,
  Zap,
  Brain,
  Search,
  Lock,
  BarChart3,
  Globe,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Github,
  BookOpen,
} from "lucide-react";
import { LiveNetworkGraph3D } from "../components/LiveNetworkGraph3D";
import { useRef, useState } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true, margin: "-100px" },
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const features = [
    {
      icon: Zap,
      title: "Real-Time Monitoring",
      description:
        "Ingest and analyze Ethereum transactions as they happen. Sub-second latency for immediate threat response.",
    },
    {
      icon: Brain,
      title: "AI-Powered Risk Scoring",
      description:
        "Machine learning models deliver explainable risk scores so you understand why a transaction is flagged.",
    },
    {
      icon: Search,
      title: "Deep Investigation",
      description:
        "Trace fund flows across wallets, identify patterns, and map entity relationships with interactive graphs.",
    },
    {
      icon: Lock,
      title: "Enterprise Security",
      description:
        "End-to-end encryption, audit logs, and role-based access controls built in from day one.",
    },
    {
      icon: BarChart3,
      title: "Custom Reporting",
      description:
        "Generate compliance-ready reports for regulators and stakeholders with one-click export.",
    },
    {
      icon: Globe,
      title: "Multi-Chain Ready",
      description:
        "Ethereum mainnet support today. Polygon, Arbitrum, and Base coming in upcoming releases.",
    },
  ];

  const steps = [
    { num: "01", title: "Connect", desc: "Link your blockchain node via RPC or websocket stream." },
    { num: "02", title: "Analyze", desc: "AI models evaluate transaction patterns and entity behavior." },
    { num: "03", title: "Score", desc: "Each transaction receives a risk score with full explainability." },
    { num: "04", title: "Act", desc: "Get notified instantly when risk thresholds are breached." },
  ];

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#pipeline" },
    { label: "Docs", href: "#" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 selection:bg-sentinel-accent/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <Shield className="w-7 h-7 text-sentinel-accent" />
            <span className="text-lg font-bold tracking-tight">
              BLOCK<span className="text-sentinel-accent">SENTINEL</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/login?mode=signup")}
              className="text-sm bg-sentinel-accent text-sentinel-bg font-semibold px-5 py-2 rounded-lg hover:bg-sentinel-accent-dim transition-colors"
            >
              Get Started
            </button>
          </div>

          <button
            className="md:hidden text-slate-400"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-white/[0.06] bg-[#0a0a0f]/95 backdrop-blur-xl px-6 py-4 space-y-3"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block text-sm text-slate-400 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-white/[0.06] space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/login");
                }}
                className="block w-full text-left text-sm text-slate-300 py-2"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/login?mode=signup");
                }}
                className="block w-full text-sm bg-sentinel-accent text-sentinel-bg font-semibold px-4 py-2.5 rounded-lg"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-[0.15]">
            <LiveNetworkGraph3D />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/60 to-[#0a0a0f]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-sentinel-accent/8 rounded-full blur-[150px]" />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 text-center px-6 max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sentinel-accent/20 bg-sentinel-accent/5 text-sentinel-accent text-xs font-medium mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              Now in early access
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              See the risk behind
              <br />
              <span className="bg-gradient-to-r from-sentinel-accent via-cyan-400 to-sentinel-accent bg-clip-text text-transparent">
                every transaction.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 mb-4 font-light max-w-2xl mx-auto leading-relaxed">
              AI-powered blockchain intelligence for real-time risk detection, explainable analysis, and deep investigation.
            </p>
            <p className="text-slate-500 mb-10 max-w-xl mx-auto text-sm sm:text-base">
              A new platform built for compliance teams, security researchers, and DeFi protocols.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("/login?mode=signup")}
                className="group px-8 py-3.5 bg-sentinel-accent text-sentinel-bg font-semibold rounded-xl hover:bg-sentinel-accent-dim transition-all flex items-center shadow-lg shadow-sentinel-accent/20"
              >
                Start Free
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-8 py-3.5 border border-white/10 text-slate-300 font-medium rounded-xl hover:bg-white/5 hover:border-white/20 transition-all"
              >
                Sign In
              </button>
            </div>

            {/* Open source / honest badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 flex items-center justify-center gap-6"
            >
              <a
                href="#"
                className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                <Github className="w-4 h-4" />
                Open Source
              </a>
              <span className="text-slate-800">|</span>
              <a
                href="#"
                className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Documentation
              </a>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/10 flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-sentinel-accent/60"
            />
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-sentinel-accent text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
              Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built for serious blockchain analysis
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From real-time ingestion to forensic investigation — everything you need to understand on-chain risk.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={fadeInUp}
                  className="group p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-sentinel-accent/20 hover:bg-white/[0.04] transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-sentinel-accent/10 flex items-center justify-center mb-5 group-hover:bg-sentinel-accent/20 transition-colors">
                    <Icon className="w-5 h-5 text-sentinel-accent" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2.5 text-slate-100">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="pipeline" className="py-24 border-t border-white/[0.06] relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sentinel-accent/5 rounded-full blur-[150px]" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <span className="text-sentinel-accent text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
              Pipeline
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Four steps from raw blockchain data to actionable intelligence.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="relative"
              >
                <div className="text-5xl font-bold text-white/[0.03] absolute -top-4 -left-2 select-none">
                  {step.num}
                </div>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 h-full hover:border-sentinel-accent/20 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-sentinel-accent/10 flex items-center justify-center mb-4">
                    <span className="text-xs font-bold text-sentinel-accent">{step.num}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 text-slate-700">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to explore?
            </h2>
            <p className="text-slate-400 mb-10 max-w-xl mx-auto">
              BlockSentinel is currently in early access. Create a free account and start analyzing transactions today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("/login?mode=signup")}
                className="group px-8 py-3.5 bg-sentinel-accent text-sentinel-bg font-semibold rounded-xl hover:bg-sentinel-accent-dim transition-all flex items-center shadow-lg shadow-sentinel-accent/20"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-8 py-3.5 border border-white/10 text-slate-300 font-medium rounded-xl hover:bg-white/5 transition-all"
              >
                Already have an account?
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-16 bg-[#07070a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <Shield className="w-6 h-6 text-sentinel-accent" />
                <span className="text-base font-bold tracking-tight">
                  BLOCK<span className="text-sentinel-accent">SENTINEL</span>
                </span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                A new platform for blockchain risk intelligence. Built transparently, shipped often.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
                Product
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li className="hover:text-slate-300 cursor-pointer transition-colors">Features</li>
                <li className="hover:text-slate-300 cursor-pointer transition-colors">API Docs</li>
                <li className="hover:text-slate-300 cursor-pointer transition-colors">Changelog</li>
                <li className="hover:text-slate-300 cursor-pointer transition-colors">Roadmap</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
                Company
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li className="hover:text-slate-300 cursor-pointer transition-colors">About</li>
                <li className="hover:text-slate-300 cursor-pointer transition-colors">Blog</li>
                <li className="hover:text-slate-300 cursor-pointer transition-colors">Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li className="hover:text-slate-300 cursor-pointer transition-colors">Privacy</li>
                <li className="hover:text-slate-300 cursor-pointer transition-colors">Terms</li>
                <li className="hover:text-slate-300 cursor-pointer transition-colors">Security</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} BlockSentinel. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};