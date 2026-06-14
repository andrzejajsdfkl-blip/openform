'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  FileText,
  Plus,
  Settings2,
  Archive,
  Download,
  FileJson,
  LayoutDashboard,
  Eye,
  Play,
  BarChart2,
  Terminal,
  LogOut,
  Sparkles,
  Search,
  ChevronLeft,
  Menu,
  X,
  Inbox,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOpenFormStorage } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { DocumentViewer } from '@/components/document/document-viewer';
import type { DocumentInstance } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ─── helpers ──────────────────────────────────────────────────────────────────

const COLLAPSED_KEY = 'openform:sidebar-collapsed';

function isRecentDoc(doc: DocumentInstance): boolean {
  try {
    const created = new Date(doc.created_at).getTime();
    return Date.now() - created < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function badgeStyle(count: number): string {
  if (count === 0) return 'bg-muted/40 text-muted-foreground border-border/30';
  if (count < 5)   return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (count < 20)  return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
}

// ─── sidebar width constants ──────────────────────────────────────────────────
const SIDEBAR_W   = 280;
const COLLAPSED_W = 64;

// ─── main component ───────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { documentTypes, documents } = useOpenFormStorage();

  const [previewDoc, setPreviewDoc]   = useState<DocumentInstance | null>(null);
  const [collapsed, setCollapsed]     = useState<boolean>(false);
  const [vaultSearch, setVaultSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // ── persist collapsed state ──────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored !== null) setCollapsed(stored === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  // ── derived data ─────────────────────────────────────────────────────────
  const getDocCount = (typeId: string) =>
    documents.filter((d) => d.document_type.id === typeId).length;

  const filteredDocs = vaultSearch.trim()
    ? documents.filter((d) =>
        d.document_type.label.toLowerCase().includes(vaultSearch.toLowerCase())
      )
    : documents;

  // ── nav definitions ──────────────────────────────────────────────────────
  const workspaceItems = [
    { href: '/',        icon: LayoutDashboard, label: 'Dashboard',       shortcut: 'G+D', activeColor: 'bg-primary/15 text-primary', hoverColor: 'hover:bg-primary/5 hover:text-primary' },
    { href: '/sandbox', icon: Play,            label: 'Local Sandbox',   shortcut: 'G+S', activeColor: 'bg-primary/15 text-primary', hoverColor: 'hover:bg-primary/5 hover:text-primary' },
    { href: '/import',  icon: Download,        label: 'Import Document', shortcut: 'G+I', activeColor: 'bg-accent/15 text-accent',   hoverColor: 'hover:bg-accent/5 hover:text-accent'  },
  ];

  const systemItems = [
    { href: '/analytics',    icon: BarChart2, label: 'Analytics',    shortcut: 'G+A' },
    { href: '/integrations', icon: Terminal,  label: 'Integrations', shortcut: 'G+N' },
    { href: '/settings',     icon: Settings2, label: 'Settings',     shortcut: 'G+,' },
  ];

  // ── animation variants ───────────────────────────────────────────────────
  const sidebarVariants = {
    expanded:  { width: SIDEBAR_W },
    collapsed: { width: COLLAPSED_W },
  };

  const labelVariants = {
    expanded:  { opacity: 1, x: 0,   display: 'block',  transition: { delay: 0.05, duration: 0.2 } },
    collapsed: { opacity: 0, x: -10, transitionEnd: { display: 'none' }, transition: { duration: 0.15 } },
  };

  const currentState = collapsed ? 'collapsed' : 'expanded';

  // ── shared NavItem ────────────────────────────────────────────────────────
  function NavItem({
    href, icon: Icon, label, shortcut, activeColor = '', hoverColor = '',
    isActive, layoutId,
  }: {
    href: string; icon: React.ElementType; label: string; shortcut?: string;
    activeColor?: string; hoverColor?: string; isActive: boolean; layoutId?: string;
  }) {
    return (
      <SidebarMenuItem className="relative">
        {isActive && layoutId && (
          <motion.div
            layoutId={layoutId}
            className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-xl border-l-2 border-primary"
            initial={false}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className={`h-11 rounded-xl transition-all relative z-10 ${
                  isActive ? activeColor : `text-muted-foreground ${hoverColor}`
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <Link href={href}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <motion.span
                    variants={labelVariants}
                    animate={currentState}
                    className="font-semibold text-sm whitespace-nowrap overflow-hidden"
                  >
                    {label}
                  </motion.span>
                </Link>
              </SidebarMenuButton>
            </TooltipTrigger>
            {(collapsed || shortcut) && (
              <TooltipContent side="right" className="flex items-center gap-2">
                {collapsed && <span className="font-medium">{label}</span>}
                {shortcut && (
                  <kbd className="ml-1 px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[10px] font-mono text-muted-foreground">
                    {shortcut}
                  </kbd>
                )}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </SidebarMenuItem>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-hidden selection:bg-primary/30">

        {/* ── Animated Sidebar ── */}
        <motion.div
          variants={sidebarVariants}
          animate={currentState}
          initial={false}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="relative z-30 shrink-0 overflow-hidden"
          style={{ minWidth: COLLAPSED_W }}
        >
          <Sidebar
            className="border-r border-border/20 bg-card/40 backdrop-blur-3xl shadow-2xl h-full"
            style={{ width: '100%' }}
          >
            {/* ── Header ── */}
            <SidebarHeader className="p-4 border-b border-border/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />

              <div className="flex items-center gap-3 relative z-10">
                {/* Logo icon */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-br from-primary/40 to-accent/20 p-2.5 rounded-2xl border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.2)] hover:shadow-[0_0_30px_rgba(var(--primary),0.4)] transition-all duration-500 shrink-0"
                >
                  <Archive className="w-6 h-6 text-primary" />
                </motion.div>

                {/* Title */}
                <motion.div
                  variants={labelVariants}
                  animate={currentState}
                  className="overflow-hidden"
                >
                  <h1 className="text-xl font-headline font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 whitespace-nowrap">
                    OpenForm
                  </h1>
                  <p className="text-[10px] text-primary/80 uppercase tracking-[0.25em] font-black flex items-center gap-1 mt-0.5 whitespace-nowrap">
                    <Sparkles className="w-3 h-3 text-accent animate-pulse" /> Studio Engine
                  </p>
                </motion.div>

                {/* Collapse toggle */}
                <motion.button
                  onClick={() => setCollapsed((c) => !c)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`ml-auto shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all ${collapsed ? 'mx-auto' : ''}`}
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {collapsed ? (
                      <motion.span
                        key="menu"
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Menu className="w-4 h-4" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="chevron"
                        initial={{ opacity: 0, rotate: 90 }}
                        animate={{ opacity: 1, rotate: 0 }}
                        exit={{ opacity: 0, rotate: -90 }}
                        transition={{ duration: 0.15 }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </SidebarHeader>

            {/* ── Content ── */}
            <SidebarContent className="p-3 space-y-6 overflow-y-auto overflow-x-hidden scrollbar-hide">

              {/* Workspace */}
              <SidebarGroup>
                <motion.div variants={labelVariants} animate={currentState}>
                  <SidebarGroupLabel className="text-[10px] font-black text-muted-foreground/50 px-3 py-2 tracking-[0.2em] uppercase">
                    Workspace
                  </SidebarGroupLabel>
                </motion.div>
                <SidebarMenu className="gap-1.5">
                  {workspaceItems.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      shortcut={item.shortcut}
                      activeColor={item.activeColor}
                      hoverColor={item.hoverColor}
                      isActive={pathname === item.href}
                      layoutId={`active-nav-workspace-${item.href}`}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroup>

              {/* Blueprints */}
              <SidebarGroup>
                <motion.div variants={labelVariants} animate={currentState}>
                  <SidebarGroupLabel className="text-[10px] font-black text-muted-foreground/50 px-3 py-2 tracking-[0.2em] uppercase">
                    Blueprints
                  </SidebarGroupLabel>
                </motion.div>
                <SidebarMenu className="gap-1">
                  {documentTypes.map((type) => {
                    const isActive = pathname === `/type/${type.id}`;
                    const count    = getDocCount(type.id);
                    return (
                      <SidebarMenuItem key={type.id} className="relative">
                        {isActive && (
                          <motion.div
                            layoutId={`active-nav-blueprint-${type.id}`}
                            className="absolute inset-0 bg-white/5 rounded-xl border border-white/10"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                className={`h-10 rounded-xl transition-all relative z-10 ${
                                  isActive
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                } ${collapsed ? 'justify-center px-0' : ''}`}
                              >
                                <Link
                                  href={`/type/${type.id}`}
                                  className="flex justify-between items-center w-full"
                                >
                                  <div className="flex items-center gap-3">
                                    <FileJson className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-primary/50'}`} />
                                    <motion.span
                                      variants={labelVariants}
                                      animate={currentState}
                                      className="font-medium text-sm whitespace-nowrap overflow-hidden"
                                    >
                                      {type.label}
                                    </motion.span>
                                  </div>
                                  <motion.div variants={labelVariants} animate={currentState}>
                                    <Badge
                                      variant="outline"
                                      className={`h-5 px-2 text-[10px] font-bold border ${badgeStyle(count)}`}
                                    >
                                      {count}
                                    </Badge>
                                  </motion.div>
                                </Link>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            {collapsed && (
                              <TooltipContent side="right" className="flex items-center gap-2">
                                <span className="font-medium">{type.label}</span>
                                <Badge variant="outline" className={`h-5 px-2 text-[10px] font-bold border ${badgeStyle(count)}`}>
                                  {count}
                                </Badge>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </SidebarMenuItem>
                    );
                  })}

                  {/* Create New Type */}
                  <SidebarMenuItem>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === '/type/new'}
                            className={`mt-2 border border-dashed border-border/40 hover:border-primary/50 hover:bg-primary/5 transition-all rounded-xl h-10 group ${collapsed ? 'justify-center px-0' : ''}`}
                          >
                            <Link
                              href="/type/new"
                              className="text-primary/70 hover:text-primary font-bold justify-center"
                            >
                              <Plus className="w-4 h-4 shrink-0 group-hover:scale-125 group-hover:rotate-90 transition-transform duration-300" />
                              <motion.span
                                variants={labelVariants}
                                animate={currentState}
                                className="whitespace-nowrap overflow-hidden"
                              >
                                Create New Type
                              </motion.span>
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right">Create New Type</TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>

              {/* My Vault */}
              <SidebarGroup className="flex-1 overflow-hidden flex flex-col min-h-0">
                <motion.div variants={labelVariants} animate={currentState}>
                  <SidebarGroupLabel className="text-[10px] font-black text-muted-foreground/50 px-3 py-2 tracking-[0.2em] uppercase flex items-center justify-between">
                    <span>My Vault</span>
                    <Badge variant="outline" className="h-5 px-2 text-[10px] bg-background/50 border-border/30">
                      {documents.length}
                    </Badge>
                  </SidebarGroupLabel>

                  {/* Live vault search */}
                  <div className="relative mb-2 px-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60 pointer-events-none" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={vaultSearch}
                      onChange={(e) => setVaultSearch(e.target.value)}
                      placeholder="Filter by type…"
                      className="w-full h-8 pl-8 pr-8 rounded-lg bg-background/40 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                    />
                    <AnimatePresence>
                      {vaultSearch && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => setVaultSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                <div className="flex-1 overflow-y-auto max-h-[280px] pr-1 space-y-1 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent">
                  <SidebarMenu>
                    <AnimatePresence initial={false}>
                      {filteredDocs.length > 0 ? (
                        filteredDocs.map((doc) => {
                          const firstValField = doc.fields.find(
                            (f) => f.enabled && f.value && typeof f.value === 'string'
                          );
                          const subtitle = firstValField
                            ? String(firstValField.value)
                            : `ID: ${doc.document_id.slice(0, 8)}`;
                          const isActive = pathname === `/document/${doc.document_id}`;
                          const isNew    = isRecentDoc(doc);

                          return (
                            <motion.div
                              key={doc.document_id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              layout
                            >
                              <SidebarMenuItem className="group/item relative">
                                <SidebarMenuButton
                                  asChild
                                  isActive={isActive}
                                  className={`h-14 rounded-xl mb-1 border transition-all ${
                                    isActive
                                      ? 'bg-card border-border/50 shadow-sm'
                                      : 'border-transparent hover:bg-white/5 hover:border-border/30'
                                  } ${collapsed ? 'justify-center px-0 h-11' : ''}`}
                                >
                                  <Link
                                    href={`/document/${doc.document_id}`}
                                    className="flex justify-between items-center w-full pr-10"
                                  >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      {/* Icon with recent-activity dot */}
                                      <div className="relative shrink-0">
                                        <div
                                          className={`p-2 rounded-lg transition-colors ${
                                            isActive
                                              ? 'bg-primary/20 text-primary shadow-inner'
                                              : 'bg-muted/40 text-muted-foreground group-hover/item:text-primary/70'
                                          }`}
                                        >
                                          <FileText className="w-4 h-4" />
                                        </div>
                                        {isNew && (
                                          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                          </span>
                                        )}
                                      </div>

                                      <motion.div
                                        variants={labelVariants}
                                        animate={currentState}
                                        className="flex flex-col text-left truncate"
                                      >
                                        <span
                                          className={`font-semibold text-[13px] leading-tight mb-0.5 ${
                                            isActive ? 'text-foreground' : 'text-foreground/80'
                                          }`}
                                        >
                                          {doc.document_type.label}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground truncate font-medium">
                                          {subtitle}
                                        </span>
                                      </motion.div>
                                    </div>
                                  </Link>
                                </SidebarMenuButton>

                                {/* Preview button */}
                                <motion.button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setPreviewDoc(doc);
                                  }}
                                  variants={labelVariants}
                                  animate={currentState}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/15 opacity-0 group-hover/item:opacity-100 focus:opacity-100 transition-all duration-300 z-10 backdrop-blur-md"
                                  title="Live Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </motion.button>
                              </SidebarMenuItem>
                            </motion.div>
                          );
                        })
                      ) : (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="text-center py-8 px-4 bg-card/20 rounded-2xl border border-dashed border-border/40"
                        >
                          <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                            className="flex justify-center mb-3"
                          >
                            <Inbox className="w-10 h-10 text-muted-foreground/30" />
                          </motion.div>
                          <p className="text-xs text-muted-foreground italic mb-3">
                            {vaultSearch ? 'No documents match.' : 'Vault is empty.'}
                          </p>
                          {!vaultSearch && (
                            <motion.div
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                              className="text-primary/60 text-[10px] font-semibold tracking-wide flex flex-col items-center gap-0.5"
                            >
                              <svg
                                className="w-4 h-4 text-primary/50"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                              </svg>
                              <span>Create New Type</span>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </SidebarMenu>
                </div>
              </SidebarGroup>

              {/* System */}
              <SidebarGroup>
                <motion.div variants={labelVariants} animate={currentState}>
                  <SidebarGroupLabel className="text-[10px] font-black text-muted-foreground/50 px-3 py-2 tracking-[0.2em] uppercase">
                    System
                  </SidebarGroupLabel>
                </motion.div>
                <SidebarMenu className="gap-1">
                  {systemItems.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      shortcut={item.shortcut}
                      activeColor="text-foreground"
                      hoverColor="hover:bg-white/5 hover:text-foreground"
                      isActive={pathname === item.href}
                      layoutId={`active-nav-system-${item.href}`}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>

            {/* ── Footer / User Profile ── */}
            <SidebarFooter className="p-3 border-t border-border/20 bg-background/40 backdrop-blur-md">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex items-center p-2.5 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group ${
                        collapsed ? 'justify-center' : 'justify-between gap-3'
                      }`}
                    >
                      {/* Gradient avatar with initials + status dot */}
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary via-accent to-rose-400 p-[2px] shadow-[0_0_12px_rgba(var(--primary),0.4)]">
                          <div className="w-full h-full bg-background rounded-full flex items-center justify-center">
                            <span className="text-[11px] font-black bg-clip-text text-transparent bg-gradient-to-br from-primary to-accent select-none">
                              AU
                            </span>
                          </div>
                        </div>
                        {/* Green status dot */}
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-background" />
                        </span>
                      </div>

                      {/* Name + email */}
                      <motion.div
                        variants={labelVariants}
                        animate={currentState}
                        className="flex flex-col overflow-hidden flex-1 min-w-0"
                      >
                        <span className="text-sm font-bold text-foreground truncate">Admin User</span>
                        <span className="text-[10px] text-muted-foreground truncate">admin@openform.io</span>
                      </motion.div>

                      <motion.div variants={labelVariants} animate={currentState} className="shrink-0">
                        <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                      </motion.div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex flex-col gap-0.5">
                    <span className="font-semibold text-foreground">Admin User</span>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Local Session
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </SidebarFooter>
          </Sidebar>
        </motion.div>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-auto relative bg-background min-w-0">
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none opacity-50" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none mix-blend-overlay" />
          <div className="max-w-7xl mx-auto p-6 md:p-10 lg:p-12 relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ── Preview Sheet ── */}
      <Sheet open={previewDoc !== null} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <SheetContent
          side="right"
          className="sm:max-w-3xl w-[95vw] overflow-y-auto border-l border-border/30 bg-background/60 backdrop-blur-3xl p-0 shadow-2xl"
        >
          {/* Gradient header */}
          <div className="relative overflow-hidden border-b border-border/10 sticky top-0 z-20">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-background/60 backdrop-blur-2xl pointer-events-none" />
            <div className="relative z-10 p-6 md:p-8 flex items-start justify-between gap-4">
              <SheetHeader className="space-y-2 flex-1 min-w-0">
                <SheetTitle className="text-2xl font-headline font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent leading-tight">
                  Document Preview
                </SheetTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <SheetDescription className="text-xs text-muted-foreground font-mono bg-muted/40 border border-border/30 px-2 py-1 rounded-md m-0">
                    ID: {previewDoc?.document_id}
                  </SheetDescription>
                  {previewDoc?.created_at && (
                    <span className="text-xs text-muted-foreground font-mono bg-muted/40 border border-border/30 px-2 py-1 rounded-md">
                      Created: {formatDate(previewDoc.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                    {previewDoc?.document_type.label}
                  </span>
                </div>
              </SheetHeader>

              {/* Close button */}
              <button
                onClick={() => setPreviewDoc(null)}
                className="shrink-0 mt-1 p-2 rounded-xl bg-muted/40 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:border-destructive/30 transition-all duration-200"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {previewDoc && <DocumentViewer doc={previewDoc} />}
          </div>
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
}
