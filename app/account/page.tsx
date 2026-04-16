"use client";
import { useState, useEffect } from "react";

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // Decode JWT to get user info (simple decode, not verification)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("token");
      window.location.href = "/login";
      return;
    }

    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      <div className="space-y-4">
        <p>Welcome, {user?.email}!</p>
        <p>Role: {user?.role}</p>
        <button 
          onClick={handleLogout}
          className="bg-red-500 text-white p-2 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
