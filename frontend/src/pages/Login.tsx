import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Shield, ChevronRight, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30, staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
};

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

      const response = await fetch(`${BASE}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid username or password");
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem("userRole", data.roleCode);
      sessionStorage.setItem("userName", data.fullName || "User");
      sessionStorage.setItem("employeeId", data.employeeId || "admin");
      sessionStorage.setItem("userId", data.id || "admin");
      sessionStorage.setItem("isAdminLoggedIn", "true");
      navigate("/");

    } catch (err) {
      setError("Network error. Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafe] p-4 relative overflow-hidden font-sans selection:bg-blue-200">

      {/* Animated Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 right-[-20%] w-[800px] h-[800px] bg-indigo-100/50 rounded-full blur-[150px]"
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="z-10 w-full max-w-[440px] relative"
      >
        {/* Main Card */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(37,99,235,0.15)] p-8 sm:p-10 relative border border-white/50">

          <motion.div variants={itemVariants} className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20 ring-4 ring-white">
              <Shield className="w-8 h-8 text-white drop-shadow-md" />
            </div>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em] mb-3">Field Senses</p>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-sm text-slate-500 font-medium">Enter your credentials to access your portal</p>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-6">
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <Input
                  type="email"
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="pl-12 h-14 bg-slate-50/50 hover:bg-slate-50 border-slate-200 rounded-2xl text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                  required
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-slate-700">Password</label>
                <button type="button" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="pl-12 pr-12 h-14 bg-slate-50/50 hover:bg-slate-50 border-slate-200 rounded-2xl text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants} className="pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_12px_25px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 group"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Sign In
                    <ChevronRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>
            </motion.div>
          </form>
        </div>

        {/* Demo Credentials Box */}
        <motion.div variants={itemVariants} className="mt-8">
          <div className="bg-blue-50/80 backdrop-blur-md rounded-[1.5rem] p-5 border border-blue-100 shadow-sm relative overflow-hidden group">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <div className="flex items-center gap-2 mb-3 relative z-10">
              <Info className="w-4 h-4 text-blue-500" />
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Demo Access</p>
            </div>

            <div className="space-y-2.5 relative z-10">
              {[
                { role: 'Admin', email: 'admin@example.com' },
                { role: 'Manager', email: 'bob@example.com' },
                { role: 'Employee', email: 'eve@example.com' }
              ].map((cred) => (
                <div key={cred.role} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="font-semibold text-slate-700 w-20">{cred.role}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-xs bg-white/60 px-2 py-1 rounded-md border border-slate-100">
                    {cred.email} / password123
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default Login;
