'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { DocumentViewer } from '@/components/document/document-viewer';
import { useOpenFormStorage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ViewDocument() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { documents, deleteDocument, isLoaded } = useOpenFormStorage();
  
  const id = params.id as string;
  const document = documents.find(d => d.document_id === id);

  if (!isLoaded) return null;
  if (!document) {
    return (
      <AppShell>
        <div className="text-center py-20 bg-muted/10 border-2 border-dashed border-border/30 rounded-3xl">
          <p className="text-xl font-headline font-bold text-muted-foreground">Document not found in the vault.</p>
          <Button variant="link" onClick={() => router.push('/')} className="mt-4">Back to Dashboard</Button>
        </div>
      </AppShell>
    );
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to purge this record from the vault?")) {
      deleteDocument(id);
      toast({ title: "Record Purged", description: "The document has been removed from local storage." });
      router.push('/');
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.document_type.label}_${id.slice(0, 8)}.off`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export Initiated", description: "Standard OpenForm (.off) record downloaded." });
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <Button variant="ghost" onClick={() => router.push('/')} className="gap-2 hover:bg-muted -ml-4">
            <ChevronLeft className="w-4 h-4" /> Back to Records
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleExport} className="gap-2 border-border/50">
              <Download className="w-4 h-4" /> Export (.off)
            </Button>
            <Button variant="outline" onClick={() => router.push(`/document/${id}`)} className="gap-2 border-border/50">
              <Edit className="w-4 h-4" /> Edit Record
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="gap-2">
              <Trash2 className="w-4 h-4" /> Purge
            </Button>
          </div>
        </div>

        <DocumentViewer doc={document} />
      </div>
    </AppShell>
  );
}
