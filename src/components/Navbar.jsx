import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <nav className=" bg-gradient-to-l from-purple-400 to-green-300 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <Link to="/" className="text-2xl font-bold hover:text-purple-200 transition-colors">
            Chat Application
          </Link>

          {/* Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/chatarea"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-500 transition-colors"
                >
                  Chat Area
                </Link>

                <div className="flex items-center space-x-2 bg-purple-700 px-3 py-2 rounded-md">
                  <span className="text-sm font-medium">
                    Welcome, {currentUser?.username || "User"}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-white text-purple-600 font-semibold px-3 py-1 rounded-md hover:bg-gray-100 transition-colors text-sm"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-500 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-500 transition-colors"
                >
                  Signup
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
