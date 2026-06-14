'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, FileJson, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useOpenFormStorage } from '@/lib/storage';
import { DocumentInstance, DocumentType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { aiAssistDocumentTypeImport } from '@/ai/flows/ai-assist-document-type-import';
import { Suspense, useEffect } from 'react';

function ImportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tempId = searchParams.get('tempId');
  const { toast } = useToast();
  const { addDocument, upsertType, documentTypes } = useOpenFormStorage();
  const [importing, setImporting] = useState(false);
  const [importedDoc, setImportedDoc] = useState<DocumentInstance | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    if (tempId) {
      const fetchLocalDoc = async () => {
        setImporting(true);
        try {
          const res = await fetch(`/api/import-local?id=${tempId}`);
          const resData = await res.json();
          if (resData.success) {
            const json = resData.data as DocumentInstance;
            setImportedDoc(json);
            
            // Run AI analysis
            const summary = await aiAssistDocumentTypeImport({
              documentType: json.document_type,
              fields: json.fields,
              tables: json.tables
            });
            setAiSummary(summary.summary);
          } else {
            toast({ title: "Import Error", description: resData.error, variant: "destructive" });
          }
        } catch (err: any) {
          toast({ title: "Import Failed", description: err.message, variant: "destructive" });
        } finally {
          setImporting(false);
        }
      };
      fetchLocalDoc();
    }
  }, [tempId, toast]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as DocumentInstance;
        if (json.format !== 'OpenFormFile') {
          throw new Error('Invalid format. Must be an OpenForm Standard file.');
        }
        setImportedDoc(json);

        // Run AI analysis
        const summary = await aiAssistDocumentTypeImport({
          documentType: json.document_type,
          fields: json.fields,
          tables: json.tables
        });
        setAiSummary(summary.summary);
      } catch (err: any) {
        toast({ title: "Import Failed", description: err.message, variant: "destructive" });
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleFinalizeImport = () => {
    if (!importedDoc) return;

    // Check if type exists
    const typeExists = documentTypes.some(t => t.id === importedDoc.document_type.id);
    if (!typeExists) {
      // Create type from document metadata
      const newType: DocumentType = {
        id: importedDoc.document_type.id,
        label: importedDoc.document_type.label,
        allow_file: importedDoc.document_type.allow_file,
        fields: importedDoc.fields.map(f => ({ ...f, value: undefined })), // Strip values for type def
        tables: importedDoc.tables.map(t => ({ ...t, rows: [] })) // Strip rows for type def
      };
      upsertType(newType);
      toast({ title: "Blueprint Created", description: `Added new type "${newType.label}" to library.` });
    }

    addDocument(importedDoc);
    toast({ title: "Import Successful", description: "Document added to your vault." });
    router.push('/');
  };

  return (
    <AppShell>
      <div className="space-y-10">
        <div>
          <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">Standard Import</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Ingest semantic records using the universal .off standard.</p>
        </div>

        {!importedDoc ? (
          <Card className="max-w-xl mx-auto border-border/50 shadow-2xl overflow-hidden">
            <CardHeader className="p-12 text-center bg-muted/20 border-b border-border/50">
              <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-headline">Drop .off Record</CardTitle>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">Upload a JSON file following the OpenForm Standard to ingest it into your vault.</p>
            </CardHeader>
            <CardContent className="p-12">
              <Input 
                type="file" 
                accept=".json,.off" 
                onChange={handleFileUpload} 
                className="hidden" 
                id="import-upload"
                disabled={importing}
              />
              <label 
                htmlFor="import-upload" 
                className="flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-2xl p-12 hover:bg-muted/30 transition-all cursor-pointer group"
              >
                {importing ? (
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                ) : (
                  <>
                    <FileJson className="w-10 h-10 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-bold">Select File</span>
                  </>
                )}
              </label>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
             <Card className="border-border/50 shadow-xl overflow-hidden">
               <CardHeader className="bg-primary/10 border-b border-border/50 flex flex-row items-center gap-4 p-8">
                 <CheckCircle className="w-8 h-8 text-primary" />
                 <div>
                   <CardTitle className="text-xl font-headline">Document Verified</CardTitle>
                   <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">OpenForm STD v1.0 Compliant</p>
                 </div>
               </CardHeader>
               <CardContent className="p-8 space-y-8">
                 <div className="bg-muted/30 p-6 rounded-xl border border-border/50">
                    <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-3">AI SEMANTIC SUMMARY</h3>
                    <p className="text-sm leading-relaxed text-foreground italic">
                      "{aiSummary || 'Analyzing document content...'}"
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">TYPE</span>
                      <p className="text-lg font-headline font-bold">{importedDoc.document_type.label}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">DATE CREATED</span>
                      <p className="text-lg font-headline font-bold">{new Date(importedDoc.created_at).toLocaleDateString()}</p>
                    </div>
                 </div>

                 <div className="bg-accent/5 p-4 rounded-lg border border-accent/20 flex items-start gap-3">
                   <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                   <p className="text-xs text-accent-foreground font-medium leading-relaxed">
                     {documentTypes.some(t => t.id === importedDoc.document_type.id) 
                       ? "A matching blueprint already exists in your library. The document will use existing semantic labels."
                       : "A new semantic blueprint will be created in your library based on this document's technical mapping."}
                   </p>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={() => {setImportedDoc(null); setAiSummary(null);}} className="flex-1 h-12 border-border/50">
                      Discard
                    </Button>
                    <Button onClick={handleFinalizeImport} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                      Confirm & Ingest
                    </Button>
                 </div>
               </CardContent>
             </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>}>
      <ImportContent />
    </Suspense>
  );
}
