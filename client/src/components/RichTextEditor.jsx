import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';
import Icon from './icons';

function ToolbarButton({ onClick, active, disabled, children, label, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title || label}
      className={`p-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center ${
        disabled
          ? 'text-slate-300 cursor-not-allowed'
          : active
          ? 'bg-blue-100 text-blue-700 shadow-xs'
          : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-slate-300 mx-1 self-center" />;
}

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-blue-600 underline font-medium hover:text-blue-800',
        },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose-content min-h-[460px] px-8 py-6 focus:outline-none text-slate-800 text-lg leading-relaxed',
      },
    },
  });

  // Keep editor in sync if `value` changes externally (e.g. article loaded)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && value !== undefined) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  const text = editor ? editor.getText() : '';
  const stats = {
    chars: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
  };

  if (!editor) return null;

  function setLink() {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter link URL (e.g., https://example.com):', previousUrl || '');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50/90 px-3 py-2 flex-wrap sticky top-0 z-10 backdrop-blur-xs">
        {/* Undo / Redo */}
        <ToolbarButton
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Icon name="undo" className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Icon name="redo" className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Text Style */}
        <ToolbarButton
          label="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Icon name="bold" className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          label="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Icon name="italic" className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          label="Inline Code"
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Icon name="code" className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton
          label="Heading 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <span className="font-extrabold text-xs">H1</span>
        </ToolbarButton>

        <ToolbarButton
          label="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <span className="font-bold text-xs">H2</span>
        </ToolbarButton>

        <ToolbarButton
          label="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <span className="font-semibold text-xs">H3</span>
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <Icon name="listBullet" className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          label="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <Icon name="listOrdered" className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          label="Blockquote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Icon name="quote" className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        {/* Link & Horizontal Rule */}
        <ToolbarButton
          label="Insert Link"
          active={editor.isActive('link')}
          onClick={setLink}
        >
          <Icon name="link" className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          label="Horizontal Line"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Icon name="horizontalRule" className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor Content Area */}
      <div className="bg-white min-h-[460px]">
        <EditorContent editor={editor} />
      </div>

      {/* Footer Status Bar */}
      <div className="border-t border-slate-100 bg-slate-50/70 px-6 py-2.5 flex items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-4">
          <span>{stats.words} {stats.words === 1 ? 'word' : 'words'}</span>
          <span>•</span>
          <span>{stats.chars} {stats.chars === 1 ? 'character' : 'characters'}</span>
        </div>
        <div className="text-slate-400 hidden sm:block">
          Rich text & Markdown supported
        </div>
      </div>
    </div>
  );
}