import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold, Italic, UnderlineIcon, Link as LinkIcon, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Undo, Redo, Heading2, Heading3,
  Minus, Code,
} from 'lucide-react';

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const ToolBtn = ({
  active, onClick, title, children,
}: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
  <button type="button" title={title} onClick={onClick}
    className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors
      ${active ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
    {children}
  </button>
);

const editorCss = `
.rich-editor .tiptap { min-height:260px; padding:16px; outline:none; font-size:14px; line-height:1.7; color:#374151; }
.rich-editor .tiptap p { margin-bottom:10px; }
.rich-editor .tiptap h2 { font-size:1.25rem; font-weight:700; margin-bottom:8px; color:#111827; }
.rich-editor .tiptap h3 { font-size:1.05rem; font-weight:700; margin-bottom:6px; color:#111827; }
.rich-editor .tiptap strong { font-weight:700; }
.rich-editor .tiptap em { font-style:italic; }
.rich-editor .tiptap u { text-decoration:underline; }
.rich-editor .tiptap ul { list-style:disc; padding-left:20px; margin-bottom:10px; }
.rich-editor .tiptap ol { list-style:decimal; padding-left:20px; margin-bottom:10px; }
.rich-editor .tiptap li { margin-bottom:4px; }
.rich-editor .tiptap a { color:#66092d; text-decoration:underline; }
.rich-editor .tiptap hr { border:none; border-top:1px solid #e5e7eb; margin:16px 0; }
`;

const RichTextEditor: React.FC<Props> = ({ value, onChange }) => {
  const [htmlMode, setHtmlMode] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: 'tiptap' } },
  });

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('URL do link:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const toggleHtmlMode = () => {
    if (htmlMode) {
      // Volta para WYSIWYG: sincroniza o HTML editado no editor
      editor.commands.setContent(value, { emitUpdate: false });
    }
    setHtmlMode(v => !v);
  };

  return (
    <div className="rich-editor border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20">
      <style>{editorCss}</style>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-gray-50">
        {!htmlMode && (
          <>
            <ToolBtn title="Desfazer" onClick={() => editor.chain().focus().undo().run()}><Undo size={13} /></ToolBtn>
            <ToolBtn title="Refazer" onClick={() => editor.chain().focus().redo().run()}><Redo size={13} /></ToolBtn>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolBtn title="Título 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={13} /></ToolBtn>
            <ToolBtn title="Título 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={13} /></ToolBtn>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolBtn title="Negrito" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={13} /></ToolBtn>
            <ToolBtn title="Itálico" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={13} /></ToolBtn>
            <ToolBtn title="Sublinhado" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={13} /></ToolBtn>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolBtn title="Lista" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={13} /></ToolBtn>
            <ToolBtn title="Lista numerada" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={13} /></ToolBtn>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolBtn title="Esquerda" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft size={13} /></ToolBtn>
            <ToolBtn title="Centralizar" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter size={13} /></ToolBtn>
            <ToolBtn title="Direita" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight size={13} /></ToolBtn>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <ToolBtn title="Link" active={editor.isActive('link')} onClick={addLink}><LinkIcon size={13} /></ToolBtn>
            <ToolBtn title="Separador" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={13} /></ToolBtn>
            <div className="w-px h-5 bg-gray-200 mx-1" />
          </>
        )}
        <button type="button" onClick={toggleHtmlMode}
          className={`flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-bold transition-colors
            ${htmlMode ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100 border border-gray-200'}`}>
          <Code size={12} />
          {htmlMode ? '← Visual' : 'HTML'}
        </button>
      </div>

      {/* Área de edição */}
      {htmlMode ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={16}
          spellCheck={false}
          className="w-full px-4 py-3 text-xs font-mono bg-gray-950 text-green-400 focus:outline-none resize-none leading-relaxed"
          placeholder="Cole seu HTML de e-mail aqui..."
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
};

export default RichTextEditor;
