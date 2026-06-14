
'use client';

import React from 'react';
import type { DocumentInstance } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Paperclip, Hash, Building2, Globe, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export function DocumentViewer({ doc }: { doc: DocumentInstance }) {
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.document_type.label}_${doc.document_id.slice(0, 8)}.off`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const activeFields = doc.fields.filter(f => f.enabled);
  const activeTables = doc.tables.filter(t => t.enabled);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-border/50 shadow-2xl bg-card overflow-hidden">
        <div className="bg-primary/5 p-12 border-b border-border/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Building2 className="w-32 h-32 text-primary" />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
            <div className="space-y-4">
              <Badge className="bg-primary text-primary-foreground font-black px-3 py-1 text-[10px] tracking-widest uppercase">
                {doc.document_type.label}
              </Badge>
              <h1 className="text-5xl font-headline font-bold text-foreground tracking-tight">
                Record Summary
              </h1>
              <div className="flex items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">{format(new Date(doc.created_at), 'PPP')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  <span className="text-sm font-mono uppercase tracking-tighter">{doc.document_id.slice(0, 12)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center self-stretch md:self-auto">
              <Button onClick={downloadJson} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 h-11">
                <Download className="w-4 h-4" /> Export File (.off)
              </Button>

              {doc.attachment?.included && (
                <div className="bg-accent/10 p-4 rounded-2xl border border-accent/20 flex items-center gap-4">
                  <div className="bg-accent/20 p-3 rounded-xl">
                    <Paperclip className="w-6 h-6 text-accent" />
                  </div>
                  <div className="pr-4">
                    <p className="text-xs font-bold text-accent uppercase tracking-widest">Załącznik</p>
                    <p className="text-sm font-bold truncate max-w-[150px]">{doc.attachment.file_name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-12 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
            {activeFields.sort((a, b) => a.order - b.order).map((field) => (
              <div key={field.key} className="space-y-1 group">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest group-hover:text-primary transition-colors">
                    {field.label}
                  </span>
                  {field.required && <div className="w-1 h-1 rounded-full bg-destructive" />}
                </div>
                <p className="text-lg font-headline font-bold text-foreground border-b border-border/20 pb-2 group-hover:border-primary/30 transition-all">
                  {field.type === 'bool' ? (field.value ? 'TAK' : 'NIE') : (field.value as any) || '—'}
                </p>
                {field.description && <p className="text-[10px] text-muted-foreground italic mt-1">{field.description}</p>}
              </div>
            ))}
          </div>

          {activeTables.map((table) => (
            <div key={table.key} className="space-y-6 pt-6">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-headline font-bold text-foreground shrink-0">{table.label}</h3>
                <Separator className="flex-1 opacity-20" />
              </div>
              
              <div className="border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                      {table.columns.filter(c => c.enabled).sort((a, b) => a.order - b.order).map(col => (
                        <TableHead key={col.key} className="h-14 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.rows && table.rows.length > 0 ? (
                      table.rows.map((row, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/10 border-b border-border/50 last:border-0">
                          {table.columns.filter(c => c.enabled).sort((a, b) => a.order - b.order).map(col => (
                            <TableCell key={col.key} className="px-6 py-5 font-medium text-sm">
                              {col.type === 'bool' ? (row[col.key] ? 'Tak' : 'Nie') : (row[col.key] as any) || '—'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={table.columns.length} className="h-24 text-center text-muted-foreground italic">
                          Brak danych w tej tabeli.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
          {doc.attachment?.included && (
            <div className="space-y-6 pt-6 border-t border-border/20">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-headline font-bold text-foreground shrink-0 flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-accent" /> Załącznik: {doc.attachment.file_name}
                </h3>
                <Separator className="flex-1 opacity-20" />
              </div>
              
              <div className="border border-border/50 rounded-2xl overflow-hidden bg-muted/10 p-4 flex justify-center items-center min-h-[300px]">
                {doc.attachment.mime_type.startsWith('image/') ? (
                  <img 
                    src={`data:${doc.attachment.mime_type};base64,${doc.attachment.base64}`} 
                    alt={doc.attachment.file_name} 
                    className="max-w-full max-h-[500px] object-contain rounded-lg shadow-md"
                  />
                ) : doc.attachment.mime_type === 'application/pdf' ? (
                  <iframe 
                    src={`data:${doc.attachment.mime_type};base64,${doc.attachment.base64}`} 
                    title={doc.attachment.file_name} 
                    className="w-full h-[600px] rounded-lg border border-border/50 shadow-md"
                  />
                ) : (
                  <div className="text-center p-8 space-y-4">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto" />
                    <p className="text-sm font-bold text-foreground">{doc.attachment.file_name}</p>
                    <p className="text-xs text-muted-foreground">Type: {doc.attachment.mime_type} | Size: {(doc.attachment.size / 1024).toFixed(1)} KB</p>
                    <Button asChild variant="outline" className="h-9">
                      <a href={`data:${doc.attachment.mime_type};base64,${doc.attachment.base64}`} download={doc.attachment.file_name}>
                        Pobierz załącznik
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-12 flex justify-between items-center text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] border-t border-border/30">
            <span>OpenForm Standard v1.0 Compliant</span>
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3" />
              <span>Architectural Data Engine</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
