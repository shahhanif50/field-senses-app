import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { initialEmployees, initialRoles } from "@/data/masterData";

// Admin credentials for admin portal
const ADMIN_CREDENTIALS = {
  email: "admin@example.com",
  password: "Admin@123",
};

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = email.trim() !== "" && password.trim() !== "";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const host = window.location.hostname;
      const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : `http://${host}:8000/api`;
      
      const response = await fetch(`${BASE}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid username or password");
        setIsLoading(false);
        return;
      }

      // Store session info
      sessionStorage.setItem("userName", data.fullName);
      sessionStorage.setItem("userEmail", data.email);
      sessionStorage.setItem("employeeId", data.id);
      sessionStorage.setItem("departmentId", data.departmentId || "");

      // Redirect based on roleCode from backend
      switch (data.roleCode) {
        case "SALES":
          sessionStorage.setItem("userRole", "sales");
          navigate("/sales-portal");
          break;
        case "OPS":
          sessionStorage.setItem("userRole", "ops");
          sessionStorage.setItem("isAdminLoggedIn", "true");
          navigate("/?tab=ops-manager");
          break;
        case "MGR":
          sessionStorage.setItem("userRole", "manager");
          sessionStorage.setItem("isAdminLoggedIn", "true");
          navigate("/?tab=ops-manager");
          break;
        case "ADMIN":
          sessionStorage.setItem("userRole", "admin");
          sessionStorage.setItem("isAdminLoggedIn", "true");
          navigate("/");
          break;
        default:
          sessionStorage.setItem("userRole", data.roleCode); // Set the real role
          sessionStorage.setItem("isAdminLoggedIn", "true");
          navigate("/");
      }
    } catch (err) {
      setError("Network error. Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Logo/Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>

          {/* System Name */}
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Field Senses
            </p>
          </div>

          <div>
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription className="mt-2">
              Enter credentials to access your portal
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="pl-10 pr-10 h-11 bg-background/50 border-border/50 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium text-center">
                  {error}
                </p>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                onClick={() => alert("Please contact your system administrator to reset your password.")}
              >
                Forgot Password?
              </button>
            </div>
          </form>

          {/* Demo Credentials Hint */}
          <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2">
            <p className="text-xs text-muted-foreground text-center font-medium">Demo Credentials:</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium">Admin:</span> admin@example.com / Admin@123</p>
              <p><span className="font-medium">Sales:</span> john@constructpro.com / Sales@123</p>
              <p><span className="font-medium">Ops:</span> sarah@constructpro.com / Ops@123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;