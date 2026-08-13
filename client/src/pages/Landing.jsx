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
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
          <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">
            H
          </span>
          HealthTech KB
        </div>
        <Link
          to="/login"
          className="bg-blue-600 text-white text-base font-medium rounded-lg px-6 py-2.5 hover:bg-blue-700 transition"
        >
          Log in
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          One place for every HMIS how-to, SOP, and answer.
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
          A knowledge base and assistant for clinical and support staff —
          find the right procedure, or just ask.
        </p>
        <Link
          to="/login"
          className="inline-block bg-blue-600 text-white text-lg font-medium rounded-lg px-8 py-3.5 hover:bg-blue-700 transition"
        >
          Log in to get started
        </Link>
      </main>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="border border-slate-200 rounded-xl p-6"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Icon name={f.icon} className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1.5">
                {f.title}
              </h3>
              <p className="text-base text-slate-500 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-6 text-center text-sm text-slate-400">
        HealthTech KB — internal knowledge base
      </footer>
    </div>
  );
}