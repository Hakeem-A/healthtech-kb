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
        <div className="p-10 text-lg text-slate-500">Loading…</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-8 py-10">
        <Link
          to={isEditMode ? `/articles/${id}` : '/articles'}
          className="text-base text-blue-600 font-medium mb-6 inline-block hover:text-blue-800"
        >
          ← Cancel
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          {isEditMode ? 'Edit Article' : 'New Article'}
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl shadow-sm p-8"
        >
          {error && (
            <div className="mb-5 text-base text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
              {error}
            </div>
          )}

          {/* Title */}
          <label className="block text-base font-medium text-slate-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Category */}
          <label className="block text-base font-medium text-slate-700 mb-2">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Tags */}
          <fieldset className="mb-5">
            <legend className="block text-base font-medium text-slate-700 mb-2">
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
                    className={`text-sm rounded-full px-3 py-1.5 border transition ${
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

          {/* ✅ Rich Text Editor */}
          <label className="block text-base font-medium text-slate-700 mb-2">
            Content
          </label>
          <div className="mb-5">
            <RichTextEditor value={content} onChange={setContent} />
          </div>

          {/* Status */}
          <label className="block text-base font-medium text-slate-700 mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <p className="text-sm text-slate-400 mb-5">
              Only admins can publish or archive articles.
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white text-lg font-medium rounded-lg py-3.5 hover:bg-blue-700 transition disabled:opacity-50 mt-4"
          >
            {saving ? 'Saving…' : isEditMode ? 'Save changes' : 'Create article'}
          </button>
        </form>
      </div>
    </Layout>
  );
}