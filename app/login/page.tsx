"use client";

import { useState, useCallback } from "react";
import Captcha from "../components/Captcha";

export default function BuyerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Handle CAPTCHA verification
  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
    setError(""); // Clear any previous errors
  }, []);

  // Handle CAPTCHA expiration
  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
  }, []);

  // Handle CAPTCHA error
  const handleCaptchaError = useCallback((errorMsg: string) => {
    setError(`CAPTCHA error: ${errorMsg}`);
    setCaptchaToken(null);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate CAPTCHA
    if (!captchaToken) {
      setError("Please complete the CAPTCHA verification");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/buyer/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password,
          captchaToken,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        // Reset CAPTCHA on error
        setCaptchaToken(null);
        return setError(data.error || data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      window.location.href = "/account";
    } catch (err) {
      setCaptchaToken(null);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 px-4">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input 
          className="w-full border p-2 rounded"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <input 
          className="w-full border p-2 rounded"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        
        {/* CAPTCHA Widget */}
        <div className="my-4">
          <Captcha
            onVerify={handleCaptchaVerify}
            onExpire={handleCaptchaExpire}
            onError={handleCaptchaError}
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <button 
          type="submit"
          className="bg-black text-white p-2 w-full rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !captchaToken}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      
      <p className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <a href="/signup" className="text-blue-600 hover:underline">
          Sign up
        </a>
      </p>
    </div>
  );
}
