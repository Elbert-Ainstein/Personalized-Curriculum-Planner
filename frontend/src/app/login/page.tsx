"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Stub: Replace with real backend call
    setTimeout(() => {
      setLoading(false);
      localStorage.removeItem("guest");
      // Simulate error for demonstration
      // localStorage.setItem("login_error", "Invalid credentials");
      // router.replace("/login");
      router.replace("/");
    }, 1000);
  };

  // Show error from localStorage if redirected back
  useEffect(() => {
    if (typeof window !== "undefined") {
      const err = localStorage.getItem("login_error");
      if (err) {
        setError(err);
        localStorage.removeItem("login_error");
      }
    }
  }, []);

  return (
    <main className="flex h-screen bg-gradient-to-br from-gray-100 to-blue-100 justify-center items-center">
      <div className="flex flex-col w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-4 text-center">{isRegister ? "Register" : "Login"}</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border rounded px-3 py-2"
            required
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? (isRegister ? "Registering..." : "Logging in...") : (isRegister ? "Register" : "Login")}
          </button>
        </form>
        <button
          className="mt-4 text-blue-600 hover:underline text-sm"
          onClick={() => setIsRegister(r => !r)}
        >
          {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
        </button>
        <div className="my-4 text-center text-gray-400">or</div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 w-full"
          onClick={() => { localStorage.removeItem("guest"); signIn("google"); }}
        >
          Sign in with Google
        </button>
        {error && <div className="mt-4 text-red-600 text-sm text-center">{error}</div>}
      </div>
    </main>
  );
} 