import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Shield, User, Phone, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register form
  const [regName, setRegName] = useState("");
  const [regMobile, setRegMobile] = useState("");

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
      
      const response = await fetch(`${BASE}/api/registration-requests/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: regName,
          email: email,
          mobileNumber: regMobile,
          password: password,
          status: 'pending'
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(Object.values(data).flat().join(', '));
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Network error. Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
        <Card className="w-full max-w-md relative backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl text-center py-10">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <CardTitle className="text-2xl font-bold mb-2">Registration Requested</CardTitle>
          <p className="text-muted-foreground px-6 mb-6">
            Your account has been successfully created. However, you need an Administrator to approve your account and assign your role before you can log in.
          </p>
          <Button onClick={() => { setSuccess(false); setIsLogin(true); }}>
            Back to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Field Senses
            </p>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{isLogin ? "Login" : "Create Account"}</CardTitle>
            <CardDescription className="mt-2">
              {isLogin ? "Enter credentials to access your portal" : "Sign up for a new employee account"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-5">
            
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" type="text" placeholder="John Doe" value={regName} onChange={(e) => setRegName(e.target.value)} required className="pl-10 h-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-sm font-medium">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="mobile" type="text" placeholder="9876543210" value={regMobile} onChange={(e) => setRegMobile(e.target.value)} required className="pl-10 h-11" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email" type="email" placeholder="your.email@company.com"
                  value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  required className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  required className="pl-10 h-11"
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-destructive text-center">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base font-medium shadow-md" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {isLogin ? "Signing in..." : "Creating Account..."}
                </div>
              ) : (
                isLogin ? "Sign in" : "Create Account"
              )}
            </Button>

            <div className="text-center mt-4 text-sm text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;