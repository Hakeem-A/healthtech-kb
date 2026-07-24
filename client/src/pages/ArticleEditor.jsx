import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getArticle,
  createArticle,
  updateArticle,
  listCategories,
  listTags,
} from '../api/articles';
import { useAuth } from '../context/AuthContext';

export default function ArticleEditor() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('draft');
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
      content,
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
    return <div className="p-8 text-slate-500">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <Link
          to={isEditMode ? `/articles/${id}` : '/articles'}
          className="text-sm text-blue-600"
        >
          ← Cancel
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-slate-800 mb-6">
          {isEditMode ? 'Edit Article' : 'New Article'}
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-lg p-6"
        >
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-slate-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="w-full border border-slate-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          <fieldset className="mb-4">
  <legend className="block text-sm font-medium text-slate-700 mb-1">
    Tags
  </legend>
  <div className="flex flex-wrap gap-2">
    {tags.map((tag) => {
      const selected = selectedTagIds.includes(tag.id);
      return (
        <button
          key={tag.id}
          type="button"
          onClick={() => toggleTag(tag.id)}
          className={`text-xs rounded px-2 py-1 border transition ${
            selected
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-300 hover:border-blue-300'
          }`}
        >
          {tag.name}
        </button>
      );
    })}
  </div>
</fieldset>

          <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={12}
            className="w-full border border-slate-300 rounded px-3 py-2 mb-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="under_review">Under review</option>
            <option value="published" disabled={!canSetPublishedOrArchived}>
              Published{!canSetPublishedOrArchived ? ' (admin only)' : ''}
            </option>
            <option value="archived" disabled={!canSetPublishedOrArchived}>
              Archived{!canSetPublishedOrArchived ? ' (admin only)' : ''}
            </option>
          </select>
          {!canSetPublishedOrArchived && (
            <p className="text-xs text-slate-400 mb-4">
              Only admins can publish or archive articles.
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50 mt-4"
          >
            {saving ? 'Saving…' : isEditMode ? 'Save changes' : 'Create article'}
          </button>
        </form>
      </main>
    </div>
  );
}