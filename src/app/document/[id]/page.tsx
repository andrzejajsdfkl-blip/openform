'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { DocumentForm } from '@/components/document/document-form';
import { useOpenFormStorage } from '@/lib/storage';
import { DocumentInstance } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function EditDocument() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { documents, documentTypes, updateDocument, isLoaded } = useOpenFormStorage();
  
  const id = params.id as string;
  const document = documents.find(d => d.document_id === id);
  const type = documentTypes.find(t => t.id === document?.document_type.id);

  if (!isLoaded) return null;
  if (!document || !type) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <p className="text-xl font-headline font-bold text-muted-foreground">Document not found.</p>
        </div>
      </AppShell>
    );
  }

  const handleSave = (updatedDoc: DocumentInstance) => {
    updateDocument(updatedDoc);
    toast({ title: "Document Updated", description: "Changes have been committed to the vault." });
    router.push('/');
  };

  return (
    <AppShell>
      <DocumentForm 
        type={type} 
        initialData={document}
        onSave={handleSave} 
        onCancel={() => router.push('/')} 
      />
    </AppShell>
  );
}
