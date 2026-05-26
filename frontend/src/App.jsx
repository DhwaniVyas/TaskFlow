import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';

function App() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("inviteToken");
    if (token) {
      sessionStorage.setItem("pending_invite_token", token);
    }
  }, []);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
