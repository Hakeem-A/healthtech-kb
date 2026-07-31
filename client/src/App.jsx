import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import ChatWidget from './components/ChatWidget';
import Login from './pages/Login';
import ArticleList from './pages/ArticleList';
import ArticleDetail from './pages/ArticleDetail';
import ArticleEditor from './pages/ArticleEditor';
import UserList from './pages/UserList';
import AddUser from './pages/AddUser';
import WidgetPage from './pages/WidgetPage';
import SearchResults from './pages/SearchResults';
import ReviewQueue from './pages/ReviewQueue';
import Analytics from './pages/Analytics';



function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/widget" element={<WidgetPage />} />
        <Route path="/search" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
        <Route path="/articles" element={<ProtectedRoute><ArticleList /></ProtectedRoute>} />
        <Route path="/review" element={<ProtectedRoute requireRole="admin"><ReviewQueue /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute requireRole="admin"><Analytics /></ProtectedRoute>} />
        <Route path="/articles/new" element={<ProtectedRoute requireRole="editor"><ArticleEditor /></ProtectedRoute>} />
        <Route path="/articles/:id/edit" element={<ProtectedRoute requireRole="editor"><ArticleEditor /></ProtectedRoute>} />
        <Route path="/articles/:id" element={<ProtectedRoute><ArticleDetail /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute requireRole="admin"><UserList /></ProtectedRoute>} />
        <Route path="/users/new" element={<ProtectedRoute requireRole="admin"><AddUser /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/articles" replace />} />
      </Routes>
      {isAuthenticated && <ChatWidget />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;