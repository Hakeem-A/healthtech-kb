import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getArticle,
  createArticle,
  updateArticle,
  listCategories,
  listTags,
} from '../api/articles';
import { useAuth } from '../context/useAuth';
import Layout from '../components/Layout';
import RichTextEditor from '../components/RichTextEditor';

export default function ArticleEditor() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('under_review');
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const canSetPublishedOrArchived = user.role === 'admin';

  useEffect(() => {
    Promise.all([listCategories(), listTags()])
      .then(([cats, tagList]) => {
        setCategories(cats);
        setTags(tagList);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    getArticle(id)
      .then((article) => {
        setTitle(article.title);
        setContent(article.content);
        setCategoryId(String(article.category_id));
        setStatus(article.status);
        setSelectedTagIds(article.tags?.map((t) => t.id) || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEditMode]);

  function toggleTag(tagId) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      title,
      content, // now HTML from editor
      category_id: Number(categoryId),
      status,
      tag_ids: selectedTagIds,
    };

    try {
      if (isEditMode) {
        await updateArticle(id, payload);
        navigate(`/articles/${id}`);
      } else {
        const created = await createArticle(payload);
        navigate(`/articles/${created.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-10 text-lg text-slate-600 leading-relaxed">Loading…</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to={isEditMode ? `/articles/${id}` : '/articles'}
            className="inline-flex items-center gap-2 text-base font-semibold text-slate-600 hover:text-slate-900 transition bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-xs"
          >
            ← Back to {isEditMode ? 'Article' : 'Articles'}
          </Link>
          <div className="text-sm font-semibold text-slate-500">
            {isEditMode ? `Editing Article #${id}` : 'Drafting New Knowledge Base Article'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 sm:p-12 mb-10">
          <div className="border-b border-slate-100 pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              {isEditMode ? 'Edit Article' : 'Create New Article'}
            </h1>
            <p className="text-slate-500 text-base mt-2">
              Write clear, well-structured clinical protocols, guidelines, or operational guides.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="text-base text-red-600 bg-red-50 border border-red-200 rounded-2xl p-5 font-medium">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-base font-bold text-slate-800 mb-2.5">
                Article Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Emergency Airway Management & Intubation Protocols"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-5 py-4 text-xl font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-xs"
              />
            </div>

            {/* Grid for Category & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-base font-bold text-slate-800 mb-2.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-5 py-3.5 text-base font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-xs"
                >
                  <option value="" disabled>
                    Select a category…
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-base font-bold text-slate-800 mb-2.5">
                  Publication Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={!isEditMode && user?.role === 'editor'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-5 py-3.5 text-base font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-xs disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="under_review">Under review</option>
                  <option value="draft" disabled={!isEditMode && user?.role === 'editor'}>
                    Draft
                  </option>
                  <option value="published" disabled={!canSetPublishedOrArchived}>
                    Published{!canSetPublishedOrArchived ? ' (admin only)' : ''}
                  </option>
                  <option value="archived" disabled={!canSetPublishedOrArchived}>
                    Archived{!canSetPublishedOrArchived ? ' (admin only)' : ''}
                  </option>
                </select>
                {!isEditMode && user?.role === 'editor' ? (
                  <p className="text-xs text-blue-600 font-medium mt-2">
                    New articles created by editors are automatically submitted for review.
                  </p>
                ) : !canSetPublishedOrArchived ? (
                  <p className="text-xs text-slate-400 font-medium mt-2">
                    Only administrators can directly publish or archive articles.
                  </p>
                ) : null}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-base font-bold text-slate-800 mb-2.5">
                Tags & Topics
              </label>
              <div className="flex flex-wrap gap-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {tags.length === 0 ? (
                  <span className="text-sm text-slate-400">No tags available.</span>
                ) : (
                  tags.map((tag) => {
                    const selected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`text-sm font-semibold rounded-xl px-4 py-2 border transition-all flex items-center gap-1.5 ${
                          selected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'
                        }`}
                      >
                        <span>{selected ? '✓' : '+'}</span>
                        {tag.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Rich Text Editor */}
            <div>
              <label className="block text-base font-bold text-slate-800 mb-2.5">
                Article Body <span className="text-red-500">*</span>
              </label>
              <RichTextEditor value={content} onChange={setContent} />
            </div>

            {/* Submit Bar */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
              <Link
                to={isEditMode ? `/articles/${id}` : '/articles'}
                className="px-6 py-3.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-base transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 inline-flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="animate-spin text-lg">⚙</span>
                    Saving article…
                  </>
                ) : isEditMode ? (
                  'Save Changes'
                ) : (
                  'Create Article'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}