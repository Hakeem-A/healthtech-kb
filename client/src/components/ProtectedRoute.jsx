import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireRole }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const ROLE_RANK = { viewer: 1, editor: 2, admin: 3 };
  if (requireRole && ROLE_RANK[user.role] < ROLE_RANK[requireRole]) {
    return <Navigate to="/articles" replace />;
  }

  return children;
}