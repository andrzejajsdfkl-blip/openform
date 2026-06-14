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
import { Loader2, Trash2, Save, FileJson, GripVertical, Settings2, PlusCircle, Check, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentType, FieldConfig, ColumnConfig, TableConfig, TECHNICAL_FIELDS, TECHNICAL_TABLE_COLUMNS } from '@/lib/types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

// Sortable Item Component
function SortableField({ field, index, documentType, setDocumentType }: {
  field: FieldConfig;
  index: number;
  documentType: DocumentType;
  setDocumentType: (docType: DocumentType) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.key });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="p-6 flex flex-col gap-4 hover:bg-muted/20 transition-colors group bg-card">
      <div className="flex items-start gap-4 w-full">
        <div {...listeners} className="cursor-grab touch-none p-2 mt-7">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
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
          <div className="flex justify-end gap-2 pt-5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`text-muted-foreground hover:text-foreground ${showAdvanced ? 'bg-muted' : ''}`}
              title="Advanced Settings"
            >
              <Settings2 className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                const newFields = documentType.fields.filter((_, i) => i !== index);
                setDocumentType({ ...documentType, fields: newFields });
              }}
              className="text-muted-foreground hover:text-destructive"
              title="Remove Field"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl border border-border/30 animate-in fade-in slide-in-from-top-2 duration-200 ml-10">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Default Value</Label>
            {field.type === 'bool' ? (
              <div className="flex items-center gap-2 h-9 pt-1">
                <Checkbox
                  id={`def-val-${field.key}`}
                  checked={!!field.default_value}
                  onCheckedChange={(val) => {
                    const newFields = [...documentType.fields];
                    newFields[index].default_value = !!val;
                    setDocumentType({ ...documentType, fields: newFields });
                  }}
                />
                <Label htmlFor={`def-val-${field.key}`} className="text-xs">True by default</Label>
              </div>
            ) : field.type === 'date' ? (
              <Input
                type="date"
                value={field.default_value || ''}
                onChange={(e) => {
                  const newFields = [...documentType.fields];
                  newFields[index].default_value = e.target.value;
                  setDocumentType({ ...documentType, fields: newFields });
                }}
                className="bg-background h-9 text-sm"
              />
            ) : field.type === 'int' || field.type === 'decimal' ? (
              <Input
                type="number"
                value={field.default_value ?? ''}
                onChange={(e) => {
                  const newFields = [...documentType.fields];
                  newFields[index].default_value = e.target.value === '' ? '' : Number(e.target.value);
                  setDocumentType({ ...documentType, fields: newFields });
                }}
                className="bg-background h-9 text-sm"
              />
            ) : (
              <Input
                value={field.default_value || ''}
                onChange={(e) => {
                  const newFields = [...documentType.fields];
                  newFields[index].default_value = e.target.value;
                  setDocumentType({ ...documentType, fields: newFields });
                }}
                placeholder="Default value text"
                className="bg-background h-9 text-sm"
              />
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Placeholder</Label>
            <Input
              value={field.placeholder || ''}
              onChange={(e) => {
                const newFields = [...documentType.fields];
                newFields[index].placeholder = e.target.value;
                setDocumentType({ ...documentType, fields: newFields });
              }}
              placeholder="e.g. Enter name..."
              className="bg-background h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Description / Help text</Label>
            <Input
              value={field.description || ''}
              onChange={(e) => {
                const newFields = [...documentType.fields];
                newFields[index].description = e.target.value;
                setDocumentType({ ...documentType, fields: newFields });
              }}
              placeholder="Helpful tooltip text"
              className="bg-background h-9 text-sm"
            />
          </div>
          {field.type === 'select' && (
            <div className="col-span-full space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Select Options (comma-separated)</Label>
              <Input
                value={field.options?.join(', ') || ''}
                onChange={(e) => {
                  const newFields = [...documentType.fields];
                  newFields[index].options = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  setDocumentType({ ...documentType, fields: newFields });
                }}
                placeholder="Option 1, Option 2, Option 3"
                className="bg-background h-9 text-sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Table Configuration Modal
function TableConfigDialog({ table, onUpdateTable, onRemoveTable }: {
  table: TableConfig;
  onUpdateTable: (updatedTable: TableConfig) => void;
  onRemoveTable: (tableKey: string) => void;
}) {
  const [localTable, setLocalTable] = useState(table);
  const [editingColKey, setEditingColKey] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  const handleAddColumn = (type: 'text' | 'date' | 'int' | 'decimal' | 'bool') => {
    const usedKeys = localTable.columns.map(c => c.key);
    const availableKeys = TECHNICAL_TABLE_COLUMNS[type];
    const nextKey = availableKeys.find(k => !usedKeys.includes(k));

    if (nextKey) {
      const newColumn: ColumnConfig = {
        key: nextKey,
        type,
        enabled: true,
        label: `New ${type}`,
        order: localTable.columns.length + 1,
        required: false,
        default_value: '',
      };
      setLocalTable({ ...localTable, columns: [...localTable.columns, newColumn] });
    }
  };

  const startEditing = (col: ColumnConfig) => {
    setEditingColKey(col.key);
    setEditingLabel(col.label);
  };

  const saveEdit = (colKey: string) => {
    const newColumns = localTable.columns.map(c => 
      c.key === colKey ? { ...c, label: editingLabel } : c
    );
    setLocalTable({ ...localTable, columns: newColumns });
    setEditingColKey(null);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Settings2 className="w-4 h-4" /> Configure</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Configure Table: {localTable.label}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label>Table Label</Label>
            <Input 
              value={localTable.label}
              onChange={e => setLocalTable({ ...localTable, label: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Columns</Label>
            {localTable.columns.map((col, index) => (
              <div key={col.key} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Checkbox 
                  checked={col.enabled}
                  onCheckedChange={val => {
                    const newColumns = [...localTable.columns];
                    newColumns[index].enabled = !!val;
                    setLocalTable({ ...localTable, columns: newColumns });
                  }}
                />
                 {editingColKey === col.key ? (
                  <Input 
                    value={editingLabel}
                    onChange={e => setEditingLabel(e.target.value)}
                    className="h-8"
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium">{col.label} ({col.key})</span>
                )}
                <Checkbox 
                  checked={col.required}
                  onCheckedChange={val => {
                    const newColumns = [...localTable.columns];
                    newColumns[index].required = !!val;
                    setLocalTable({ ...localTable, columns: newColumns });
                  }}
                />
                <Label className="text-xs">Req.</Label>
                
                {editingColKey === col.key ? (
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveEdit(col.key)}><Check className="w-4 h-4"/></Button>
                ) : (
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEditing(col)}><Pencil className="w-4 h-4"/></Button>
                )}
                
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-destructive" 
                  onClick={() => {
                     const newColumns = localTable.columns.filter(c => c.key !== col.key);
                     setLocalTable({ ...localTable, columns: newColumns });
                  }}
                >
                  <Trash2 className="w-4 h-4"/>
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
             {Object.keys(TECHNICAL_TABLE_COLUMNS).map(type => (
               <Button key={type} size="sm" variant="outline" onClick={() => handleAddColumn(type as any)}>
                 + {type}
               </Button>
             ))}
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
            <Button type="button" variant="destructive" onClick={() => onRemoveTable(table.key)}>
              Remove Table
            </Button>
          <Button type="button" onClick={() => onUpdateTable(localTable)}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isLoaded || !documentType) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = documentType.fields.findIndex(f => f.key === active.id);
    const newIndex = documentType.fields.findIndex(f => f.key === over.id);
    
    const newFields = arrayMove(documentType.fields, oldIndex, newIndex);
    newFields.forEach((f, i) => f.order = i + 1);

    setDocumentType({ ...documentType, fields: newFields });
  };

  const handleUpdateTable = (updatedTable: TableConfig) => {
    if (!documentType.tables) return;
    const newTables = documentType.tables.map(t => t.key === updatedTable.key ? updatedTable : t);
    setDocumentType({ ...documentType, tables: newTables });
  };

  const handleRemoveTable = (tableKey: string) => {
     if (!documentType.tables) return;
     const newTables = documentType.tables.filter(t => t.key !== tableKey);
     setDocumentType({ ...documentType, tables: newTables });
     document.body.click(); // Close dialog
  };

  const handleSave = () => {
    // Check if active fields have labels and orders
    for (const field of documentType.fields) {
      if (!field.label || field.label.trim() === '') {
        toast({ title: "Validation Error", description: `Technical field "${field.key}" is missing a display label.`, variant: "destructive" });
        return;
      }
      if (field.order === undefined || field.order === null) {
        toast({ title: "Validation Error", description: `Field "${field.label}" has no order sequence number.`, variant: "destructive" });
        return;
      }
    }

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
            <Card className="border-border/50 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/20">
                <CardTitle className="text-lg font-headline">Technical Field Mapping</CardTitle>
              </CardHeader>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={documentType.fields.map(f => f.key)} strategy={verticalListSortingStrategy}>
                  <div className="divide-y divide-border/50">
                    {documentType.fields.map((field, index) => (
                      <SortableField 
                        key={field.key} 
                        field={field} 
                        index={index} 
                        documentType={documentType} 
                        setDocumentType={setDocumentType} 
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              {documentType.fields.length === 0 && (
                <div className="p-10 text-center text-muted-foreground italic">
                  No fields mapped. Add technical fields manually below.
                </div>
              )}
            </Card>

            <Card className="border-border/50 shadow-lg">
              <CardHeader className="border-b border-border/50 bg-muted/20">
                <CardTitle className="text-lg font-headline">Table Configurations</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                 {documentType.tables?.map((table, index) => (
                   <div key={table.key} className="bg-muted/20 p-4 rounded-xl border border-border/50 flex justify-between items-center">
                      <div>
                       <p className="font-bold">{table.label} <span className="text-xs text-muted-foreground">({table.key})</span></p>
                       <p className="text-xs text-muted-foreground">{table.columns.filter(c => c.enabled).length} columns enabled</p>
                     </div>
                      <TableConfigDialog 
                        table={table}
                        onUpdateTable={handleUpdateTable}
                        onRemoveTable={handleRemoveTable}
                      />
                   </div>
                 ))}
                 {(!documentType.tables || documentType.tables.length === 0) && (
                    <div className="p-10 text-center text-muted-foreground italic">
                      No tables defined. You can add one from the Field Injection panel.
                    </div>
                  )}
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
                           className="text-[10px] h-8 font-bold uppercase disabled:opacity-50"
                           disabled={type === 'table'}
                           onClick={() => {
                             const usedKeys = documentType.fields.map(f => f.key);
                             const nextKey = keys.find(k => !usedKeys.includes(k));
                             if (!nextKey) {
                               toast({ title: "Quota Exceeded", description: `All technical fields of type ${type} are used.`, variant: "destructive" });
                               return;
                             }
                             const newField: FieldConfig = {
                               key: nextKey,
                               type: type as any,
                               enabled: true,
                               label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                               order: documentType.fields.length + 1,
                               required: false,
                               default_value: type === 'bool' ? false : (type === 'int' || type === 'decimal') ? 0 : '',
                               display_on_list: false
                             };
                             setDocumentType({
                               ...documentType,
                               fields: [...documentType.fields, newField]
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
                             if (!nextTableKey) {
                                toast({ title: "Quota Exceeded", description: `All table fields are used.`, variant: "destructive" });
                                return;
                             }
                             const newTable: TableConfig = {
                               key: nextTableKey,
                               label: 'New Table',
                               enabled: true,
                               order: (documentType.tables?.length || 0) + 10,
                               columns: [
                                 { key: 'text_1', type: 'text', enabled: true, label: 'Name', order: 1, required: true, default_value: '' },
                                 { key: 'int_1', type: 'int', enabled: true, label: 'Quantity', order: 2, required: false, default_value: 1 },
                                 { key: 'decimal_1', type: 'decimal', enabled: true, label: 'Price', order: 3, required: false, default_value: 0 },
                               ]
                             };
                             setDocumentType({
                               ...documentType,
                               tables: [...(documentType.tables || []), newTable]
                             });
                          }}
                        >
                          <PlusCircle className="w-3 h-3 mr-1"/> table
                        </Button>
                     </div>
                  </CardContent>
                </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
