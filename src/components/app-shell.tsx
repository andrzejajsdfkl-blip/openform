'use client';

import React from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarFooter } from '@/components/ui/sidebar';
import { FileText, Plus, Settings, Archive, Download, FileJson, LayoutDashboard, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOpenFormStorage } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { documentTypes, documents } = useOpenFormStorage();

  const getDocCount = (typeId: string) => documents.filter(d => d.document_type.id === typeId).length;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-r border-border/50">
          <SidebarHeader className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Archive className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-headline font-bold text-foreground">OpenForm</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Studio Engine</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4 space-y-6">
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/'}>
                    <Link href="/">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/import'}>
                    <Link href="/import">
                      <Download className="w-4 h-4" />
                      <span>Import Document</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-bold text-muted-foreground/50 px-2 py-2">DOCUMENT TYPES</SidebarGroupLabel>
              <SidebarMenu>
                {documentTypes.map((type) => (
                  <SidebarMenuItem key={type.id}>
                    <SidebarMenuButton asChild isActive={pathname === `/type/${type.id}`}>
                      <Link href={`/type/${type.id}`} className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                          <FileJson className="w-4 h-4 text-primary" />
                          <span>{type.label}</span>
                        </div>
                        <Badge variant="secondary" className="h-5 px-1.5 min-w-[1.25rem] text-[10px]">{getDocCount(type.id)}</Badge>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/type/new'}>
                    <Link href="/type/new" className="text-primary hover:text-primary/80 font-medium">
                      <Plus className="w-4 h-4" />
                      <span>Create New Type</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border/50">
            <p className="text-[10px] text-center text-muted-foreground/40 font-mono">v1.0.0 OPENFORM STD</p>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto relative bg-background">
          <div className="max-w-6xl mx-auto p-8 animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
