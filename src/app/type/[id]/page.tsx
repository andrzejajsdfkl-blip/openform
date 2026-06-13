'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useOpenFormStorage } from '@/lib/storage';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Trash2, Save, FileJson, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentType, TECHNICAL_FIELDS } from '@/lib/types';

export default function EditType() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { documentTypes, upsertType, isLoaded } = useOpenFormStorage();
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);

  useEffect(() => {
    if (isLoaded) {
      const type = documentTypes.find(t => t.id === params.id);
      if (type) setDocumentType(JSON.parse(JSON.stringify(type)));
    }
  }, [isLoaded, params.id, documentTypes]);

  if (!isLoaded || !documentType) return null;

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...documentType.fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;

    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;

    newFields.forEach((f, i) => f.order = i + 1);
    setDocumentType({ ...documentType, fields: newFields });
  };

  const handleSave = () => {
    upsertType(documentType);
    toast({ title: "Blueprint Updated", description: `Changes for "${documentType.label}" saved.` });
    router.push('/');
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border/50 shadow-lg">
          <div className="flex items-center gap-4">
             <div className="bg-primary/10 p-3 rounded-xl">
              <FileJson className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-headline font-bold text-foreground">Edit {documentType.label}</h2>
              <p className="text-xs text-muted-foreground font-mono tracking-tighter">blueprint-id: {documentType.id}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/')} className="border-border/50">Cancel</Button>
            <Button onClick={handleSave} className="gap-2 bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4" /> Save Changes
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
                </div>
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
                     <p className="text-[10px] text-muted-foreground uppercase font-bold">Add additional technical field mapping:</p>
                     <div className="grid grid-cols-2 gap-2">
                        {Object.entries(TECHNICAL_FIELDS).map(([type, keys]) => (
                          <Button 
                            key={type} 
                            variant="outline" 
                            size="sm" 
                            className="text-[10px] h-8 font-bold uppercase"
                            onClick={() => {
                              const usedKeys = documentType.fields.map(f => f.key);
                              const nextKey = keys.find(k => !usedKeys.includes(k));
                              if (!nextKey) return;
                              setDocumentType({
                                ...documentType,
                                fields: [...documentType.fields, {
                                  key: nextKey,
                                  type: type as any,
                                  enabled: true,
                                  label: `New ${type} Field`,
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
                     </div>
                  </CardContent>
                </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
