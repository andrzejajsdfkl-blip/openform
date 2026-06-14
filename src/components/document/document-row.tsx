'use client';

import React, { useState } from 'react';
import type { DocumentInstance } from '@/lib/types';
import { Card } from '@/components/ui/card';
import {
  Calendar,
  FileText,
  Paperclip,
  ExternalLink,
  Download,
  Edit,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useOpenFormStorage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

// ─── Color palette cycling ────────────────────────────────────────────────────
// Six distinct accent palettes: [badge classes, border color, glow class]
const TYPE_COLORS = [
  {
    badge:  'bg-blue-500/15 text-blue-400 border-blue-500/30',
    border: 'bg-blue-500/70',
    glow:   'hover:shadow-blue-500/10',
  },
  {
    badge:  'bg-violet-500/15 text-violet-400 border-violet-500/30',
    border: 'bg-violet-500/70',
    glow:   'hover:shadow-violet-500/10',
  },
  {
    badge:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    border: 'bg-emerald-500/70',
    glow:   'hover:shadow-emerald-500/10',
  },
  {
    badge:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    border: 'bg-yellow-500/70',
    glow:   'hover:shadow-yellow-500/10',
  },
  {
    badge:  'bg-pink-500/15 text-pink-400 border-pink-500/30',
    border: 'bg-pink-500/70',
    glow:   'hover:shadow-pink-500/10',
  },
  {
    badge:  'bg-orange-500/15 text-orange-400 border-orange-500/30',
    border: 'bg-orange-500/70',
    glow:   'hover:shadow-orange-500/10',
  },
] as const;

/** djb2-style hash → stable color index for a given type id */
function hashTypeId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % TYPE_COLORS.length;
}
// ─────────────────────────────────────────────────────────────────────────────

export function DocumentRow({ doc }: { doc: DocumentInstance }) {
  const { deleteDocument } = useOpenFormStorage();
  const { toast } = useToast();
  const [idCopied, setIdCopied] = useState(false);

  // Resolve accent palette
  const colorIdx = hashTypeId(doc.document_type.id ?? doc.document_type.label);
  const color = TYPE_COLORS[colorIdx];

  // ── Field resolution ───────────────────────────────────────────────────────
  const displayFields = doc.fields
    .filter((f) => f.enabled)
    .sort((a, b) => a.order - b.order)
    .filter((f) => f.display_on_list)
    .slice(0, 3);

  const finalFields =
    displayFields.length > 0
      ? displayFields
      : doc.fields.filter((f) => f.enabled).sort((a, b) => a.order - b.order).slice(0, 3);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.document_type.label}_${doc.document_id.slice(0, 8)}.off`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Delete document "${doc.document_type.label}" (${doc.document_id.slice(0, 8)}…)?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;
    deleteDocument(doc.document_id);
    toast({
      title: 'Document deleted',
      description: `"${doc.document_type.label}" was removed successfully.`,
    });
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(doc.document_id);
      setIdCopied(true);
      toast({ title: 'ID copied', description: doc.document_id });
      setTimeout(() => setIdCopied(false), 2000);
    } catch {
      toast({ title: 'Copy failed', description: 'Could not copy to clipboard.' });
    }
  };

  // ── Attachment preview ─────────────────────────────────────────────────────
  const renderAttachmentPreview = () => {
    if (!doc.attachment?.included) return null;

    const { mime_type, base64, file_name } = doc.attachment;

    let previewContent: React.ReactNode;

    if (mime_type.startsWith('image/')) {
      previewContent = (
        <img
          src={`data:${mime_type};base64,${base64}`}
          alt={file_name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      );
    } else if (mime_type === 'application/pdf') {
      previewContent = (
        <div className="w-full h-full flex flex-col items-center justify-center bg-red-950/40 p-2">
          <FileText className="w-8 h-8 text-red-400" />
          <p className="text-xs text-red-400 mt-1.5 font-bold tracking-widest uppercase">PDF</p>
        </div>
      );
    } else {
      previewContent = (
        <div className="w-full h-full flex flex-col items-center justify-center bg-muted/40 p-2">
          <FileText className="w-8 h-8 text-muted-foreground" />
          <p className="text-xs text-muted-foreground mt-1.5 text-center truncate max-w-full px-1">
            {file_name}
          </p>
        </div>
      );
    }

    return (
      <div className="w-full md:w-32 h-24 relative rounded-xl overflow-hidden border border-border/40 flex-shrink-0 shadow-inner">
        {previewContent}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5">
          <p className="text-[10px] text-white/90 font-medium truncate leading-tight">{file_name}</p>
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Card
      className={[
        'relative p-0 overflow-hidden rounded-xl',
        // Glassmorphism
        'bg-card/50 backdrop-blur-xl',
        'border border-border/40 shadow-lg',
        // Hover lift + glow
        'transition-all duration-300 ease-out',
        'hover:-translate-y-0.5 hover:shadow-xl',
        color.glow,
        'group',
      ].join(' ')}
    >
      {/* Left border accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${color.border}`} />

      <div className="pl-4 pr-5 py-5">
        <div className="flex flex-col md:flex-row justify-between gap-6">

          {/* ── Left content ── */}
          <div className="flex-1 space-y-3 min-w-0">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors flex-shrink-0 mt-0.5">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                {/* Color-coded type badge */}
                <div className="mb-1.5">
                  <span
                    className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${color.badge}`}
                  >
                    {doc.document_type.label}
                  </span>
                </div>

                <h3 className="font-headline font-bold text-lg text-foreground flex items-center gap-2 leading-tight">
                  {doc.document_type.label}
                  {doc.attachment?.included && (
                    <Paperclip className="w-4 h-4 text-accent flex-shrink-0" />
                  )}
                </h3>

                {/* Copyable document ID */}
                <button
                  onClick={handleCopyId}
                  title="Click to copy full ID"
                  className="flex items-center gap-1.5 mt-0.5 group/id cursor-pointer"
                >
                  <span className="text-xs text-muted-foreground font-mono uppercase tracking-tighter group-hover/id:text-foreground transition-colors">
                    ID: {doc.document_id.slice(0, 12)}…
                  </span>
                  {idCopied ? (
                    <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Copy className="w-3 h-3 text-muted-foreground/50 group-hover/id:text-muted-foreground transition-colors flex-shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {/* Fields + attachment preview */}
            <div className="flex items-start gap-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 min-w-0">
                {finalFields.map((field) => (
                  <div key={field.key} className="space-y-0.5 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">
                      {field.label}
                    </span>
                    <p className="text-sm font-medium text-foreground truncate">
                      {field.type === 'bool'
                        ? field.value ? 'Yes' : 'No'
                        : (field.value as any) || '—'}
                    </p>
                  </div>
                ))}
              </div>
              {renderAttachmentPreview()}
            </div>
          </div>

          {/* ── Right content ── */}
          <div className="flex flex-col items-end justify-between gap-4 flex-shrink-0">
            {/* Date */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-widest bg-muted/40 px-3 py-1 rounded-full border border-border/40 whitespace-nowrap">
              <Calendar className="w-3 h-3" />
              {format(new Date(doc.created_at), 'PPP')}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Delete */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/30 transition-all"
                title="Delete document"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </Button>

              {/* Edit */}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 gap-1.5 border border-border/40 hover:bg-muted hover:border-border/60 transition-all"
              >
                <Link href={`/document/${doc.document_id}`}>
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Link>
              </Button>

              {/* Download */}
              <Button
                variant="outline"
                size="sm"
                onClick={downloadJson}
                className="h-8 gap-1.5 border-border/40 hover:bg-muted text-foreground transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </Button>

              {/* Open view */}
              <Button
                asChild
                size="sm"
                className="h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all"
              >
                <Link href={`/document/${doc.document_id}/view`}>
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open View</span>
                </Link>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </Card>
  );
}
