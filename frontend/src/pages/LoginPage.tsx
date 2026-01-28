import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, type Location } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("superadmin");
  const [password, setPassword] = useState("superadmin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname || "/";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[var(--color-background)]">
      {/* Light subtle background accents (optional) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 animate-scale-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Feedback System</h1>
            <p className="text-slate-500 font-medium">Admin login</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Username</label>
              <input
                className="w-full rounded-xl border-2 border-slate-200 p-3.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Password</label>
              <input
                type="password"
                className="w-full rounded-xl border-2 border-slate-200 p-3.5 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-4 font-bold text-white shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-center text-sm text-slate-600">
              Need to submit a complaint?{" "}
              <Link
                className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
                to="/submit"
              >
                Go to public form →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

