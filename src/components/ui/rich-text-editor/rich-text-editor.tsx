'use client';

import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40',
        active && 'bg-primary/12 text-primary',
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div
      role="toolbar"
      aria-label="Mise en forme"
      className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5"
    >
      <ToolbarButton
        label="Gras"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italique"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <ToolbarButton
        label="Titre de section"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Sous-titre"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <ToolbarButton
        label="Liste à puces"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Liste numérotée"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Citation"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <ToolbarButton
        label="Annuler"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Rétablir"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="size-4" />
      </ToolbarButton>
    </div>
  );
}

interface RichTextEditorProps {
  /** HTML initial (ou texte brut pour un ancien article). */
  value: string;
  /** Reçoit le HTML de l'éditeur à chaque frappe. */
  onChange: (html: string) => void;
  className?: string;
}

/**
 * Éditeur riche « ce que vous voyez est ce que vous publiez » (TipTap),
 * wrappé selon la règle projet (jamais de lib tierce nue dans une feature).
 * Le HTML produit est RE-sanitizé côté serveur (nh3) avant persistance.
 */
export function RichTextEditor({
  value,
  onChange,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    // Next.js SSR : évite le rendu immédiat côté serveur (hydration mismatch).
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[280px] px-3 py-2 focus:outline-none prose-headings:font-serif',
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  if (!editor) {
    return (
      <div
        className={cn(
          'min-h-[320px] rounded-md border border-input bg-background shadow-sm',
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring',
        className,
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
