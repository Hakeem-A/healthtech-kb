import { useEffect, useState } from 'react';
import { getAuditLogs, getAssistantLogs } from '../api/admin';
import { useAuth } from '../context/useAuth';
import Layout from '../components/Layout';

const AdminDashboard = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [assistantLogs, setAssistantLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const [auditData, assistantData] = await Promise.all([
          getAuditLogs(),
          getAssistantLogs(),
        ]);
        setAuditLogs(auditData || []);
        setAssistantLogs(assistantData || []);
      } catch (err) {
        setError('Failed to load logs. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchLogs();
    }
  }, [user]);

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
          <p className="text-slate-600 mt-2">
            You do not have permission to view this page.
          </p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return <Layout><div>Loading...</div></Layout>;
  }

  if (error) {
    return <Layout><div>{error}</div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Admin Dashboard</h1>

        {/* Audit Logs */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-700 mb-4">Audit Logs</h2>
          <div className="bg-white shadow rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {auditLogs?.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{log.actor_email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{log.action}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{log.target_type} ({log.target_id})</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assistant Logs */}
        <div>
          <h2 className="text-2xl font-semibold text-slate-700 mb-4">Assistant Logs</h2>
          <div className="bg-white shadow rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Session ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reply</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {assistantLogs?.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{log.session_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{log.message}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{log.reply}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;