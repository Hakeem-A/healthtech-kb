import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAuditLogs, getAssistantLogs } from '../api/admin';
import { useAuth } from '../context/useAuth';
import Layout from '../components/Layout';
import Icon from '../components/icons';

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getActionBadgeClass(action) {
  const lower = (action || '').toLowerCase();
  if (lower.includes('approve')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (lower.includes('reject') || lower.includes('delete')) return 'bg-rose-100 text-rose-800 border-rose-200';
  if (lower.includes('create') || lower.includes('add')) return 'bg-purple-100 text-purple-800 border-purple-200';
  if (lower.includes('update') || lower.includes('edit')) return 'bg-blue-100 text-blue-800 border-blue-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'success':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'fallback':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'no_results':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'assistant'
  const [auditLogs, setAuditLogs] = useState([]);
  const [assistantLogs, setAssistantLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [selectedAssistantLog, setSelectedAssistantLog] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const [auditData, assistantData] = await Promise.all([
        getAuditLogs(),
        getAssistantLogs(),
      ]);
      setAuditLogs(auditData || []);
      setAssistantLogs(assistantData || []);
    } catch (err) {
      setError(err.message || 'Failed to load logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchLogs();
    }
  }, [user]);

  // Derived filtered logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        !searchTerm ||
        log.actor_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(log.target_id).includes(searchTerm);

      const matchesAction =
        actionFilter === 'all' ||
        log.target_type?.toLowerCase() === actionFilter.toLowerCase() ||
        log.action?.toLowerCase().includes(actionFilter.toLowerCase());

      return matchesSearch && matchesAction;
    });
  }, [auditLogs, searchTerm, actionFilter]);

  const filteredAssistantLogs = useMemo(() => {
    return assistantLogs.filter((log) => {
      const matchesSearch =
        !searchTerm ||
        log.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.reply?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.session_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.widget_source?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || log.status === statusFilter;

      const matchesFeedback =
        feedbackFilter === 'all' ||
        (feedbackFilter === 'helpful' && log.helpful === true) ||
        (feedbackFilter === 'unhelpful' && log.helpful === false) ||
        (feedbackFilter === 'unrated' && log.helpful === null);

      return matchesSearch && matchesStatus && matchesFeedback;
    });
  }, [assistantLogs, searchTerm, statusFilter, feedbackFilter]);

  // Export handlers
  const handleExportCSV = () => {
    if (activeTab === 'audit') {
      const headers = ['ID', 'Actor Email', 'Action', 'Target Type', 'Target ID', 'Timestamp'];
      const rows = filteredAuditLogs.map((l) => [
        l.id,
        l.actor_email || '',
        `"${(l.action || '').replace(/"/g, '""')}"`,
        l.target_type || '',
        l.target_id || '',
        l.timestamp,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['ID', 'Session ID', 'User / Source', 'User Message', 'Bot Reply', 'Status', 'Confidence', 'Helpful', 'Latency (ms)', 'Timestamp'];
      const rows = filteredAssistantLogs.map((l) => [
        l.id,
        l.session_id || '',
        l.user_email || l.widget_source || '',
        `"${(l.message || '').replace(/"/g, '""')}"`,
        `"${(l.reply || '').replace(/"/g, '""')}"`,
        l.status || '',
        l.confidence || '',
        l.helpful === true ? 'Helpful' : l.helpful === false ? 'Unhelpful' : 'None',
        l.response_time_ms || '',
        l.created_at,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assistant_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Metrics
  const totalAuditCount = auditLogs.length;
  const totalAssistantCount = assistantLogs.length;
  const ratedLogs = assistantLogs.filter((l) => l.helpful !== null && l.helpful !== undefined);
  const helpfulCount = ratedLogs.filter((l) => l.helpful === true).length;
  const helpfulPercentage = ratedLogs.length > 0 ? Math.round((helpfulCount / ratedLogs.length) * 100) : 0;
  const avgLatency = useMemo(() => {
    const withTime = assistantLogs.filter((l) => typeof l.response_time_ms === 'number');
    if (!withTime.length) return 0;
    return Math.round(withTime.reduce((acc, curr) => acc + curr.response_time_ms, 0) / withTime.length);
  }, [assistantLogs]);

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-16 px-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="shield" className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-slate-600 text-lg">
            This administration portal is only accessible to authorized system administrators.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-6 sm:px-10 py-10 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3.5 mb-2">
              <span className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl shadow-sm">
                <Icon name="shield" className="w-8 h-8" />
              </span>
              Audit & Assistant Logs
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed">
              Monitor administrative security operations and conversational assistant interactions in real time.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-base transition shadow-sm disabled:opacity-50"
            >
              <Icon name="activity" className={`w-5 h-5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              Refresh Logs
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base transition shadow-md hover:shadow-lg"
            >
              <Icon name="clipboard" className="w-5 h-5" />
              Export {activeTab === 'audit' ? 'Audit CSV' : 'Assistant CSV'}
            </button>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-md transition-all hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-slate-500">Total Audit Events</span>
              <span className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Icon name="shield" className="w-6 h-6" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900">{totalAuditCount}</div>
              <div className="text-sm text-slate-500 mt-1">Logged admin operations</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-md transition-all hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-slate-500">Assistant Queries</span>
              <span className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Icon name="message" className="w-6 h-6" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900">{totalAssistantCount}</div>
              <div className="text-sm text-slate-500 mt-1">Queries processed by bot</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-md transition-all hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-slate-500">User Satisfaction</span>
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Icon name="thumbsUp" className="w-6 h-6" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-emerald-600">
                {ratedLogs.length > 0 ? `${helpfulPercentage}%` : 'N/A'}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {ratedLogs.length} rated interactions ({helpfulCount} helpful)
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-md transition-all hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-slate-500">Avg Assistant Latency</span>
              <span className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Icon name="activity" className="w-6 h-6" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-slate-900">
                {avgLatency > 0 ? `${avgLatency} ms` : '—'}
              </div>
              <div className="text-sm text-slate-500 mt-1">Average generation speed</div>
            </div>
          </div>
        </div>

        {/* Main Tabbed Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden mb-10">
          {/* Tabs & Filter Header */}
          <div className="border-b border-slate-200 px-8 py-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-50/50">
            <div className="flex items-center gap-3 p-1.5 bg-slate-200/70 rounded-2xl">
              <button
                onClick={() => {
                  setActiveTab('audit');
                  setSearchTerm('');
                }}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-base font-bold transition-all ${
                  activeTab === 'audit'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon name="shield" className="w-5 h-5 text-purple-600" />
                Audit Logs ({filteredAuditLogs.length})
              </button>

              <button
                onClick={() => {
                  setActiveTab('assistant');
                  setSearchTerm('');
                }}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-base font-bold transition-all ${
                  activeTab === 'assistant'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon name="message" className="w-5 h-5 text-blue-600" />
                Assistant Logs ({filteredAssistantLogs.length})
              </button>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative min-w-[300px] flex-1">
                <Icon
                  name="search"
                  className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
                />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    activeTab === 'audit'
                      ? 'Search actor, action, target...'
                      : 'Search messages, sessions, sources...'
                  }
                  className="w-full pl-12 pr-5 py-3 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>

              {activeTab === 'audit' ? (
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="text-base font-medium bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                  <option value="all">All Targets</option>
                  <option value="article">Articles</option>
                  <option value="user">Users</option>
                  <option value="category">Categories</option>
                </select>
              ) : (
                <>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-base font-medium bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="success">Success</option>
                    <option value="fallback">Fallback</option>
                    <option value="no_results">No Results</option>
                  </select>

                  <select
                    value={feedbackFilter}
                    onChange={(e) => setFeedbackFilter(e.target.value)}
                    className="text-base font-medium bg-white border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  >
                    <option value="all">All Feedback</option>
                    <option value="helpful">Helpful 👍</option>
                    <option value="unhelpful">Unhelpful 👎</option>
                    <option value="unrated">Unrated</option>
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Tab Content */}
          {error && (
            <div className="p-6 bg-red-50 border-b border-red-200 text-red-700 text-base">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-16 text-center text-slate-500 text-lg">
              <Icon name="activity" className="w-10 h-10 mx-auto mb-4 animate-spin text-blue-500" />
              Loading logs...
            </div>
          ) : activeTab === 'audit' ? (
            /* ================= AUDIT LOGS TABLE ================= */
            <div className="overflow-x-auto">
              {filteredAuditLogs.length === 0 ? (
                <div className="p-16 text-center text-slate-500 text-lg">
                  No audit log entries found matching the search and filter criteria.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50 text-sm font-bold uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-8 py-4">Actor</th>
                      <th className="px-8 py-4">Action</th>
                      <th className="px-8 py-4">Target Type</th>
                      <th className="px-8 py-4">Target Reference</th>
                      <th className="px-8 py-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-base">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{log.actor_email || 'System'}</div>
                          {log.actor_id && (
                            <div className="text-sm text-slate-400 mt-0.5">User ID: #{log.actor_id}</div>
                          )}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold border ${getActionBadgeClass(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-slate-800 capitalize font-semibold">
                          {log.target_type}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-slate-700 font-medium">
                          {log.target_type === 'article' && log.target_id ? (
                            <Link
                              to={`/articles/${log.target_id}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-semibold inline-flex items-center gap-1.5"
                            >
                              Article #{log.target_id}
                              <Icon name="document" className="w-4 h-4" />
                            </Link>
                          ) : log.target_id ? (
                            `#${log.target_id}`
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right text-slate-600 text-sm">
                          <div className="font-semibold text-slate-800">{formatDate(log.timestamp)}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{timeAgo(log.timestamp)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            /* ================= ASSISTANT LOGS TABLE ================= */
            <div className="overflow-x-auto">
              {filteredAssistantLogs.length === 0 ? (
                <div className="p-16 text-center text-slate-500 text-lg">
                  No assistant conversation logs found matching the search and filter criteria.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50 text-sm font-bold uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-8 py-4">User / Source</th>
                      <th className="px-8 py-4">User Prompt</th>
                      <th className="px-8 py-4">Bot Response</th>
                      <th className="px-8 py-4">Status & Latency</th>
                      <th className="px-8 py-4 text-center">Feedback</th>
                      <th className="px-8 py-4 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-base">
                    {filteredAssistantLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedAssistantLog(log)}
                        className="hover:bg-blue-50/60 cursor-pointer transition-colors"
                      >
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="font-bold text-slate-900 text-sm truncate max-w-[180px]">
                            {log.user_email || 'HMIS Guest'}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5 truncate b">
                            {log.widget_source ? `Host: ${log.widget_source}` : `Session: ${log.session_id.slice(0, 12)}…`}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="font-semibold text-slate-800 line-clamp-2 max-w-sm">
                            {log.message}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-slate-600 line-clamp-2 max-w-md">
                            {log.reply}
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5 items-start">
                            {log.status && (
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusBadgeClass(
                                  log.status
                                )}`}
                              >
                                {log.status}
                              </span>
                            )}
                            {typeof log.response_time_ms === 'number' && (
                              <span className="text-xs text-slate-500 font-mono font-medium">
                                ⚡ {log.response_time_ms} ms
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-center">
                          {log.helpful === true ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold">
                              <Icon name="thumbsUp" className="w-4 h-4" /> Helpful
                            </span>
                          ) : log.helpful === false ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-100 text-rose-800 text-sm font-bold">
                              <Icon name="thumbsDown" className="w-4 h-4" /> Unhelpful
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400 font-medium">Unrated</span>
                          )}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right text-slate-600 text-sm">
                          <div className="font-semibold text-slate-800">{formatDate(log.created_at)}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{timeAgo(log.created_at)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Modal for Assistant Log Details */}
        {selectedAssistantLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                    <Icon name="message" className="w-6 h-6" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xl">Conversation Interaction Details</h3>
                    <p className="text-sm text-slate-500">Inspection of user query & LLM response metadata</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAssistantLog(null)}
                  className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200 text-xl font-bold transition"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-6">
                {/* Metadata cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs font-semibold uppercase block mb-1">Status</span>
                    <span className="font-bold text-slate-900 uppercase">{selectedAssistantLog.status || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-semibold uppercase block mb-1">Confidence</span>
                    <span className="font-bold text-slate-900 capitalize">{selectedAssistantLog.confidence || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-semibold uppercase block mb-1">Latency</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {selectedAssistantLog.response_time_ms ? `${selectedAssistantLog.response_time_ms} ms` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-semibold uppercase block mb-1">Feedback</span>
                    <span className="font-bold text-slate-900">
                      {selectedAssistantLog.helpful === true ? '👍 Helpful' : selectedAssistantLog.helpful === false ? '👎 Unhelpful' : 'None'}
                    </span>
                  </div>
                </div>

                {/* Session & Caller Info */}
                <div className="text-sm text-slate-600 space-y-1.5 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                  <div><span className="font-bold text-slate-700">Session ID:</span> <span className="font-mono">{selectedAssistantLog.session_id}</span></div>
                  <div><span className="font-bold text-slate-700">User / Source:</span> {selectedAssistantLog.user_email || 'HMIS Widget Guest'}</div>
                  {selectedAssistantLog.widget_source && (
                    <div><span className="font-bold text-slate-700">Widget Host:</span> {selectedAssistantLog.widget_source}</div>
                  )}
                  <div><span className="font-bold text-slate-700">Timestamp:</span> {formatDate(selectedAssistantLog.created_at)} ({timeAgo(selectedAssistantLog.created_at)})</div>
                </div>

                {/* User Prompt */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">User Prompt</h4>
                  <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-slate-900 text-base leading-relaxed font-medium">
                    {selectedAssistantLog.message}
                  </div>
                </div>

                {/* Bot Response */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Assistant Response</h4>
                  <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5 text-slate-900 text-base leading-relaxed whitespace-pre-wrap">
                    {selectedAssistantLog.reply}
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setSelectedAssistantLog(null)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-base font-semibold transition shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}