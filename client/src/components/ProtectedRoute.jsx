import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function ProtectedRoute({ children, requireRole, allowedRoles, exactRole }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (exactRole && user.role !== exactRole) {
    return <Navigate to="/articles" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/articles" replace />;
  }

  const ROLE_RANK = { viewer: 1, editor: 2, admin: 3 };
  if (requireRole && ROLE_RANK[user.role] < ROLE_RANK[requireRole]) {
    return <Navigate to="/articles" replace />;
  }

  return children;
}