
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();
  
  const handleGettingStarted = () => {
    navigate("/signup");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const result = await authService.login(username, password);
      if (result.success) {
        setMessage("Login Successful");
        setTimeout(() => {
          navigate("/chatarea");
        }, 1500);
      }
    } catch (error) {
      setMessage(error.message || "Login failed. Please try again.");
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputFocus = (field) => {
    setFocusedField(field);
  };

  const handleInputBlur = () => {
    setFocusedField(null);
  };

  return (
    <div className="login-container flex items-center bg-gradient-to-bl from-indigo-600 to bg-green-300 justify-center p-4 min-h-screen">
      <div className="w-full max-w-md relative border-2 rounded-2xl flex items-center justify-center bg-gradient-to-br from-red-200 to-indigo-600 h-130 mb-4">
        {/* Animated floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-primary-glow/20 rounded-full blur-lg animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-3/4 w-16 h-16 bg-white/15 rounded-full blur-md animate-bounce delay-500"></div>
          <div className="absolute bottom-1/4 left-1/2 w-20 h-20 bg-primary/10 rounded-full blur-lg animate-pulse delay-2000"></div>
        </div>

        <div className="login-card rounded-2xl p-8 relative z-10">
          <div className="text-center mb-8">
            {/* Animated logo/icon replaced with emoji */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-secondary rounded-2xl mb-4 shadow-glow transform transition-all duration-300 hover:rotate-6 hover:scale-110 text-white text-5xl animate-pulse select-none">
              🔒
            </div>
            
            <h1 className="text-3xl font-bold bg-gradient-secondary bg-clip-text text-transparent mb-2 animate-fade-in">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-lg animate-fade-in delay-100">
              Sign in to start chatting
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2 group">
              <label className={`text-sm font-medium transition-colors duration-300 block ${
                focusedField === 'username' ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <span className="flex items-center gap-2 select-none">
                  {/* Emoji user icon */}
                  👤
                  Username
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => handleInputFocus('username')}
                  onBlur={handleInputBlur}
                  className="form-input w-full px-4 py-3 pl-12 rounded-xl text-foreground placeholder-muted-foreground text-base group-hover:shadow-md transition-all duration-300 border-1"
                  maxLength={20}
                  required
                  disabled={isLoading}
                />
                <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                  focusedField === 'username' ? 'text-primary' : 'text-muted-foreground'
                } select-none`}>
                  👤
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2 group">
              <label className={`text-sm font-medium transition-colors duration-300 block ${
                focusedField === 'password' ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <span className="flex items-center gap-2 select-none">
                  {/* Emoji lock icon */}
                  🔒
                  Password
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => handleInputFocus('password')}
                  onBlur={handleInputBlur}
                  className="form-input w-full px-4 py-3 pl-12 pr-12 rounded-xl text-foreground placeholder-muted-foreground text-base group-hover:shadow-md transition-all duration-300 border-1"
                  maxLength={20}
                  required
                  disabled={isLoading}
                />
                <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                  focusedField === 'password' ? 'text-primary' : 'text-muted-foreground'
                } select-none`}>
                  🔒
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors duration-300"
                  disabled={isLoading}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Animated Login Button */}
            <button
              type="submit"
              disabled={!username.trim() || !password.trim() || isLoading}
              className={`login-button w-full py-3 rounded-xl text-white font-semibold text-base relative overflow-hidden ${
                isLoading || !username.trim() || !password.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-glow"
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2 select-none">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="animate-pulse">Signing in...</span>
                  </>
                ) : (
                  <>
                    {/* Arrow emoji instead of SVG */}
                    ➡️
                    <span>Sign In</span>
                  </>
                )}
              </span>
              
              {/* Ripple effect */}
              <div className="absolute inset-0 bg-white/10 transform scale-0 group-active:scale-100 rounded-xl transition-transform duration-300"></div>
            </button>

            {/* Enhanced Message Display */}
            {message && (
              <div
                className={`text-center font-medium py-3 px-4 rounded-xl transform transition-all duration-500 animate-fade-in ${
                  message.includes("Successful") 
                    ? "message-success animate-bounce" 
                    : "message-error animate-shake"
                }`}
              >
                <div className="flex items-center justify-center gap-2 select-none">
                  {message.includes("Successful") ? (
                    <span className="text-green-500 text-xl">✔️</span>
                  ) : (
                    <span className="text-red-500 text-xl">❌</span>
                  )}
                  {message}
                </div>
              </div>
            )}
          </form>

          {/* Enhanced Footer */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm ">
              Don't have an account?{" "}
              <a href="#" className="text-primary hover:text-primary-glow font-medium transition-colors" onClick={handleGettingStarted}>
                Sign up here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
