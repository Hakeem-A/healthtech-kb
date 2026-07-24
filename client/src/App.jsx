import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/articles"
            element={
              <ProtectedRoute>
                <div className="p-8">Articles list goes here — next step</div>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/articles" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;