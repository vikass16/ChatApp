

import { useNavigate } from "react-router-dom";

const MainPage = () => {
  const navigate = useNavigate();

  const handleGettingStarted = () => {
    navigate("/signup");
  };

  const handleLearnMore = () => {
    window.open("https://www.google.com", "_blank");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 p-6">
      {/* Title */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white text-center mb-8 drop-shadow-lg">
        Welcome to the Chat Application
      </h1>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleGettingStarted}
          className="bg-white text-purple-600 font-bold px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
        >
          Getting Started
        </button>

        <button
          onClick={handleLearnMore}
          className="bg-purple-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 hover:bg-purple-700"
        >
          Learn More
        </button>
      </div>

      {/* Optional Footer Text */}
      <p className="mt-12 text-white text-center text-sm sm:text-base">
        Join the community and start chatting instantly!
      </p>
    </div>
  );
};

export default MainPage;
