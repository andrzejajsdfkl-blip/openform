'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { useOpenFormStorage } from '@/lib/storage';
import { DocumentRow } from '@/components/document/document-row';
import { Button } from '@/components/ui/button';
import { Plus, Archive, Layers, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Dashboard() {
  const { documents, documentTypes, isLoaded } = useOpenFormStorage();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);

  if (!isLoaded) return null;

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.document_type.label.toLowerCase().includes(search.toLowerCase()) || 
      doc.fields.some(f => f.value?.toString().toLowerCase().includes(search.toLowerCase()));
    const matchesType = filterType ? doc.document_type.id === filterType : true;
    return matchesSearch && matchesType;
  });

  return (
    <AppShell>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">Vault Records</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Manage and access your semantic architectural documents.</p>
          </div>
          <div className="flex gap-3">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-border/50 h-11 bg-card hover:bg-muted/50">
                  <Plus className="w-5 h-5 text-primary" /> New Document
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border/50 p-2 shadow-2xl">
                {documentTypes.length > 0 ? (
                  documentTypes.map(type => (
                    <DropdownMenuItem key={type.id} asChild className="cursor-pointer hover:bg-primary/10 hover:text-primary p-3 rounded-lg mb-1">
                      <Link href={`/document/new?typeId=${type.id}`}>
                        <span className="font-medium">{type.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem className="p-4 text-center text-muted-foreground text-xs italic">
                    No types defined yet
                  </DropdownMenuItem>
                )}
                <div className="border-t border-border/50 my-2 pt-2">
                  <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent/10 hover:text-accent p-3 rounded-lg">
                    <Link href="/type/new" className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span className="font-bold">Define New Type</span>
                    </Link>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl flex items-center gap-6">
            <div className="bg-primary/20 p-4 rounded-xl">
              <Archive className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/50">Total Records</p>
              <h2 className="text-3xl font-headline font-bold">{documents.length}</h2>
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl flex items-center gap-6">
            <div className="bg-accent/20 p-4 rounded-xl">
              <Layers className="w-8 h-8 text-accent" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/50">Document Types</p>
              <h2 className="text-3xl font-headline font-bold">{documentTypes.length}</h2>
            </div>
          </div>
          <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-xl flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <p className="text-[10px] uppercase tracking-widest font-black text-primary">System Status</p>
            </div>
            <p className="text-sm font-medium">Ready for Archiving</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search across labels and values..." 
                className="pl-10 h-11 bg-card border-border/50 rounded-xl focus:ring-primary focus:border-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <Button 
                  variant={filterType === null ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setFilterType(null)}
                  className="rounded-full h-8 text-xs font-bold whitespace-nowrap"
                >
                  All Records
                </Button>
                {documentTypes.map(type => (
                  <Button 
                    key={type.id}
                    variant={filterType === type.id ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setFilterType(type.id)}
                    className="rounded-full h-8 text-xs font-bold whitespace-nowrap"
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredDocs.length > 0 ? (
              filteredDocs.map(doc => <DocumentRow key={doc.document_id} doc={doc} />)
            ) : (
              <div className="text-center py-20 bg-muted/10 border-2 border-dashed border-border/30 rounded-2xl">
                <Archive className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-headline font-bold text-muted-foreground/80">No documents found</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
                  Start by creating a new document type or import an existing record.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
