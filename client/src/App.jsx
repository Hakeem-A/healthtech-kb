import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ArticleList from './pages/ArticleList';
import ArticleDetail from './pages/ArticleDetail';

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
                <ArticleList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/articles/:id"
            element={
              <ProtectedRoute>
                <ArticleDetail />
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