'use client';

import React from 'react';
import type { DocumentInstance } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Paperclip, MoreVertical, ExternalLink, Download, Edit } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function DocumentRow({ doc }: { doc: DocumentInstance }) {
  // Get top 3 fields marked for list display or just the first 3 active fields
  const displayFields = doc.fields
    .filter(f => f.enabled)
    .sort((a, b) => a.order - b.order)
    .filter(f => f.display_on_list)
    .slice(0, 3);

  const finalFields = displayFields.length > 0 
    ? displayFields 
    : doc.fields.filter(f => f.enabled).sort((a, b) => a.order - b.order).slice(0, 3);

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.document_type.label}_${doc.document_id.slice(0, 8)}.off`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-5 hover:border-primary/50 transition-all duration-300 group bg-card border-border/50 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg text-foreground flex items-center gap-2">
                {doc.document_type.label}
                {doc.attachment?.included && <Paperclip className="w-4 h-4 text-accent" />}
              </h3>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-tighter">ID: {doc.document_id.slice(0, 12)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {finalFields.map((field) => (
              <div key={field.key} className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">{field.label}</span>
                <p className="text-sm font-medium text-foreground truncate">
                  {field.type === 'bool' ? (field.value ? 'Yes' : 'No') : field.value || '—'}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-widest bg-muted/50 px-3 py-1 rounded-full border border-border/50">
            <Calendar className="w-3 h-3" />
            {format(new Date(doc.created_at), 'PPP')}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-8 gap-2 border-border/50 hover:bg-muted">
              <Link href={`/document/${doc.document_id}`}>
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="h-8 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              <Link href={`/document/${doc.document_id}/view`}>
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open View</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
