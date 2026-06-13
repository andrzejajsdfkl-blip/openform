'use client';

import React, { useState } from 'react';
import type { DocumentType, FieldConfig, DocumentInstance, TableConfig } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, X, Paperclip, FileText, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
      if (field.type === 'int' && field.value && !Number.isInteger(Number(field.value))) {
        toast({ title: "Validation Error", description: `Field "${field.label}" must be an integer.`, variant: "destructive" });
        return false;
      }
      if (field.type === 'decimal' && field.value && isNaN(Number(field.value))) {
        toast({ title: "Validation Error", description: `Field "${field.label}" must be a number.`, variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;

    const document: DocumentInstance = {
      format: "OpenFormFile",
      format_version: "1.0",
      document_id: initialData?.document_id || crypto.randomUUID(),
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      document_type: {
        id: type.id,
        label: type.label,
        allow_file: type.allow_file
      },
      fields: fields.filter(f => f.enabled),
      tables: tables.filter(t => t.enabled),
      attachment: attachment.included ? attachment : undefined
    };

    onSave(document);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border/50 shadow-xl sticky top-4 z-10 backdrop-blur-sm bg-card/90">
        <div>
          <h2 className="text-2xl font-headline font-bold text-foreground">{initialData ? 'Edit' : 'New'} {type.label}</h2>
          <p className="text-sm text-muted-foreground">Fill in the fields defined for this document type.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="gap-2 border-border/50">
            <X className="w-4 h-4" /> Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Save className="w-4 h-4" /> Save Document
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Document Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {fields
                  .filter(f => f.enabled)
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label className="text-sm font-bold flex items-center gap-1.5">
                        {field.label}
                        {field.required && <span className="text-destructive">*</span>}
                      </Label>
                      
                      {field.type === 'bool' ? (
                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox 
                            id={field.key} 
                            checked={!!field.value} 
                            onCheckedChange={(val) => handleFieldChange(field.key, val)} 
                          />
                          <Label htmlFor={field.key} className="text-sm font-normal text-muted-foreground">{field.placeholder || 'Active'}</Label>
                        </div>
                      ) : field.type === 'date' ? (
                        <Input 
                          type="date" 
                          value={field.value || ''} 
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="bg-muted/30 border-border/50"
                        />
                      ) : field.type === 'int' || field.type === 'decimal' ? (
                        <Input 
                          type="number" 
                          placeholder={field.placeholder}
                          value={field.value ?? ''} 
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="bg-muted/30 border-border/50"
                        />
                      ) : (
                        <Input 
                          placeholder={field.placeholder}
                          value={field.value || ''} 
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="bg-muted/30 border-border/50"
                        />
                      )}
                      {field.description && <p className="text-[10px] text-muted-foreground/80 italic">{field.description}</p>}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {tables.filter(t => t.enabled).sort((a, b) => a.order - b.order).map((table) => (
            <Card key={table.key} className="border-border/50 shadow-lg overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/20">
                <CardTitle className="text-lg font-headline">{table.label}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => handleAddTableRow(table.key)} className="text-primary hover:text-primary/80">
                  <Plus className="w-4 h-4 mr-1" /> Add Row
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 border-b border-border/50">
                      {table.columns.filter(c => c.enabled).sort((a, b) => a.order - b.order).map(col => (
                        <TableHead key={col.key} className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-4">
                          {col.label} {col.required && <span className="text-destructive">*</span>}
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
                            {col.type === 'bool' ? (
                              <Checkbox 
                                checked={!!row[col.key]} 
                                onCheckedChange={(val) => handleTableRowChange(table.key, rowIndex, col.key, val)} 
                              />
                            ) : (
                              <Input 
                                type={col.type === 'date' ? 'date' : col.type === 'int' || col.type === 'decimal' ? 'number' : 'text'}
                                value={row[col.key] ?? ''}
                                onChange={(e) => handleTableRowChange(table.key, rowIndex, col.key, e.target.value)}
                                className="h-9 text-sm bg-transparent border-transparent hover:border-border/50 focus:bg-muted/30"
                              />
                            )}
                          </TableCell>
                        ))}
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveTableRow(table.key, rowIndex)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!table.rows || table.rows.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={table.columns.length + 1} className="h-24 text-center text-muted-foreground italic">
                          No items added yet. Click "Add Row" to begin.
                        </TableCell>
                      </TableRow>
                    )}
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
                      <div className="bg-accent/20 p-3 rounded-lg">
                        <FileText className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{attachment.file_name}</p>
                        <p className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-mono mt-1">{attachment.mime_type}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setAttachment({ included: false, file_name: '', mime_type: '', size: 0, base64: '' })} className="text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center bg-muted/10 hover:bg-muted/20 transition-colors">
                      <Input 
                        type="file" 
                        id="file-upload" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                      <Label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
                        <div className="bg-accent/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-accent">
                          <Plus className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold">Add Attachment</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">PDF, Images, etc.</p>
                        </div>
                      </Label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/50 shadow-lg bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h4 className="text-sm font-headline font-bold text-primary mb-2">Architectural Standard</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This document is built using the <span className="font-bold text-foreground">OpenForm STD v1.0</span> specification. 
                It utilizes a mapping of rigid technical keys to your defined semantic labels.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
