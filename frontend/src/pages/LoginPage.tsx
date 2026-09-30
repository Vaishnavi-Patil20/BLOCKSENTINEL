import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  User,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LiveNetworkGraph3D } from "../components/LiveNetworkGraph3D";

type AuthMode = "signin" | "signup";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [info, setInfo] = useState("");
  const [infoTitle, setInfoTitle] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const remembered = localStorage.getItem("blocksentinel.rememberedEmail");
    if (remembered) setEmail(remembered);
  }, []);

  // Set mode from URL query param
  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "signup") setMode("signup");
  }, [searchParams]);

  const validate = () => {
    setError("");
    setInfo("");
    if (mode === "signup") {
      const cleanName = name.trim();
      if (!cleanName) return "Please enter your full name.";
      if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(cleanName)) return "Full name may contain letters and single spaces only.";
      if (cleanName.length < 2 || cleanName.length > 80) return "Please enter a name between 2 and 80 characters.";
    }
    if (!email.trim()) return "Please enter your email address.";
    if (!email.includes("@")) return "Please enter a valid email address.";
    if (!password.trim()) return "Please enter your password.";
    if (mode === "signup") {
      if (password.length < 8) return "Password must be at least 8 characters.";
      if (password !== confirmPassword) return "Passwords do not match.";
      if (!agreedToTerms) return "Please agree to the terms of service.";
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setIsLoading(true);
    if (rememberMe && email.trim()) localStorage.setItem("blocksentinel.rememberedEmail", email.trim());
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 800);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setInfo("");
    // Update URL without reload
    navigate(`/login${newMode === "signup" ? "?mode=signup" : ""}`, { replace: true });
  };

  const showInfo = (title: string, message: string) => {
    setInfoTitle(title);
    setInfo(message);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-[0.12]">
            <LiveNetworkGraph3D />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-transparent to-[#0a0a0f]" />
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-sentinel-accent/10 rounded-full blur-[150px]" />
        </div>

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 text-center px-12 max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-sentinel-accent/10 border border-sentinel-accent/20 flex items-center justify-center mx-auto mb-8">
              <Shield className="w-8 h-8 text-sentinel-accent" />
            </div>
            <h2 className="text-3xl font-bold mb-3 tracking-tight">BlockSentinel</h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              Enterprise-grade blockchain risk intelligence. Monitor, analyze, and investigate Ethereum transactions in real time.
            </p>

            <div className="space-y-3 text-left">
              {[
                "Real-time transaction monitoring",
                "AI-powered risk scoring",
                "Built with security-first architecture",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 text-sm text-slate-400"
                >
                  <div className="w-5 h-5 rounded-full bg-sentinel-accent/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-sentinel-accent" />
                  </div>
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 lg:hidden">
          <div className="absolute inset-0 opacity-[0.06]">
            <LiveNetworkGraph3D />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0f]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-10">
            <Shield className="w-7 h-7 text-sentinel-accent" />
            <span className="text-lg font-bold tracking-tight">
              BLOCK<span className="text-sentinel-accent">SENTINEL</span>
            </span>
          </div>

          {/* Mode Toggle */}
          <div className="flex p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl mb-8">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "signin"
                  ? "bg-sentinel-accent text-sentinel-bg shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-sentinel-accent text-sentinel-bg shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Create Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "signup" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "signup" ? -20 : 20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">
                  {mode === "signin" ? "Welcome back" : "Create your account"}
                </h1>
                <p className="text-sm text-slate-500">
                  {mode === "signin"
                    ? "Sign in to your BlockSentinel workspace"
                    : "Start analyzing blockchain transactions for free"}
                </p>
              </div>

              {/* OAuth */}
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => showInfo("Google sign-in", "Google OAuth is not configured in this local build. Use email sign-in to continue.")}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
                <button
                  type="button"
                  onClick={() => showInfo("GitHub sign-in", "GitHub OAuth is not configured in this local build. Use email sign-in to continue.")}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Continue with GitHub
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.08]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-[#0a0a0f] text-slate-600">
                    or {mode === "signin" ? "sign in" : "sign up"} with email
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {info && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-sentinel-accent/10 border border-sentinel-accent/20 text-sm text-slate-300"
                  >
                    <div className="font-semibold text-sentinel-accent">{infoTitle}</div>
                    <div className="mt-1 text-slate-400">{info}</div>
                  </motion.div>
                )}

                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      Full name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sentinel-accent/40 focus:ring-1 focus:ring-sentinel-accent/20 transition-all"
                        placeholder="Alex Morgan"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sentinel-accent/40 focus:ring-1 focus:ring-sentinel-accent/20 transition-all"
                      placeholder="analyst@organization.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sentinel-accent/40 focus:ring-1 focus:ring-sentinel-accent/20 transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      Confirm password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sentinel-accent/40 focus:ring-1 focus:ring-sentinel-accent/20 transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        {showConfirmPass ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {mode === "signin" ? (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-slate-500 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="peer sr-only" />
                        <div className="w-4 h-4 rounded border border-white/[0.12] bg-white/[0.03] peer-checked:bg-sentinel-accent peer-checked:border-sentinel-accent transition-all" />
                        <svg
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 text-sentinel-bg opacity-0 peer-checked:opacity-100 pointer-events-none"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-xs group-hover:text-slate-400 transition-colors">
                        Remember me
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => showInfo("Password recovery", "Password recovery is not connected to an identity provider in this local build. Configure Supabase Auth or another provider before enabling recovery emails.")}
                      className="text-xs text-sentinel-accent hover:text-sentinel-accent-dim transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                ) : (
                  <label className="flex items-start gap-2.5 text-slate-500 cursor-pointer group">
                    <div className="relative flex items-center mt-0.5">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-4 h-4 rounded border border-white/[0.12] bg-white/[0.03] peer-checked:bg-sentinel-accent peer-checked:border-sentinel-accent transition-all" />
                      <svg
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 text-sentinel-bg opacity-0 peer-checked:opacity-100 pointer-events-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-xs leading-relaxed group-hover:text-slate-400 transition-colors">
                      I agree to the{" "}
                      <button type="button" onClick={() => showInfo("Terms of Service", "BlockSentinel is a prototype risk-intelligence interface. Do not treat risk scores as proof of wrongdoing.")} className="text-sentinel-accent hover:underline">
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button type="button" onClick={() => showInfo("Privacy Policy", "Only data required by the application should be processed. Never place API keys or credentials in client-visible storage." )} className="text-sentinel-accent hover:underline">
                        Privacy Policy
                      </button>
                    </span>
                  </label>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-sentinel-accent text-sentinel-bg font-semibold py-2.5 rounded-xl hover:bg-sentinel-accent-dim transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-sentinel-accent/10"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-sentinel-bg/30 border-t-sentinel-bg rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === "signin" ? "Sign In" : "Create Account"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>

          {/* Bottom text */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-sm text-slate-500">
              {mode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => switchMode("signup")}
                    className="text-sentinel-accent hover:text-sentinel-accent-dim font-medium transition-colors"
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => switchMode("signin")}
                    className="text-sentinel-accent hover:text-sentinel-accent-dim font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
            <Lock className="w-3 h-3" />
            Secured with 256-bit encryption
          </div>
        </motion.div>
      </div>
    </div>
  );
};