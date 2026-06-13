'use client';

import React, { useState, useMemo } from 'react';
import type { DocumentType, FieldConfig, DocumentInstance, TableConfig } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, X, Paperclip, FileText, Trash2, Plus, Eye, Edit3, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentViewer } from './document-viewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DocumentFormProps {
  type: DocumentType;
  initialData?: DocumentInstance;
  onSave: (doc: DocumentInstance) => void;
  onCancel: () => void;
}

export function DocumentForm({ type, initialData, onSave, onCancel }: DocumentFormProps) {
  const { toast } = useToast();
  const [fields, setFields] = useState<FieldConfig[]>(() => {
    return type.fields.map(f => {
      const existing = initialData?.fields.find(ef => ef.key === f.key);
      return { ...f, value: existing?.value ?? f.default_value };
    });
  });

  const [tables, setTables] = useState<TableConfig[]>(() => {
    return (type.tables || []).map(t => {
      const existing = initialData?.tables.find(et => et.key === t.key);
      return { ...t, rows: existing?.rows ?? [] };
    });
  });

  const [attachment, setAttachment] = useState(initialData?.attachment || { included: false, file_name: '', mime_type: '', size: 0, base64: '' });

  const livePreviewDoc = useMemo((): DocumentInstance => ({
    format: "OpenFormFile",
    format_version: "1.0",
    document_id: initialData?.document_id || Math.random().toString(36).substring(7),
    created_at: initialData?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    document_type: {
      id: type.id,
      label: type.label,
      allow_file: type.allow_file
    },
    fields: fields,
    tables: tables,
    attachment: attachment.included ? attachment : undefined
  }), [fields, tables, attachment, type, initialData]);

  const handleFieldChange = (key: string, value: any) => {
    setFields(prev => prev.map(f => f.key === key ? { ...f, value } : f));
  };

  const handleAddTableRow = (tableKey: string) => {
    setTables(prev => prev.map(t => {
      if (t.key === tableKey) {
        const newRow: Record<string, any> = {};
        t.columns.forEach(col => {
          newRow[col.key] = col.default_value;
        });
        return { ...t, rows: [...(t.rows || []), newRow] };
      }
      return t;
    }));
  };

  const handleTableRowChange = (tableKey: string, rowIndex: number, colKey: string, value: any) => {
    setTables(prev => prev.map(t => {
      if (t.key === tableKey) {
        const newRows = [...(t.rows || [])];
        newRows[rowIndex] = { ...newRows[rowIndex], [colKey]: value };
        return { ...t, rows: newRows };
      }
      return t;
    }));
  };

  const handleRemoveTableRow = (tableKey: string, rowIndex: number) => {
    setTables(prev => prev.map(t => {
      if (t.key === tableKey) {
        return { ...t, rows: t.rows?.filter((_, i) => i !== rowIndex) };
      }
      return t;
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAttachment({
        included: true,
        file_name: file.name,
        mime_type: file.type,
        size: file.size,
        base64
      });
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    for (const field of fields.filter(f => f.enabled)) {
      if (field.required && (field.value === undefined || field.value === null || field.value === '')) {
        toast({ title: "Validation Error", description: `Field "${field.label}" is required.`, variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(livePreviewDoc);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border/50 shadow-xl sticky top-4 z-50 backdrop-blur-sm bg-card/90">
        <div>
          <h2 className="text-2xl font-headline font-bold text-foreground">{initialData ? 'Edit' : 'New'} {type.label}</h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">Architectural Session</p>
        </div>
        <div className="flex gap-3">
          {initialData?.document_id && (
            <Button 
              variant="outline" 
              onClick={() => window.open(`/document/${initialData.document_id}/view`, '_blank')}
              className="gap-2 border-accent/30 text-accent hover:bg-accent/10"
            >
              <ExternalLink className="w-4 h-4" /> Open Live
            </Button>
          )}
          <Button variant="outline" onClick={onCancel} className="gap-2 border-border/50">
            <X className="w-4 h-4" /> Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20">
            <Save className="w-4 h-4" /> Commit Record
          </Button>
        </div>
      </div>

      <Tabs defaultValue="editor" className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="bg-muted/50 p-1 border border-border/50 rounded-full h-12">
            <TabsTrigger value="editor" className="rounded-full px-8 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md">
              <Edit3 className="w-4 h-4" /> Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="rounded-full px-8 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md">
              <Eye className="w-4 h-4" /> Live Preview
            </TabsTrigger>
            <TabsTrigger value="split" className="hidden lg:flex rounded-full px-8 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-md">
              <div className="flex gap-0.5"><div className="w-1 h-3 bg-current opacity-50"/><div className="w-1 h-3 bg-current"/></div> Split View
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="editor" className="animate-in fade-in zoom-in-95 duration-300 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-border/50 shadow-lg">
                <CardHeader className="border-b border-border/50 bg-muted/20">
                  <CardTitle className="text-lg font-headline flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Form Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {fields
                      .filter(f => f.enabled)
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <div key={field.key} className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5">
                            {field.label}
                            {field.required && <span className="text-destructive">*</span>}
                          </Label>
                          {field.type === 'bool' ? (
                            <div className="flex items-center space-x-2 pt-2 bg-muted/20 p-3 rounded-lg border border-border/50">
                              <Checkbox 
                                id={field.key} 
                                checked={!!field.value} 
                                onCheckedChange={(val) => handleFieldChange(field.key, val)} 
                              />
                              <Label htmlFor={field.key} className="text-sm font-medium cursor-pointer">{field.placeholder || 'Active'}</Label>
                            </div>
                          ) : field.type === 'date' ? (
                            <Input 
                              type="date" 
                              value={field.value || ''} 
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              className="bg-muted/30 border-border/50 h-11"
                            />
                          ) : field.type === 'int' || field.type === 'decimal' ? (
                            <Input 
                              type="number" 
                              placeholder={field.placeholder}
                              value={field.value ?? ''} 
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              className="bg-muted/30 border-border/50 h-11"
                            />
                          ) : (
                            <Input 
                              placeholder={field.placeholder}
                              value={field.value || ''} 
                              onChange={(e) => handleFieldChange(field.key, e.target.value)}
                              className="bg-muted/30 border-border/50 h-11"
                            />
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {tables.filter(t => t.enabled).sort((a, b) => a.order - b.order).map((table) => (
                <Card key={table.key} className="border-border/50 shadow-lg overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/20">
                    <CardTitle className="text-lg font-headline">{table.label}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => handleAddTableRow(table.key)} className="text-primary hover:text-primary/80 font-bold">
                      <Plus className="w-4 h-4 mr-1" /> Add Row
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 border-b border-border/50">
                          {table.columns.filter(c => c.enabled).sort((a, b) => a.order - b.order).map(col => (
                            <TableHead key={col.key} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">
                              {col.label}
                            </TableHead>
                          ))}
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(table.rows || []).map((row, rowIndex) => (
                          <TableRow key={rowIndex} className="hover:bg-muted/10 border-b border-border/50">
                            {table.columns.filter(c => c.enabled).sort((a, b) => a.order - b.order).map(col => (
                              <TableCell key={col.key} className="p-2">
                                <Input 
                                  value={row[col.key] ?? ''}
                                  onChange={(e) => handleTableRowChange(table.key, rowIndex, col.key, e.target.value)}
                                  className="h-9 text-sm bg-transparent border-transparent hover:border-border/50 focus:bg-muted/30"
                                />
                              </TableCell>
                            ))}
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveTableRow(table.key, rowIndex)} className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-6">
              {type.allow_file && (
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="border-b border-border/50 bg-muted/20">
                    <CardTitle className="text-lg font-headline flex items-center gap-2">
                      <Paperclip className="w-5 h-5 text-accent" />
                      Attachment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {attachment.included ? (
                        <div className="bg-muted/30 p-4 rounded-lg border border-border/50 flex items-start gap-4">
                          <FileText className="w-6 h-6 text-accent" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{attachment.file_name}</p>
                            <p className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => setAttachment({ included: false, file_name: '', mime_type: '', size: 0, base64: '' })} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer relative group">
                          <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                          <div className="space-y-2 pointer-events-none">
                            <Plus className="w-8 h-8 mx-auto text-muted-foreground group-hover:text-primary" />
                            <p className="text-sm font-bold">Add Attachment</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="animate-in fade-in duration-300">
          <DocumentViewer doc={livePreviewDoc} />
        </TabsContent>

        <TabsContent value="split" className="animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-250px)]">
            <Card className="overflow-auto border-border/50 p-6 bg-card">
              <h3 className="text-xs font-black uppercase text-primary mb-6">Quick Editor</h3>
              <div className="space-y-6">
                 {fields.filter(f => f.enabled).map(field => (
                    <div key={field.key} className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase">{field.label}</Label>
                      <Input 
                        value={field.value || ''} 
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="bg-muted/20 border-border/30 h-8 text-sm"
                      />
                    </div>
                 ))}
              </div>
            </Card>
            <div className="overflow-auto border border-border/50 rounded-xl bg-muted/5">
              <DocumentViewer doc={livePreviewDoc} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
