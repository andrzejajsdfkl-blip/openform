'use client';

import React, { useState, useMemo } from 'react';
import type { DocumentType, FieldConfig, DocumentInstance, TableConfig } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, X, Paperclip, FileText, Trash2, Plus, Eye, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentViewer } from '../document/document-viewer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
          newRow[col.key] = col.default_value !== undefined && col.default_value !== null 
            ? col.default_value 
            : (col.type === 'bool' ? false : '');
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

    const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });

    const base64 = await toBase64(file);

    setAttachment({
        included: true,
        file_name: file.name,
        mime_type: file.type,
        size: file.size,
        base64
    });
  };

  const validate = () => {
    for (const field of fields.filter(f => f.enabled)) {
      const val = field.value;
      const isValEmpty = val === undefined || val === null || val === '';

      // Required fields check
      if (field.required && isValEmpty) {
        toast({ title: "Validation Error", description: `Field "${field.label}" is required.`, variant: "destructive" });
        return false;
      }

      if (!isValEmpty) {
        // Date validation
        if (field.type === 'date') {
          const parsedDate = Date.parse(val as string);
          if (isNaN(parsedDate)) {
            toast({ title: "Validation Error", description: `Field "${field.label}" must be a valid date.`, variant: "destructive" });
            return false;
          }
        }

        // Integer validation
        if (field.type === 'int') {
          if (!/^-?\d+$/.test(String(val).trim())) {
            toast({ title: "Validation Error", description: `Field "${field.label}" must be a whole number (integer).`, variant: "destructive" });
            return false;
          }
        }

        // Decimal validation
        if (field.type === 'decimal') {
          if (!/^-?\d+(\.\d+)?$/.test(String(val).trim())) {
            toast({ title: "Validation Error", description: `Field "${field.label}" must be a decimal number.`, variant: "destructive" });
            return false;
          }
        }
      }
    }

    for (const table of tables.filter(t => t.enabled)) {
      const activeCols = table.columns.filter(c => c.enabled);
      const rows = table.rows || [];
      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];
        for (const col of activeCols) {
          const cellVal = row[col.key];
          const isCellEmpty = cellVal === undefined || cellVal === null || cellVal === '';
          if (col.required && isCellEmpty) {
            toast({ title: "Validation Error", description: `Table "${table.label}", Row ${rIdx + 1}: Column "${col.label}" is required.`, variant: "destructive" });
            return false;
          }
          if (!isCellEmpty) {
            if (col.type === 'date') {
              if (isNaN(Date.parse(cellVal as string))) {
                toast({ title: "Validation Error", description: `Table "${table.label}", Row ${rIdx + 1}: Column "${col.label}" must be a valid date.`, variant: "destructive" });
                return false;
              }
            }
            if (col.type === 'int') {
              if (!/^-?\d+$/.test(String(cellVal).trim())) {
                toast({ title: "Validation Error", description: `Table "${table.label}", Row ${rIdx + 1}: Column "${col.label}" must be an integer.`, variant: "destructive" });
                return false;
              }
            }
            if (col.type === 'decimal') {
              if (!/^-?\d+(\.\d+)?$/.test(String(cellVal).trim())) {
                toast({ title: "Validation Error", description: `Table "${table.label}", Row ${rIdx + 1}: Column "${col.label}" must be a decimal number.`, variant: "destructive" });
                return false;
              }
            }
          }
        }
      }
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(livePreviewDoc);
  };

  return (
    <div className="space-y-8 pb-24 relative">
      <div className="flex justify-between items-center bg-card/80 backdrop-blur-2xl p-6 rounded-3xl border border-border/40 shadow-2xl sticky top-6 z-50 transition-all hover:shadow-primary/5 hover:border-primary/30">
        <div>
          <h2 className="text-3xl font-headline font-bold text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">{initialData ? 'Edit' : 'New'} {type.label}</h2>
          <p className="text-xs text-primary/80 uppercase tracking-[0.2em] font-black mt-1">OpenForm Studio Session</p>
        </div>
        <div className="flex gap-4">
          {initialData?.document_id && (
            <Button 
              variant="outline" 
              onClick={() => window.open(`/document/${initialData.document_id}/view`, '_blank')}
              className="gap-2 border-accent/40 bg-accent/5 text-accent hover:bg-accent/15 hover:border-accent/60 transition-all rounded-xl h-12 px-6"
            >
              <ExternalLink className="w-4 h-4" /> <span className="font-bold">Open Reader</span>
            </Button>
          )}
          <Button variant="outline" onClick={onCancel} className="gap-2 border-border/40 bg-card/50 hover:bg-background/80 hover:text-destructive hover:border-destructive/40 transition-all rounded-xl h-12 px-6">
            <X className="w-4 h-4" /> <span className="font-bold">Cancel</span>
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-[1.02] rounded-xl h-12 px-8">
            <Save className="w-5 h-5" /> Commit Record
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start relative">
        {/* Left Column: Form Editor */}
        <div className="xl:col-span-7 space-y-8">
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden relative group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
            <CardHeader className="border-b border-border/20 bg-background/30 p-8">
              <CardTitle className="text-2xl font-headline flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                Semantic Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                {fields
                  .filter(f => f.enabled)
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <div key={field.key} className="space-y-3 group/field">
                      <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 flex items-center gap-1.5 transition-colors group-focus-within/field:text-primary">
                        {field.label}
                        {field.required && <span className="text-destructive">*</span>}
                      </Label>
                      {field.type === 'bool' ? (
                        <div className="flex items-center space-x-3 bg-background/50 hover:bg-background/80 transition-colors p-4 rounded-2xl border border-border/40 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 shadow-inner">
                          <Checkbox 
                            id={field.key} 
                            checked={!!field.value} 
                            onCheckedChange={(val) => handleFieldChange(field.key, val)} 
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <Label htmlFor={field.key} className="text-base font-medium cursor-pointer">{field.placeholder || 'Active'}</Label>
                        </div>
                      ) : field.type === 'date' ? (
                        <Input 
                          type="date" 
                          value={(field.value as string) || ''} 
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="bg-background/50 border-border/40 h-14 rounded-2xl px-4 text-base focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary shadow-inner transition-all hover:bg-background/80"
                        />
                      ) : field.type === 'int' || field.type === 'decimal' ? (
                        <Input 
                          type="number" 
                          placeholder={field.placeholder}
                          value={(field.value as string | number) ?? ''} 
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="bg-background/50 border-border/40 h-14 rounded-2xl px-4 text-base focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary shadow-inner transition-all hover:bg-background/80"
                        />
                      ) : field.type === 'select' ? (
                        <Select 
                          value={(field.value as string) || ''} 
                          onValueChange={(val) => handleFieldChange(field.key, val)}
                        >
                          <SelectTrigger className="bg-background/50 border-border/40 h-14 rounded-2xl px-4 text-base w-full text-left font-medium focus:ring-1 focus:ring-primary focus:border-primary shadow-inner transition-all hover:bg-background/80">
                            <SelectValue placeholder={field.placeholder || "Select option..."} />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl">
                            {field.options && field.options.length > 0 ? (
                              field.options.map((opt) => (
                                <SelectItem key={opt} value={opt} className="rounded-lg my-1 cursor-pointer hover:bg-primary/10 hover:text-primary focus:bg-primary/10">
                                  {opt}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>No options defined</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input 
                          placeholder={field.placeholder}
                          value={(field.value as string) || ''} 
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="bg-background/50 border-border/40 h-14 rounded-2xl px-4 text-base focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary shadow-inner transition-all hover:bg-background/80"
                        />
                      )}
                      {field.description && (
                        <p className="text-xs text-muted-foreground italic mt-2">{field.description}</p>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {tables.filter(t => t.enabled).sort((a, b) => a.order - b.order).map((table) => (
            <Card key={table.key} className="border-border/40 bg-card/40 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -ml-32 -mt-32 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 bg-background/30 p-6 md:p-8 relative z-10">
                <CardTitle className="text-2xl font-headline bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">{table.label}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleAddTableRow(table.key)} className="text-accent hover:text-accent-foreground hover:bg-accent hover:border-accent font-bold rounded-xl h-10 px-4 transition-all">
                  <Plus className="w-4 h-4 mr-2" /> Add Row
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto relative z-10">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-background/20 border-b border-border/30 hover:bg-background/20">
                      {table.columns.filter(c => c.enabled).sort((a, b) => a.order - b.order).map(col => (
                        <TableHead key={col.key} className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground py-5 px-6">
                          {col.label}
                        </TableHead>
                      ))}
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(table.rows || []).map((row, rowIndex) => (
                      <TableRow key={rowIndex} className="hover:bg-primary/5 border-b border-border/20 transition-colors group/row">
                        {table.columns.filter(c => c.enabled).sort((a, b) => a.order - b.order).map(col => (
                          <TableCell key={col.key} className="p-4 px-6 align-top">
                            {col.type === 'bool' ? (
                              <div className="flex items-center justify-center h-12">
                                <Checkbox 
                                  checked={!!row[col.key]} 
                                  onCheckedChange={(val) => handleTableRowChange(table.key, rowIndex, col.key, val)} 
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                              </div>
                            ) : col.type === 'date' ? (
                              <Input 
                                type="date"
                                value={(row[col.key] as string) ?? ''}
                                onChange={(e) => handleTableRowChange(table.key, rowIndex, col.key, e.target.value)}
                                className="h-12 text-sm bg-background/30 border-border/30 rounded-xl focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary shadow-inner hover:bg-background/60"
                              />
                            ) : col.type === 'int' || col.type === 'decimal' ? (
                              <Input 
                                type="number"
                                step={col.type === 'decimal' ? 'any' : '1'}
                                value={(row[col.key] as string | number) ?? ''}
                                onChange={(e) => handleTableRowChange(table.key, rowIndex, col.key, e.target.value)}
                                className="h-12 text-sm bg-background/30 border-border/30 rounded-xl focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary shadow-inner hover:bg-background/60"
                              />
                            ) : (
                              <Input 
                                value={(row[col.key] as string) ?? ''}
                                onChange={(e) => handleTableRowChange(table.key, rowIndex, col.key, e.target.value)}
                                className="h-12 text-sm bg-background/30 border-border/30 rounded-xl focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary shadow-inner hover:bg-background/60"
                              />
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="p-4 pr-6 align-middle">
                          <div className="flex justify-end">
                             <Button variant="ghost" size="icon" onClick={() => handleRemoveTableRow(table.key, rowIndex)} className="text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all opacity-50 group-hover/row:opacity-100">
                               <Trash2 className="w-5 h-5" />
                             </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}

          {type.allow_file && (
            <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden relative group">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mb-32 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>
              <CardHeader className="border-b border-border/20 bg-background/30 p-8 relative z-10">
                <CardTitle className="text-2xl font-headline flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 shadow-inner">
                    <Paperclip className="w-6 h-6 text-accent" />
                  </div>
                  Digital Attachment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 relative z-10">
                <div className="space-y-4">
                  {attachment.included ? (
                    <div className="bg-background/60 p-6 rounded-2xl border border-border/40 flex items-center gap-6 shadow-inner transition-all hover:bg-background/80 hover:border-accent/40 group/attachment">
                      <div className="bg-accent/10 p-4 rounded-xl border border-accent/20">
                         <FileText className="w-8 h-8 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold truncate text-foreground/90">{attachment.file_name}</p>
                        <p className="text-sm font-medium text-muted-foreground mt-1">{(attachment.size / 1024).toFixed(1)} KB • {attachment.mime_type}</p>
                      </div>
                      <Button variant="outline" size="icon" onClick={() => setAttachment({ included: false, file_name: '', mime_type: '', size: 0, base64: '' })} className="h-12 w-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all opacity-50 group-hover/attachment:opacity-100">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border/40 rounded-3xl p-12 text-center bg-background/30 hover:bg-background/60 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all cursor-pointer relative group/dropzone">
                       <div className="flex flex-col items-center justify-center h-full w-full absolute top-0 left-0">
                            <input type="file" className="opacity-0 w-full h-full cursor-pointer z-10" onChange={handleFileChange} />
                       </div>
                       <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover/dropzone:opacity-100 transition-opacity rounded-3xl pointer-events-none"></div>
                      <div className="space-y-4 pointer-events-none relative z-0 flex flex-col items-center">
                        <div className="p-5 rounded-full bg-background border border-border/40 shadow-xl group-hover/dropzone:scale-110 group-hover/dropzone:border-accent/30 transition-all duration-300">
                           <Plus className="w-8 h-8 text-muted-foreground group-hover/dropzone:text-accent transition-colors" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-foreground/80 group-hover/dropzone:text-foreground">Click or Drag File Here</p>
                          <p className="text-sm text-muted-foreground mt-1">PDFs, Images, and Documents supported.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Sticky Live Preview */}
        <div className="xl:col-span-5 xl:sticky xl:top-36 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border/50">
          <div className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-3xl p-4 shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay pointer-events-none"></div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/20 mb-4 bg-background/30 rounded-2xl">
              <span className="text-[11px] font-black uppercase text-primary tracking-[0.2em]">Live Validation Engine</span>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] text-muted-foreground font-mono font-bold">SYNCING</span>
                 <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.5)]"></span>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-border/20 bg-background/50">
              <DocumentViewer doc={livePreviewDoc} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
