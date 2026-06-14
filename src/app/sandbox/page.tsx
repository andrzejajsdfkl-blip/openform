'use client';

import React, { useState, useMemo, useRef } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocumentForm } from '@/components/document/document-form';
import { useOpenFormStorage } from '@/lib/storage';
import { DocumentInstance, DocumentType, TableConfig } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileText, Download, Play, RefreshCw, Info, AlertTriangle } from 'lucide-react';

export default function LocalSandbox() {
  const { documentTypes } = useOpenFormStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadedDoc, setLoadedDoc] = useState<DocumentInstance | null>(null);
  const [docType, setDocType] = useState<DocumentType | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  // Process the uploaded JSON text
  const processFileContent = (content: string, name: string) => {
    try {
      const parsed = JSON.parse(content) as DocumentInstance;
      if (parsed.format !== 'OpenFormFile') {
        throw new Error('Missing "OpenFormFile" standard format declaration.');
      }

      setFileName(name);
      setLoadedDoc(parsed);

      // Check if a corresponding blueprint exists in our vault
      const matchingType = documentTypes.find(t => t.id === parsed.document_type.id);
      if (matchingType) {
        setDocType(matchingType);
        toast({
          title: "Blueprint Found",
          description: `Loaded file using existing blueprint: "${matchingType.label}"`,
        });
      } else {
        // Build a mock blueprint from the document itself
        const mockType: DocumentType = {
          id: parsed.document_type.id,
          label: parsed.document_type.label,
          allow_file: parsed.attachment?.included || parsed.document_type.allow_file || false,
          fields: parsed.fields.map(f => ({
            key: f.key,
            label: f.label,
            type: f.type,
            required: f.required ?? false,
            enabled: f.enabled ?? true,
            order: f.order ?? 0,
            display_on_list: f.display_on_list ?? true,
          })),
          tables: parsed.tables?.map((t: any) => ({
            key: t.key,
            label: t.label,
            columns: t.columns || [],
          })) || [],
        };
        setDocType(mockType);
        toast({
          title: "Dynamic Schema Generated",
          description: `No existing blueprint matching "${parsed.document_type.label}". Generated dynamic controls.`,
          variant: "default",
        });
      }
    } catch (err: any) {
      toast({
        title: "Invalid File",
        description: err.message || "Failed to parse .off document.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        processFileContent(event.target.result as string, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          processFileContent(event.target.result as string, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSave = (updatedDoc: DocumentInstance) => {
    // Initiate direct download without saving to vault storage
    const blob = new Blob([JSON.stringify(updatedDoc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `${updatedDoc.document_type.label}_edited.off`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "File Exported",
      description: "Your offline changes have been saved and downloaded to your computer.",
    });
  };

  const handleReset = () => {
    setLoadedDoc(null);
    setDocType(null);
    setFileName('');
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Local Sandbox Editor
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Open, inspect, edit, and download offline .off documents directly from your filesystem.
          </p>
        </div>

        {!loadedDoc || !docType ? (
          <div
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-16 transition-all duration-300 min-h-[400px] bg-card/20 backdrop-blur-sm relative overflow-hidden ${
              dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/50 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".off,.json"
              className="hidden"
            />
            
            <div className="bg-primary/10 p-5 rounded-2xl border border-primary/20 mb-6 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-10 h-10 text-primary" />
            </div>

            <h3 className="text-2xl font-bold text-foreground mb-2">Open an Offline Document</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-8 text-sm">
              Drag and drop your <code className="bg-background/80 px-1.5 py-0.5 rounded border border-border/50 font-mono">.off</code> file here, or click the button below to browse.
            </p>

            <div className="flex gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 h-12 rounded-xl shadow-lg shadow-primary/25"
              >
                Browse File
              </Button>
            </div>

            <div className="mt-12 flex items-center gap-2 max-w-md bg-muted/40 border border-border/40 p-4 rounded-2xl text-xs text-muted-foreground leading-relaxed">
              <Info className="w-5 h-5 text-accent shrink-0" />
              <p>
                <strong>Private & Local:</strong> Files opened in Sandbox are processed entirely inside your browser. No data is sent to any server.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-card/40 border border-border/40 p-4 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{fileName}</h4>
                  <p className="text-xs text-muted-foreground">
                    Format: {loadedDoc.format} v{loadedDoc.format_version} • Type: {loadedDoc.document_type.label}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="gap-2 border-border/40 rounded-xl hover:bg-white/5"
                >
                  <RefreshCw className="w-4 h-4" /> Open Different File
                </Button>
              </div>
            </div>

            {!documentTypes.some(t => t.id === loadedDoc.document_type.id) && (
              <div className="flex gap-3 bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-2xl text-yellow-500 text-xs">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <h5 className="font-bold mb-0.5">Unrecognized Blueprint Schema</h5>
                  <p className="leading-relaxed">
                    This file uses a blueprint not defined in your library. We've synthesized a temporary schema using the file's own fields metadata, allowing you to edit it on screen.
                  </p>
                </div>
              </div>
            )}

            <DocumentForm
              type={docType}
              initialData={loadedDoc}
              onSave={handleSave}
              onCancel={handleReset}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
