
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService"; // Adjust path as needed

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleGoToLogin = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const result = await authService.signup(username, email, password);
      if (result.success) {
        setMessage("Account created successfully! Please login.");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setMessage(result.message || "Signup failed. Please try again.");
      }
    } catch (error) {
      setMessage(error.message || "Signup failed. Please try again.");
      console.error("Signup failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container flex items-center bg-gradient-to-bl from-indigo-600 to-green-300 justify-center p-6 min-h-screen">
      <div className="w-full max-w-md relative border-2 rounded-2xl flex items-center justify-center bg-gradient-to-br from-red-200 to-indigo-600 h-[520px] mb-4">
        {/* Animated floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-primary-glow/20 rounded-full blur-lg animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-3/4 w-16 h-16 bg-white/15 rounded-full blur-md animate-bounce delay-500"></div>
          <div className="absolute bottom-1/4 left-1/2 w-20 h-20 bg-primary/10 rounded-full blur-lg animate-pulse delay-2000"></div>
        </div>

        <div className="signup-card rounded-2xl p-8 relative z-10 w-full">
          <div className="text-center mb-2">
            {/* Animated icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-secondary rounded-2xl mb-4 shadow-glow transform transition-all duration-300 hover:rotate-6 hover:scale-110 text-white text-5xl animate-pulse select-none">
              🔐
            </div>

            <h1 className="text-3xl font-bold bg-gradient-secondary bg-clip-text text-transparent mb-2 animate-fade-in">
              Sign Up
            </h1>
            <p className="text-muted-foreground text-lg animate-fade-in delay-100">
              Create an account to start chatting
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6" aria-label="Signup form" noValidate>
            {/* Username Field */}
            <div className="space-y-2 group relative">
              <label
                htmlFor="username"
                className={`text-sm font-medium transition-colors duration-300 block ${
                  focusedField === "username" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="flex items-center gap-2 select-none">
                  👤 Username
                </span>
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                maxLength={20}
                required
                disabled={isLoading}
                aria-required="true"
                aria-disabled={isLoading}
                className="form-input w-full px-4 py-3 pl-12 rounded-xl text-foreground placeholder-muted-foreground text-base group-hover:shadow-md transition-all duration-300 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
              />
              <div
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                  focusedField === "username" ? "text-primary" : "text-muted-foreground"
                } select-none pointer-events-none`}
              >
                👤
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2 group relative">
              <label
                htmlFor="email"
                className={`text-sm font-medium transition-colors duration-300 block ${
                  focusedField === "email" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="flex items-center gap-2 select-none">
                  📧 Email
                </span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                maxLength={30}
                required
                disabled={isLoading}
                aria-required="true"
                aria-disabled={isLoading}
                className="form-input w-full px-4 py-3 pl-12 rounded-xl text-foreground placeholder-muted-foreground text-base group-hover:shadow-md transition-all duration-300 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
              />
              <div
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                  focusedField === "email" ? "text-primary" : "text-muted-foreground"
                } select-none pointer-events-none`}
              >
                📧
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2 group relative">
              <label
                htmlFor="password"
                className={`text-sm font-medium transition-colors duration-300 block ${
                  focusedField === "password" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="flex items-center gap-2 select-none">
                  🔒 Password
                </span>
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                maxLength={20}
                required
                disabled={isLoading}
                aria-required="true"
                aria-disabled={isLoading}
                className="form-input w-full px-4 py-3 pl-12 pr-12 rounded-xl text-foreground placeholder-muted-foreground text-base group-hover:shadow-md transition-all duration-300 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
              />
              <div
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                  focusedField === "password" ? "text-primary" : "text-muted-foreground"
                } select-none pointer-events-none`}
              >
                🔒
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors duration-300"
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                !username.trim() || !email.trim() || !password.trim() || isLoading
              }
              className={`signup-button w-full py-3 rounded-xl text-white font-semibold text-base relative overflow-hidden pb-2 mb-4 ${
                isLoading || !username.trim() || !email.trim() || !password.trim()
                  ? "opacity-50 cursor-not-allowed bg-purple-300"
                  : "bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-400"
              }`}
              aria-busy={isLoading}
            >
              <span className="relative z-10 flex items-center justify-center gap-2 select-none">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="animate-pulse">Creating Account...</span>
                  </>
                ) : (
                  <>
                    ➡️
                    <span>Sign Up</span>
                  </>
                )}
              </span>

              {/* Ripple effect */}
              <div className="absolute inset-0 bg-white/10 transform scale-0 group-active:scale-100 rounded-xl transition-transform duration-300"></div>
            </button>

            {/* Message Display */}
            {message && (
              <div
                className={`text-center font-medium py-3 px-4 rounded-xl transform transition-all duration-500 animate-fade-in ${
                  message.toLowerCase().includes("successfully")
                    ? "message-success animate-bounce text-green-600 bg-green-100"
                    : "message-error animate-shake text-red-600 bg-red-100"
                }`}
                role="alert"
                aria-live="assertive"
              >
                <div className="flex items-center justify-center gap-2 select-none">
                  {message.toLowerCase().includes("successfully") ? (
                    <span className="text-green-500 text-xl">✔️</span>
                  ) : (
                    <span className="text-red-500 text-xl">❌</span>
                  )}
                  {message}
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <a
                href="#"
                className="text-primary hover:text-primary-glow font-medium transition-colors"
                onClick={handleGoToLogin}
              >
                Log in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
