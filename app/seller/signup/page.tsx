"use client";

import { useState, useCallback } from "react";
import Captcha from "../../components/Captcha";

export default function SellerSignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [about, setAbout] = useState("");
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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate CAPTCHA
    if (!captchaToken) {
      setError("Please complete the CAPTCHA verification");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/seller/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password, 
          storeName, 
          city, 
          state, 
          country, 
          about,
          captchaToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Reset CAPTCHA on error
        setCaptchaToken(null);
        setError(data.error || "Signup failed");
        return;
      }

      // Store token and redirect
      localStorage.setItem("token", data.token);
      window.location.href = "/seller/dashboard";
    } catch (err) {
      setCaptchaToken(null);
      setError("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 px-4 pb-10">
      <h1 className="text-2xl font-bold mb-6">Seller Signup</h1>
      <form onSubmit={handleSignup} className="space-y-4">
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
        <input 
          className="w-full border p-2 rounded"
          placeholder="Store Name"
          value={storeName}
          onChange={e => setStoreName(e.target.value)}
          required
          disabled={loading}
        />
        <input 
          className="w-full border p-2 rounded"
          placeholder="City"
          value={city}
          onChange={e => setCity(e.target.value)}
          disabled={loading}
        />
        <input 
          className="w-full border p-2 rounded"
          placeholder="State"
          value={state}
          onChange={e => setState(e.target.value)}
          disabled={loading}
        />
        <input 
          className="w-full border p-2 rounded"
          placeholder="Country"
          value={country}
          onChange={e => setCountry(e.target.value)}
          disabled={loading}
        />
        <textarea 
          className="w-full border p-2 rounded"
          placeholder="About your store"
          rows={3}
          value={about}
          onChange={e => setAbout(e.target.value)}
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
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !captchaToken}
        >
          {loading ? "Creating Account..." : "Create Seller Account"}
        </button>
      </form>
      
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have a seller account?{" "}
        <a href="/seller/login" className="text-blue-600 hover:underline">
          Login
        </a>
      </p>
    </div>
  );
}
