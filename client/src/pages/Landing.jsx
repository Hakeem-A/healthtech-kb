import { Link } from 'react-router-dom';
import Icon from '../components/icons';

const FEATURES = [
  {
    icon: 'articles',
    title: 'Centralized SOPs & guides',
    description: 'Registration, appointments, lab orders, pharmacy, and more — all in one searchable place.',
  },
  {
    icon: 'search',
    title: 'Fast, ranked search',
    description: 'Find the right article by title, tag, or content, with results ranked by relevance.',
  },
  {
    icon: 'message',
    title: 'KB Assistant chatbot',
    description: 'Ask a question in plain language and get an answer grounded in published articles.',
  },
  {
    icon: 'shield',
    title: 'Role-based access',
    description: 'Viewers read, editors draft, admins publish — with a full audit trail of every change.',
  },
  {
    icon: 'inbox',
    title: 'Review workflow',
    description: 'Drafts move through review before publishing, with rejection reasons when they need work.',
  },
  {
    icon: 'chart',
    title: 'Usage analytics',
    description: 'Track what staff search for, what they read, and where the knowledge base has gaps.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col justify-between font-sans">
      {/* Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 sm:px-12 py-4 flex items-center justify-between z-30 shadow-2xs">
        <div className="flex items-center gap-2.5 font-bold text-xl text-slate-900 tracking-tight">
          <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-extrabold shadow-xs">
            H
          </span>
          <span>HealthTech <span className="text-blue-600">KB</span></span>
        </div>
        <Link
          to="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl px-5 py-2.5 transition shadow-xs hover:shadow-md"
        >
          Staff Sign In →
        </Link>
      </header>

      {/* Hero */}
      <main className="px-6 sm:px-12 py-16 sm:py-24 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 font-bold text-xs px-3.5 py-1.5 rounded-full border border-blue-200 mb-6 shadow-2xs">
          🏥 Hospital HMIS Standard Operating Procedures & AI Assistant
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-[1.1]">
          One place for every clinical how-to, protocol, and answer.
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Centralized clinical knowledge base with role-based governance, ranked search, and an AI-powered assistant for hospital staff.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white text-base font-bold rounded-xl px-8 py-3.5 transition shadow-sm hover:shadow-md"
          >
            Access Knowledge Base
          </Link>
          <Link
            to="/login"
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-base font-bold rounded-xl px-8 py-3.5 transition shadow-xs"
          >
            View Demo Roles
          </Link>
        </div>
      </main>

      {/* Features Grid */}
      <section className="px-6 sm:px-12 pb-24 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 shadow-2xs">
                <Icon name={f.icon} className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-6 text-center text-xs font-medium text-slate-400">
        HealthTech KB — Clinical Knowledge Base & Hospital Operations Platform
      </footer>
    </div>
  );
}