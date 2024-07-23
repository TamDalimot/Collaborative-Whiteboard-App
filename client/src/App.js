import { Route, Routes, useParams } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useEffect, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import io from "socket.io-client";

import Welcome from './components/Welcome/Welcome';
import Whiteboard from './components/Whiteboard/Whiteboard';
import Authentication from './components/Authentication/Authentication';
import Login from './components/Authentication/Login/Login';
import Register from './components/Authentication/Register/Register';
import NotFoundPage from './components/NotFoundPage/NotFoundPage';
import { AuthContext } from './context/AuthContext';
import { Protected } from './context/Protected';

const server = "http://localhost:5000";
const connectionOptions = {
  "force new connection": true,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
  transports: ["websocket"]
};

const socket = io(server, connectionOptions);

function App() {

  const [user, setUser] = useState(null)

  useEffect(() => {
    socket.on("userJoined", (data) => {
      if (data.success) {
        console.log("userJoined")
      } else {
        console.log("userJoined error")
      }
    }
    );
    socket.on('userLeft', (data) => {
      if (data.success) {
        console.log("userLeft")
      } else {
        console.log("userLeft error")
      }
    }
    )
  }, []);


  return (
    <AuthContext>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Authentication socket={socket} />} />
          <Route path="/welcome" element={<Protected><Welcome socket={socket} setUser={setUser} /></Protected>} />
          <Route path="/whiteboard/:roomId" element={<Protected><Whiteboard socket={socket} userId={user?.id} /></Protected>} />
          <Route path='*' element={<NotFoundPage />} />
        </Routes>
      </div>
      <ToastContainer />
    </AuthContext>
  );
}

export default App;
