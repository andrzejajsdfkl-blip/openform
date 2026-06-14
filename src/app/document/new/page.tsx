'use client';

import React, { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { DocumentForm } from '@/components/document/document-form';
import { useOpenFormStorage } from '@/lib/storage';
import { DocumentInstance } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

function NewDocumentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { documentTypes, addDocument, isLoaded } = useOpenFormStorage();
  
  const typeId = searchParams.get('typeId');
  const type = useMemo(() => documentTypes.find(t => t.id === typeId), [documentTypes, typeId]);

  if (!isLoaded) {
    return (
      <AppShell>
        <div className="w-full h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Loading blueprint...</p>
        </div>
      </AppShell>
    );
  }
  
  if (!type) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <p className="text-xl font-headline font-bold text-muted-foreground">Document type not found.</p>
        </div>
      </AppShell>
    );
  }

  const handleSave = (doc: DocumentInstance) => {
    addDocument(doc);
    toast({ title: "Document Saved", description: `${type.label} has been added to the vault.` });
    router.push('/');
  };

  return (
    <AppShell>
      <DocumentForm 
        type={type} 
        onSave={handleSave} 
        onCancel={() => router.push('/')} 
      />
    </AppShell>
  );
}

export default function NewDocument() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="w-full h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Loading component...</p>
        </div>
      </AppShell>
    }>
      <NewDocumentContent />
    </Suspense>
  );
}
