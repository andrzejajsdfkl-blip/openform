'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useOpenFormStorage } from '@/lib/storage';
import { useRouter } from 'next/navigation';
import { aiSuggestDocumentTypeSchema } from '@/ai/flows/ai-suggest-document-type-schema';
import { Loader2, Sparkles, LayoutPanelTop, ChevronUp, ChevronDown, Trash2, Save, FileJson } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentType, FieldConfig, TECHNICAL_FIELDS } from '@/lib/types';

export default function NewType() {
  const router = useRouter();
  const { toast } = useToast();
  const { upsertType } = useOpenFormStorage();
  const [loading, setLoading] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);

  const handleSuggest = async () => {
    if (!typeName) {
      toast({ title: "Error", description: "Please enter a document name first.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const suggestion = await aiSuggestDocumentTypeSchema({ name: typeName });
      // Map suggestion to our FieldConfig structure
      const fields: FieldConfig[] = suggestion.fields.map(f => ({
        ...f,
        enabled: true,
      }));
      
      setDocumentType({
        id: suggestion.id,
        label: suggestion.label,
        allow_file: suggestion.allow_file,
        fields,
        tables: suggestion.tables?.map(t => ({
          ...t,
          enabled: true,
          columns: t.columns.map(c => ({ ...c, enabled: true }))
        }))
      });
    } catch (err) {
      toast({ title: "AI Error", description: "Failed to generate schema. Please try manually.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (!documentType) return;
    const newFields = [...documentType.fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;

    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;

    // Recalculate order
    newFields.forEach((f, i) => f.order = i + 1);
    setDocumentType({ ...documentType, fields: newFields });
  };

  const handleSave = () => {
    if (!documentType) return;
    upsertType(documentType);
    toast({ title: "Success", description: `Document type "${documentType.label}" defined.` });
    router.push('/');
  };

  return (
    <AppShell>
      <div className="space-y-10">
        <div>
          <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">Architectural Builder</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Define the semantic structure of a new document type.</p>
        </div>

        {!documentType ? (
          <Card className="max-w-xl mx-auto border-border/50 shadow-2xl bg-card">
            <CardHeader className="text-center space-y-2 border-b border-border/50 p-10">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LayoutPanelTop className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-headline">New Semantic Blueprint</CardTitle>
              <p className="text-sm text-muted-foreground">Name your document type. Our AI can suggest a mapping based on technical fields.</p>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="type-name" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Document Name</Label>
                <Input 
                  id="type-name" 
                  placeholder="e.g., Service Agreement, Invoice, Receipt..." 
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  className="h-12 text-lg bg-muted/30"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleSuggest} 
                  disabled={loading}
                  className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Generate AI Mapping
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setDocumentType({ id: typeName.toLowerCase().replace(/\s/g, '-'), label: typeName, allow_file: true, fields: [] })}
                  className="h-12 border-border/50 font-bold"
                >
                  Configure Manually
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border/50 shadow-lg">
              <div className="flex items-center gap-4">
                 <div className="bg-primary/10 p-3 rounded-xl">
                  <FileJson className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-headline font-bold text-foreground">{documentType.label}</h2>
                  <p className="text-xs text-muted-foreground font-mono tracking-tighter">blueprint-id: {documentType.id}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDocumentType(null)} className="border-border/50">Discard</Button>
                <Button onClick={handleSave} className="gap-2 bg-primary hover:bg-primary/90">
                  <Save className="w-4 h-4" /> Finalize Blueprint
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="border-b border-border/50 bg-muted/20">
                    <CardTitle className="text-lg font-headline">Technical Field Mapping</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                      {documentType.fields.map((field, index) => (
                        <div key={field.key} className="p-6 flex items-start gap-6 hover:bg-muted/10 transition-colors group">
                          <div className="flex flex-col gap-1 mt-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveField(index, 'up')}>
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveField(index, 'down')}>
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{field.key} ({field.type})</span>
                              <Input 
                                value={field.label} 
                                onChange={(e) => {
                                  const newFields = [...documentType.fields];
                                  newFields[index].label = e.target.value;
                                  setDocumentType({ ...documentType, fields: newFields });
                                }}
                                placeholder="Display Label"
                                className="bg-muted/30 h-9 font-medium"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-transparent select-none">Options</span>
                              <div className="flex items-center gap-4 pt-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox 
                                    id={`req-${field.key}`}
                                    checked={field.required}
                                    onCheckedChange={(val) => {
                                      const newFields = [...documentType.fields];
                                      newFields[index].required = !!val;
                                      setDocumentType({ ...documentType, fields: newFields });
                                    }}
                                  />
                                  <Label htmlFor={`req-${field.key}`} className="text-xs">Required</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Checkbox 
                                    id={`list-${field.key}`}
                                    checked={field.display_on_list}
                                    onCheckedChange={(val) => {
                                      const newFields = [...documentType.fields];
                                      newFields[index].display_on_list = !!val;
                                      setDocumentType({ ...documentType, fields: newFields });
                                    }}
                                  />
                                  <Label htmlFor={`list-${field.key}`} className="text-xs">List Show</Label>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end pt-5">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                  const newFields = documentType.fields.filter((_, i) => i !== index);
                                  setDocumentType({ ...documentType, fields: newFields });
                                }}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {documentType.fields.length === 0 && (
                        <div className="p-10 text-center text-muted-foreground italic">
                          No fields mapped. Add technical fields manually below.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg">
                  <CardHeader className="border-b border-border/50 bg-muted/20">
                    <CardTitle className="text-lg font-headline">Table Configurations</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                     {documentType.tables?.map((table, index) => (
                       <div key={table.key} className="bg-muted/20 p-4 rounded-xl border border-border/50 space-y-4">
                         <div className="flex justify-between items-center">
                            <div className="flex-1 max-w-xs">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">{table.key}</span>
                              <Input 
                                value={table.label} 
                                onChange={(e) => {
                                  const newTables = [...(documentType.tables || [])];
                                  newTables[index].label = e.target.value;
                                  setDocumentType({ ...documentType, tables: newTables });
                                }}
                                className="h-9 font-bold bg-card"
                              />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => {
                               const newTables = documentType.tables?.filter((_, i) => i !== index);
                               setDocumentType({ ...documentType, tables: newTables });
                            }} className="text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                           {table.columns.map(col => (
                             <div key={col.key} className="bg-card p-2 rounded-lg border border-border/50 text-xs">
                               <p className="font-bold truncate">{col.label}</p>
                               <p className="text-[9px] text-muted-foreground uppercase">{col.type}</p>
                             </div>
                           ))}
                         </div>
                       </div>
                     ))}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-border/50 shadow-lg bg-muted/20">
                  <CardHeader>
                    <CardTitle className="text-sm font-headline uppercase tracking-widest text-muted-foreground">General Config</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                      <Label htmlFor="allow-file" className="text-sm font-bold">Allow File Attachments</Label>
                      <Checkbox 
                        id="allow-file" 
                        checked={documentType.allow_file} 
                        onCheckedChange={(val) => setDocumentType({ ...documentType, allow_file: !!val })} 
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-sm font-headline uppercase tracking-widest text-muted-foreground">Field Injection</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <p className="text-[10px] text-muted-foreground uppercase font-bold">Inject a technical field into the blueprint:</p>
                     <div className="grid grid-cols-2 gap-2">
                        {Object.entries(TECHNICAL_FIELDS).map(([type, keys]) => (
                          <Button 
                            key={type} 
                            variant="outline" 
                            size="sm" 
                            className="text-[10px] h-8 font-bold uppercase"
                            onClick={() => {
                              // Find first unused key
                              const usedKeys = documentType.fields.map(f => f.key);
                              const nextKey = keys.find(k => !usedKeys.includes(k));
                              if (!nextKey) {
                                toast({ title: "Quota Exceeded", description: `All technical fields of type ${type} are used.`, variant: "destructive" });
                                return;
                              }
                              setDocumentType({
                                ...documentType,
                                fields: [...documentType.fields, {
                                  key: nextKey,
                                  type: type as any,
                                  enabled: true,
                                  label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
                                  order: documentType.fields.length + 1,
                                  required: false,
                                  default_value: type === 'bool' ? false : type === 'int' || type === 'decimal' ? 0 : '',
                                  display_on_list: false
                                }]
                              });
                            }}
                          >
                            + {type}
                          </Button>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-[10px] h-8 font-bold uppercase border-primary/50 text-primary"
                          onClick={() => {
                             const usedTableKeys = documentType.tables?.map(t => t.key) || [];
                             const nextTableKey = TECHNICAL_FIELDS.table.find(k => !usedTableKeys.includes(k));
                             if (!nextTableKey) return;
                             setDocumentType({
                               ...documentType,
                               tables: [...(documentType.tables || []), {
                                 key: nextTableKey,
                                 label: 'New Table',
                                 enabled: true,
                                 order: (documentType.tables?.length || 0) + 10,
                                 columns: [
                                   { key: 'text_1', type: 'text', enabled: true, label: 'Column 1', order: 1, required: false, default_value: '' }
                                 ]
                               }]
                             });
                          }}
                        >
                          + table
                        </Button>
                     </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
