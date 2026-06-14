'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import { AppShell } from '@/components/app-shell';
import { useOpenFormStorage } from '@/lib/storage';
import { DocumentRow } from '@/components/document/document-row';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Archive,
  Layers,
  Search,
  Filter,
  UploadCloud,
  AlertCircle,
  Loader,
  ChevronRight,
  FileJson,
  Zap,
  X,
  SortAsc,
  LayoutList,
  LayoutGrid,
  Paperclip,
  FileText,
  Download,
  Edit,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import type { DocumentInstance } from '@/lib/types';

// ─────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

const floatVariants = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
};

// ─────────────────────────────────────────────
// Animated Counter
// ─────────────────────────────────────────────
const AnimatedCounter = memo(function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const duration = 900;
    const startTime = performance.now();

    const update = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.floor(eased * value));
      if (progress < 1) raf = requestAnimationFrame(update);
      else setDisplayValue(value);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{displayValue}</>;
});

// ─────────────────────────────────────────────
// Glowing archive icon for empty states
// ─────────────────────────────────────────────
const GlowArchiveIcon = memo(function GlowArchiveIcon() {
  return (
    <div className="relative flex items-center justify-center mx-auto mb-8 w-32 h-32">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-primary/30"
          style={{ inset: `-${(i + 1) * 14}px` }}
          animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.15, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
        />
      ))}
      <motion.div
        variants={floatVariants}
        animate="animate"
        className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 shadow-[0_0_40px_rgba(var(--primary),0.25)] relative z-10"
      >
        <Archive className="w-10 h-10 text-primary drop-shadow-[0_0_12px_rgba(var(--primary),0.9)]" />
      </motion.div>
    </div>
  );
});

// ─────────────────────────────────────────────
// Compact row (table-like) for compact view
// ─────────────────────────────────────────────
const CompactDocumentRow = memo(function CompactDocumentRow({ doc }: { doc: DocumentInstance }) {
  const firstField = doc.fields
    .filter((f) => f.enabled)
    .sort((a, b) => a.order - b.order)[0];

  const handleDownloadJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.document_type.label}_${doc.document_id.slice(0, 8)}.off`;
    a.click();
    URL.revokeObjectURL(url);
  }, [doc]);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-card/40 hover:bg-card/70 border border-border/40 hover:border-primary/30 rounded-2xl transition-all group">
      <div className="bg-primary/10 p-1.5 rounded-lg shrink-0 group-hover:bg-primary/20 transition-colors">
        <FileText className="w-4 h-4 text-primary" />
      </div>
      <span className="font-bold text-sm text-foreground w-36 truncate shrink-0">
        {doc.document_type.label}
      </span>
      <span className="font-mono text-[11px] text-muted-foreground/70 w-28 truncate shrink-0 hidden sm:block">
        {doc.document_id.slice(0, 12)}
      </span>
      <span className="text-sm text-muted-foreground flex-1 truncate hidden md:block">
        {firstField
          ? firstField.type === 'bool'
            ? firstField.value
              ? 'Yes'
              : 'No'
            : (firstField.value as string) || '—'
          : '—'}
      </span>
      <div className="shrink-0 w-6 flex justify-center">
        {doc.attachment?.included && <Paperclip className="w-3.5 h-3.5 text-accent" />}
      </div>
      <span className="text-[11px] text-muted-foreground/60 shrink-0 hidden lg:block w-28 text-right">
        {format(new Date(doc.created_at), 'dd MMM yyyy')}
      </span>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" asChild className="h-7 w-7 rounded-xl">
          <Link href={`/document/${doc.document_id}`}>
            <Edit className="w-3.5 h-3.5" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-xl"
          onClick={handleDownloadJson}
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" asChild className="h-7 w-7 rounded-xl text-primary">
          <Link href={`/document/${doc.document_id}/view`}>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────
// Shimmer stat card wrapper
// ─────────────────────────────────────────────
const StatCard = memo(function StatCard({
  children,
  className,
  index,
}: {
  children: React.ReactNode;
  className?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.15 * index }}
      whileHover={{ y: -5, scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      className={`relative overflow-hidden ${className ?? ''}`}
    >
      <motion.div
        className="absolute inset-0 rounded-[2rem] pointer-events-none"
        animate={{
          boxShadow: [
            '0 0 0px rgba(var(--primary),0)',
            '0 0 20px rgba(var(--primary),0.1)',
            '0 0 0px rgba(var(--primary),0)',
          ],
        }}
        transition={{ duration: 3.5, repeat: Infinity, delay: index * 0.7, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.06) 50%, transparent 60%)',
        }}
        animate={{ backgroundPositionX: ['200%', '-200%'] }}
        transition={{ duration: 4, repeat: Infinity, delay: index * 0.8, ease: 'linear' }}
      />
      {children}
    </motion.div>
  );
});

// ─────────────────────────────────────────────
// Sort options
// ─────────────────────────────────────────────
type SortOption = 'newest' | 'oldest' | 'type-az';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  'type-az': 'Type A–Z',
};

// ─────────────────────────────────────────────
// Document List Component
// ─────────────────────────────────────────────
const DocumentList = memo(function DocumentList({
  filteredDocs,
  viewMode,
  documents,
  documentTypes,
}: {
  filteredDocs: DocumentInstance[];
  viewMode: 'card' | 'compact';
  documents: DocumentInstance[];
  documentTypes: Array<{ id: string; label: string; description?: string; fields: Array<any>; allow_file?: boolean }>;
}) {
  return (
    <div className={viewMode === 'compact' ? 'space-y-1.5' : 'space-y-4'}>
      {viewMode === 'compact' && filteredDocs.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground/50">
          <span className="w-9 shrink-0" />
          <span className="w-36 shrink-0">Type</span>
          <span className="w-28 shrink-0 hidden sm:block">ID</span>
          <span className="flex-1 hidden md:block">Value</span>
          <span className="w-6" />
          <span className="w-28 text-right hidden lg:block">Date</span>
          <span className="w-24 shrink-0" />
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {filteredDocs.length > 0 ? (
          filteredDocs.map((doc, i) =>
            viewMode === 'card' ? (
              <motion.div
                key={doc.document_id}
                layout
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -16 }}
                transition={{ duration: 0.18, delay: i * 0.04 }}
              >
                <DocumentRow doc={doc} />
              </motion.div>
            ) : (
              <motion.div
                key={doc.document_id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.14, delay: i * 0.025 }}
              >
                <CompactDocumentRow doc={doc} />
              </motion.div>
            ),
          )
        ) : documents.length === 0 ? (
          documentTypes.length > 0 ? (
            <EmptyVaultWithBlueprints documentTypes={documentTypes} />
          ) : (
            <FreshStartOnboarding />
          )
        ) : (
          <EmptySearchState search="" filterType={null} />
        )}
      </AnimatePresence>
    </div>
  );
});

// ─────────────────────────────────────────────
// Empty States
// ─────────────────────────────────────────────
const EmptyVaultWithBlueprints = memo(function EmptyVaultWithBlueprints({
  documentTypes,
}: {
  documentTypes: Array<{ id: string; label: string; description?: string; fields: Array<any>; allow_file?: boolean }>;
}) {
  return (
    <motion.div
      key="onboarding-a"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="text-center py-16 bg-card/20 backdrop-blur-xl border border-border/30 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

        <GlowArchiveIcon />

        <h3 className="text-4xl font-headline font-bold text-foreground mb-4">
          Your Vault is Empty
        </h3>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-10">
          You have defined {documentTypes.length} blueprint{documentTypes.length > 1 ? 's' : ''}. Let&apos;s bring them to life by
          creating your first document record.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left max-w-6xl mx-auto">
          {documentTypes.map((type, idx) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative bg-background/60 backdrop-blur-2xl border border-border/50 hover:border-primary/50 rounded-3xl p-6 shadow-lg hover:shadow-[0_0_30px_rgba(var(--primary),0.15)] transition-all duration-300 flex flex-col justify-between"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 group-hover:scale-110 transition-transform">
                    <FileJson className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                    {type.label}
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {type.description || 'Custom architectural document template.'}
                </p>
                <div className="flex gap-2 pt-2">
                  <Badge
                    variant="outline"
                    className="text-xs py-1 px-3 bg-background/50 rounded-full"
                  >
                    {type.fields.length} Field{type.fields.length !== 1 ? 's' : ''}
                  </Badge>
                  {type.allow_file && (
                    <Badge
                      variant="outline"
                      className="text-xs py-1 px-3 bg-background/50 text-accent border-accent/30 rounded-full"
                    >
                      Attachments
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                asChild
                className="w-full h-12 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-bold rounded-2xl transition-all border border-primary/20 cursor-pointer shadow-sm group-hover:shadow-[0_0_15px_rgba(var(--primary),0.4)]"
              >
                <Link href={`/document/new?typeId=${type.id}`}>
                  <Plus className="w-5 h-5 mr-2" /> Create Record
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 flex justify-center gap-8">
          <Button
            variant="link"
            asChild
            className="text-muted-foreground hover:text-primary font-bold text-base"
          >
            <Link href="/type/new">+ Define Another Blueprint</Link>
          </Button>
          <Button
            variant="link"
            asChild
            className="text-muted-foreground hover:text-accent font-bold text-base"
          >
            <Link href="/import">Import Document File</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

const FreshStartOnboarding = memo(function FreshStartOnboarding() {
  return (
    <motion.div
      key="onboarding-b"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="text-center py-24 bg-card/20 backdrop-blur-xl border border-border/30 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-background via-transparent to-transparent pointer-events-none" />

      <GlowArchiveIcon />

      <h3 className="text-4xl font-headline font-bold text-foreground mb-4">
        Welcome to OpenForm
      </h3>
      <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-12">
        To get started, define your first document blueprint or import an existing
        file into the engine.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left relative z-10">
        <Link
          href="/type/new"
          className="group bg-background/60 backdrop-blur-2xl border border-border/50 hover:border-primary/50 rounded-3xl p-8 shadow-lg hover:shadow-[0_0_30px_rgba(var(--primary),0.15)] transition-all duration-300 flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="bg-primary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <Plus className="w-7 h-7 text-primary" />
            </div>
            <h4 className="font-bold text-2xl text-foreground group-hover:text-primary mb-2 transition-colors">
              Define a Blueprint
            </h4>
            <p className="text-base text-muted-foreground">
              Create custom templates with schemas, input rules, and structured data
              layouts.
            </p>
          </div>
          <div className="mt-8 text-base font-bold text-primary flex items-center gap-2 bg-primary/10 w-max px-4 py-2 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            Get Started{' '}
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          href="/import"
          className="group bg-background/60 backdrop-blur-2xl border border-border/50 hover:border-accent/50 rounded-3xl p-8 shadow-lg hover:shadow-[0_0_30px_rgba(var(--accent),0.15)] transition-all duration-300 flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="bg-accent/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border border-accent/20 group-hover:scale-110 group-hover:-rotate-6 transition-transform">
              <UploadCloud className="w-7 h-7 text-accent" />
            </div>
            <h4 className="font-bold text-2xl text-foreground group-hover:text-accent mb-2 transition-colors">
              Import Document
            </h4>
            <p className="text-base text-muted-foreground">
              Upload an existing .off document or schema to manage or edit it
              immediately.
            </p>
          </div>
          <div className="mt-8 text-base font-bold text-accent flex items-center gap-2 bg-accent/10 w-max px-4 py-2 rounded-xl group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
            Import File{' '}
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    </motion.div>
  );
});

const EmptySearchState = memo(function EmptySearchState({
  search,
  filterType,
}: {
  search: string;
  filterType: string | null;
}) {
  const handleClearFilters = useCallback(() => {
    // This will be handled by parent component
  }, []);

  return (
    <motion.div
      key="empty-search"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center py-24 bg-card/20 backdrop-blur-xl border-2 border-dashed border-border/30 rounded-[3rem] shadow-inner"
    >
      <motion.div
        variants={floatVariants}
        animate="animate"
        className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <Search className="w-10 h-10 text-muted-foreground/50" />
      </motion.div>
      <h3 className="text-2xl font-headline font-bold text-foreground mb-2">
        No records match &ldquo;{search || filterType}&rdquo;
      </h3>
      <p className="text-muted-foreground text-base max-w-md mx-auto">
        Adjust your search query or clear the active filter to find what you&apos;re
        looking for.
      </p>
      <Button
        variant="outline"
        className="mt-6 rounded-full"
        onClick={handleClearFilters}
      >
        Clear Filters
      </Button>
    </motion.div>
  );
});

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────
export default function Dashboard() {
  const { documents, documentTypes, isLoaded, error } = useOpenFormStorage();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card');
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' focuses search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Attachment count
  const attachmentCount = useMemo(
    () => documents.filter((d) => d.attachment?.included === true).length,
    [documents],
  );

  // Filtered + sorted docs
  const filteredDocs = useMemo(() => {
    const filtered = documents.filter((doc) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        search === '' ||
        doc.document_type.label.toLowerCase().includes(searchLower) ||
        doc.document_id.toLowerCase().includes(searchLower) ||
        doc.fields.some(
          (f) => f.enabled && (f.value?.toString() || '').toLowerCase().includes(searchLower),
        );
      const matchesType = filterType ? doc.document_type.id === filterType : true;
      return matchesSearch && matchesType;
    });

    filtered.sort((a, b) => {
      if (sortOption === 'newest')
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortOption === 'oldest')
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortOption === 'type-az')
        return a.document_type.label.localeCompare(b.document_type.label);
      return 0;
    });

    return filtered;
  }, [documents, search, filterType, sortOption]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleFilterChange = useCallback((typeId: string | null) => {
    setFilterType(typeId);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setFilterType(null);
    searchRef.current?.focus();
  }, []);

  const clearSearch = useCallback(() => {
    setSearch('');
    searchRef.current?.focus();
  }, []);

  // Loading state
  if (!isLoaded) {
    return (
      <AppShell>
        <div className="w-full h-[80vh] flex flex-col items-center justify-center gap-6 relative">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl opacity-20 scale-150 animate-pulse" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground/80 font-mono text-sm tracking-widest uppercase relative z-10"
          >
            Initializing Vault
          </motion.p>
        </div>
      </AppShell>
    );
  }

  // Error state
  if (error) {
    return (
      <AppShell>
        <div className="w-full h-screen flex flex-col items-center justify-center gap-4 p-4">
          <AlertCircle className="w-12 h-12 text-destructive animate-bounce" />
          <p className="text-destructive font-medium text-lg">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4 border-destructive/30 hover:bg-destructive/10"
          >
            Reboot System
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-12"
      >
        {/* ─── Header ─── */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative"
        >
          <div className="relative z-10">
            <motion.h1
              className="text-5xl md:text-6xl font-headline font-bold text-foreground tracking-tight pb-2 relative inline-block"
              whileHover={{ scale: 1.02 }}
            >
              Vault Records
              <span className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-transparent blur-xl -z-10 opacity-0 transition-opacity hover:opacity-100 duration-500" />
            </motion.h1>
            <p className="text-muted-foreground text-sm md:text-base font-medium flex items-center gap-2 mt-2">
              <Zap className="w-4 h-4 text-accent animate-pulse" />
              Manage and access your semantic architectural documents.
            </p>
          </div>

          <div className="flex gap-4 relative z-10">
            <Button
              variant="outline"
              asChild
              className="gap-2 border-border/40 h-12 bg-card/50 backdrop-blur-xl hover:bg-white/10 hover:border-accent/50 transition-all shadow-sm rounded-2xl px-6 cursor-pointer"
            >
              <Link href="/import">
                <UploadCloud className="w-5 h-5 text-accent" />
                <span className="font-bold">Import</span>
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 border border-primary/50 h-12 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 font-bold shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] rounded-2xl px-6 transition-all hover:-translate-y-0.5">
                  <Plus className="w-5 h-5" /> New Document
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 bg-background/95 backdrop-blur-3xl border border-border/40 p-2 shadow-2xl rounded-2xl"
              >
                {documentTypes.length > 0 ? (
                  documentTypes.map((type) => (
                    <DropdownMenuItem
                      key={type.id}
                      asChild
                      className="cursor-pointer hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary p-3 rounded-xl mb-1 text-base font-medium transition-colors"
                    >
                      <Link href={`/document/new?typeId=${type.id}`}>{type.label}</Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem
                    disabled
                    className="p-4 text-center text-muted-foreground text-xs italic"
                  >
                    No blueprints defined.
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-border/30 my-2" />
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer bg-gradient-to-r from-accent/10 to-transparent text-accent hover:from-accent/30 hover:to-accent/10 focus:from-accent/30 p-3 rounded-xl transition-all"
                >
                  <Link href="/type/new" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="font-bold">Define New Blueprint</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* ─── Statistics Cards ─── */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent blur-3xl -z-10 rounded-[3rem]" />

          {/* Card 1 – Total Records */}
          <StatCard
            index={0}
            className="group bg-card/40 backdrop-blur-2xl border border-border/40 rounded-[2rem] p-8 shadow-xl hover:shadow-[0_0_30px_rgba(var(--primary),0.1)] hover:border-primary/40 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="bg-gradient-to-br from-primary/30 to-primary/5 p-4 rounded-2xl border border-primary/30 shadow-inner group-hover:rotate-6 transition-transform duration-300">
                <Archive className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xs uppercase tracking-[0.2em] font-black text-muted-foreground/80">
                Total Records
              </p>
            </div>
            <h2 className="text-6xl font-headline font-bold text-foreground tracking-tighter relative z-10">
              <AnimatedCounter value={documents.length} />
            </h2>
          </StatCard>

          {/* Card 2 – Blueprints */}
          <StatCard
            index={1}
            className="group bg-card/40 backdrop-blur-2xl border border-border/40 rounded-[2rem] p-8 shadow-xl hover:shadow-[0_0_30px_rgba(var(--accent),0.1)] hover:border-accent/40 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all duration-500" />
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="bg-gradient-to-br from-accent/30 to-accent/5 p-4 rounded-2xl border border-accent/30 shadow-inner group-hover:-rotate-6 transition-transform duration-300">
                <Layers className="w-8 h-8 text-accent" />
              </div>
              <p className="text-xs uppercase tracking-[0.2em] font-black text-muted-foreground/80">
                Blueprints
              </p>
            </div>
            <h2 className="text-6xl font-headline font-bold text-foreground tracking-tighter relative z-10">
              <AnimatedCounter value={documentTypes.length} />
            </h2>
          </StatCard>

          {/* Card 3 – Attachments */}
          <StatCard
            index={2}
            className="group bg-card/40 backdrop-blur-2xl border border-border/40 rounded-[2rem] p-8 shadow-xl hover:border-violet-400/30 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl group-hover:bg-violet-500/15 transition-all duration-500" />
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="bg-gradient-to-br from-violet-500/20 to-violet-500/5 p-4 rounded-2xl border border-violet-500/25 shadow-inner group-hover:rotate-6 transition-transform duration-300">
                <Paperclip className="w-8 h-8 text-violet-400" />
              </div>
              <p className="text-xs uppercase tracking-[0.2em] font-black text-muted-foreground/80">
                Attachments
              </p>
            </div>
            <h2 className="text-6xl font-headline font-bold text-foreground tracking-tighter relative z-10">
              <AnimatedCounter value={attachmentCount} />
            </h2>
          </StatCard>

          {/* Card 4 – System status */}
          <StatCard
            index={3}
            className="bg-gradient-to-br from-card/60 to-background backdrop-blur-2xl border border-primary/20 rounded-[2rem] p-8 shadow-xl flex flex-col justify-center"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500" />
              </div>
              <p className="text-xs uppercase tracking-[0.2em] font-black text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]">
                System Online
              </p>
            </div>
            <p className="text-base font-medium text-muted-foreground leading-relaxed relative z-10">
              Engine is calibrated and ready for operations.
            </p>
          </StatCard>
        </motion.div>

        {/* ─── Documents Section ─── */}
        <motion.div variants={itemVariants} className="space-y-8">
          {/* Search + sort + filter bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card/40 backdrop-blur-2xl border border-border/40 p-4 rounded-[2rem] shadow-lg">
            {/* Search input */}
            <motion.div
              className="relative w-full md:max-w-md group"
              whileFocus={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                ref={searchRef}
                placeholder="Search… (press / to focus)"
                className="pl-14 pr-12 h-14 bg-background/60 border-border/50 rounded-2xl text-base font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary shadow-inner transition-all"
                value={search}
                onChange={handleSearchChange}
                aria-label="Search documents"
              />
              <AnimatePresence>
                {search.length > 0 && (
                  <motion.button
                    key="clear"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.14 }}
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear search"
                    type="button"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Right controls: sort + view toggle + filter */}
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-end">
              {/* Sort dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 px-4 gap-2 rounded-2xl bg-background/50 border-border/50 hover:bg-background/80 hover:border-primary/40 font-semibold text-sm whitespace-nowrap"
                  >
                    <SortAsc className="w-4 h-4 text-muted-foreground" />
                    {SORT_LABELS[sortOption]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 bg-background/95 backdrop-blur-3xl border border-border/40 p-1.5 shadow-2xl rounded-2xl"
                >
                  {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setSortOption(key)}
                      className={`cursor-pointer p-2.5 rounded-xl text-sm font-medium transition-colors ${
                        sortOption === key ? 'bg-primary/15 text-primary' : 'hover:bg-muted'
                      }`}
                    >
                      {label}
                      {sortOption === key && (
                        <span className="ml-auto text-primary text-xs">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Card / Compact toggle */}
              <div className="flex items-center gap-1 bg-background/50 border border-border/50 rounded-2xl p-1">
                <button
                  onClick={() => setViewMode('card')}
                  className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all ${
                    viewMode === 'card'
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-label="Card view"
                  title="Card view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all ${
                    viewMode === 'compact'
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-label="Compact view"
                  title="Compact list view"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>

              {/* Type filter */}
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-background/60 border border-border/50 flex items-center justify-center shrink-0 shadow-inner">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar items-center">
                  <Button
                    variant="outline"
                    onClick={() => handleFilterChange(null)}
                    className={`relative rounded-full h-10 px-5 text-sm font-bold whitespace-nowrap transition-all overflow-hidden ${
                      filterType === null
                        ? 'text-primary border-primary shadow-[0_0_12px_rgba(var(--primary),0.2)]'
                        : 'bg-background/50 border-border/50 hover:bg-background/80 hover:border-primary/50 text-muted-foreground'
                    }`}
                  >
                    {filterType === null && (
                      <motion.div
                        layoutId="active-filter"
                        className="absolute inset-0 bg-primary/10 -z-10"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    All
                  </Button>
                  {documentTypes.map((type) => (
                    <Button
                      key={type.id}
                      variant="outline"
                      onClick={() => handleFilterChange(type.id)}
                      className={`relative rounded-full h-10 px-5 text-sm font-bold whitespace-nowrap transition-all overflow-hidden ${
                        filterType === type.id
                          ? 'text-primary border-primary shadow-[0_0_12px_rgba(var(--primary),0.2)]'
                          : 'bg-background/50 border-border/50 hover:bg-background/80 hover:border-primary/50 text-muted-foreground'
                      }`}
                    >
                      {filterType === type.id && (
                        <motion.div
                          layoutId="active-filter"
                          className="absolute inset-0 bg-primary/10 -z-10"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Document list */}
          <DocumentList
            filteredDocs={filteredDocs}
            viewMode={viewMode}
            documents={documents}
            documentTypes={documentTypes}
          />
        </motion.div>
      </motion.div>

      {/* ─── Mobile FAB (quick create) ─── */}
      <AnimatePresence>
        {documentTypes.length > 0 && (
          <motion.div
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            className="fixed bottom-6 right-6 z-50 md:hidden"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-[0_0_28px_rgba(var(--primary),0.55)] flex items-center justify-center hover:shadow-[0_0_40px_rgba(var(--primary),0.75)] active:scale-95 transition-all"
                  aria-label="Create new document"
                >
                  <Plus className="w-7 h-7" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                className="w-56 bg-background/95 backdrop-blur-3xl border border-border/40 p-2 shadow-2xl rounded-2xl mb-2"
              >
                {documentTypes.map((type) => (
                  <DropdownMenuItem
                    key={type.id}
                    asChild
                    className="cursor-pointer hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary p-3 rounded-xl mb-1 text-base font-medium transition-colors"
                  >
                    <Link href={`/document/new?typeId=${type.id}`}>{type.label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-border/30 my-2" />
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer text-accent hover:bg-accent/10 p-3 rounded-xl"
                >
                  <Link href="/type/new" className="flex items-center gap-2 font-bold">
                    <Plus className="w-4 h-4" /> New Blueprint
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
