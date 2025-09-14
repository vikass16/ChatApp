// import { BrowserRouter as Router, Routes, Route} from "react-router-dom"; 
// import Navbar from "./components/Navbar";
// import MainPage from "./Pages/MainPage";
// import Login from "./Pages/Login";
// import Signup from "./Pages/Signup";
// import ChatArea from "./Pages/ChatArea";
// import ProtectedRoute from "./components/Protected";
// import { Navigate } from "react-router-dom";
// function App(){
//   return (
//     <Router>
//       <div className="App">
//         <Navbar/>
//         <Routes>
//           <Route path="/" element={<MainPage/>}/>
//           <Route path="/login" element={<Login/>}/>
//           <Route path="/signup" element={<Signup/>}/>
//           <Route path="/chatarea" element={
//             <ProtectedRoute>
//               <ChatArea/>
//             </ProtectedRoute>
//           }/>
//           <Route path="*" element={<Navigate to="/" replace />}/>
//         </Routes>
//       </div>
//     </Router>
//   );
// };
// export default App;


import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import MainPage from "./Pages/MainPage";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import ChatArea from "./Pages/ChatArea";
import ProtectedRoute from "./components/Protected";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/chatarea"
            element={
              <ProtectedRoute>
                <ChatArea />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
