'use client';

import React, { useRef, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOpenFormStorage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { Database, Download, UploadCloud, Trash2, AlertOctagon, RefreshCcw, ShieldAlert, CheckCircle2, Info, Server, HardDrive, Layers, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function SettingsBackup() {
  const { documents, documentTypes, addDocument, upsertType } = useOpenFormStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);
  const [purgeStep, setPurgeStep] = useState(0); // 0 = idle, 1 = first confirm, 2 = second confirm

  // Estimate localStorage usage
  let bytesUsed = 0;
  try {
    const docsStr = localStorage.getItem('openform_documents') || '';
    const typesStr = localStorage.getItem('openform_types') || '';
    bytesUsed = (docsStr.length + typesStr.length) * 2;
  } catch (_) {}
  const kbUsed = (bytesUsed / 1024).toFixed(1);
  const storagePercent = Math.min((bytesUsed / (5 * 1024 * 1024)) * 100, 100); // 5MB limit approx

  // Backup localStorage
  const handleBackup = () => {
    try {
      const backupData = {
        backup_format: "OpenFormVaultBackup",
        version: 1,
        created_at: new Date().toISOString(),
        documents,
        documentTypes,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openform_vault_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: '✅ Backup Complete',
        description: `Exported ${documents.length} documents and ${documentTypes.length} blueprints.`,
      });
    } catch (err: any) {
      toast({
        title: 'Backup Failed',
        description: err.message || 'Failed to compile backup payload.',
        variant: 'destructive',
      });
    }
  };

  // Restore localStorage
  const handleRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoring(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const payload = JSON.parse(event.target?.result as string);
        if (payload.backup_format !== 'OpenFormVaultBackup') {
          throw new Error('Invalid format. Must be an OpenForm Vault Backup file.');
        }

        if (Array.isArray(payload.documentTypes)) {
          localStorage.setItem('openform_types', JSON.stringify(payload.documentTypes));
        }

        if (Array.isArray(payload.documents)) {
          localStorage.setItem('openform_documents', JSON.stringify(payload.documents));
        }

        toast({
          title: '✅ Restore Successful',
          description: `Loaded ${payload.documents?.length || 0} documents, ${payload.documentTypes?.length || 0} blueprints. Reloading...`,
        });

        setTimeout(() => { window.location.reload(); }, 1500);
      } catch (err: any) {
        toast({
          title: 'Restore Failed',
          description: err.message || 'Failed to process backup file.',
          variant: 'destructive',
        });
      } finally {
        setRestoring(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handlePurge = () => {
    if (purgeStep === 0) {
      setPurgeStep(1);
      return;
    }
    if (purgeStep === 1) {
      setPurgeStep(2);
      return;
    }
    // Step 2: final execution
    try {
      localStorage.removeItem('openform_documents');
      localStorage.removeItem('openform_types');
      toast({
        title: '🗑️ Database Purged',
        description: 'All records and blueprints have been removed. Reloading...',
      });
      setTimeout(() => { window.location.reload(); }, 1500);
    } catch (err: any) {
      toast({ title: 'Purge Failed', description: err.message, variant: 'destructive' });
    }
    setPurgeStep(0);
  };

  return (
    <AppShell>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-5xl font-headline font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60">
            Settings &amp; Backup
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-2 flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            Manage your local browser database, import/export backups, and reset configurations.
          </p>
        </motion.div>

        {/* Storage Overview */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Documents', value: documents.length, icon: FileText, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
            { label: 'Blueprints', value: documentTypes.length, icon: Layers, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
            { label: 'Storage Used', value: `${kbUsed} KB`, icon: HardDrive, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
            { label: 'Attachments', value: documents.filter(d => d.attachment?.included).length, icon: Database, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -3, scale: 1.02 }}
              className={`bg-card/40 backdrop-blur-xl border ${stat.border} rounded-2xl p-5 shadow-lg`}
            >
              <div className={`${stat.bg} p-2 rounded-xl w-fit mb-3 border ${stat.border}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Storage bar */}
        <motion.div variants={itemVariants} className="bg-card/30 backdrop-blur-xl border border-border/40 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground/70">LocalStorage Utilization</span>
            <span className="text-xs font-bold text-foreground">{kbUsed} KB / ~5,120 KB</span>
          </div>
          <div className="w-full h-2 bg-background/60 rounded-full overflow-hidden border border-border/40">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${storagePercent}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-2">Browser localStorage has a ~5MB limit. OpenForm uses minimal storage space.</p>
        </motion.div>

        {/* Backup / Restore */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Backup Database */}
          <motion.div whileHover={{ y: -3 }} className="group">
            <Card className="h-full border-border/40 bg-card/40 backdrop-blur-xl shadow-xl hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(var(--primary),0.1)] flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Export Vault Database</CardTitle>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">Download full backup as JSON</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Download your entire vault (blueprints, templates, fields, and embedded files) as a single portable JSON backup. Keep this safe for redundancy.
                </p>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary">
                      {documents.length} documents
                    </Badge>
                    <Badge variant="outline" className="text-[10px] bg-accent/5 border-accent/20 text-accent">
                      {documentTypes.length} blueprints
                    </Badge>
                  </div>
                  <Button
                    onClick={handleBackup}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-12 px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Backup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Restore Database */}
          <motion.div whileHover={{ y: -3 }} className="group">
            <Card className="h-full border-border/40 bg-card/40 backdrop-blur-xl shadow-xl hover:border-accent/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(var(--accent),0.1)] flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="bg-accent/10 p-3 rounded-2xl border border-accent/20 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
                  <UploadCloud className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Restore Vault Backup</CardTitle>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">Load from a .json backup file</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Restore documents and blueprints from a previously downloaded vault backup file.
                  </p>
                  <div className="mt-3 flex items-start gap-2 bg-destructive/5 border border-destructive/20 rounded-xl p-3">
                    <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive/80 leading-relaxed">
                      Warning: This will <strong>overwrite all current data</strong> in your local browser vault.
                    </p>
                  </div>
                </div>

                <div>
                  <input type="file" ref={fileInputRef} onChange={handleRestoreUpload} accept=".json" className="hidden" />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={restoring}
                    variant="outline"
                    className="w-full border-accent/30 hover:bg-accent/10 hover:border-accent/60 text-accent font-bold rounded-xl h-12 px-6 transition-all"
                  >
                    {restoring ? (
                      <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Restoring...</>
                    ) : (
                      <><UploadCloud className="w-4 h-4 mr-2" /> Select Backup File</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* System Info */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/40 bg-card/30 backdrop-blur-xl shadow-md">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
                <Info className="w-5 h-5 text-blue-400" />
              </div>
              <CardTitle className="text-lg font-bold">System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                {[
                  { label: 'Engine Version', value: '1.0.0' },
                  { label: 'Storage Driver', value: 'localStorage' },
                  { label: 'Format', value: 'OpenFormVaultBackup v1' },
                  { label: 'Environment', value: 'Browser (Offline)' },
                  { label: 'Persistence', value: 'Session-persistent' },
                  { label: 'Max Storage', value: '~5 MB (browser limit)' },
                ].map((item) => (
                  <div key={item.label} className="bg-background/40 border border-border/30 rounded-xl p-3">
                    <p className="text-muted-foreground/60 uppercase tracking-widest text-[9px] font-black mb-1">{item.label}</p>
                    <p className="text-foreground font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div variants={itemVariants}>
          <Card className="border-red-500/30 bg-red-500/5 backdrop-blur-xl shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
            <CardHeader className="flex flex-row items-center gap-3 relative z-10">
              <div className="bg-red-500/15 p-2.5 rounded-xl border border-red-500/30">
                <AlertOctagon className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-red-400">Danger Zone</CardTitle>
                <p className="text-[11px] text-red-400/60 mt-0.5">Irreversible actions below</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-5 bg-red-500/5 border border-red-500/20 rounded-2xl">
                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-foreground">Purge Local Browser Vault</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                    Permanently deletes all document types, blueprint schemas, and saved records from local browser storage. This resets the workspace completely.
                  </p>
                  {purgeStep > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mt-3"
                    >
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-xs text-red-400 font-bold">
                        {purgeStep === 1 ? 'Are you sure? This will delete ALL data permanently.' : '⚠️ FINAL WARNING: Click again to confirm total purge. This cannot be undone.'}
                      </p>
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {purgeStep > 0 && (
                    <Button
                      onClick={() => setPurgeStep(0)}
                      variant="outline"
                      className="border-border/40 text-muted-foreground hover:bg-background rounded-xl h-12 px-5"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={handlePurge}
                    variant="destructive"
                    className={`font-bold rounded-xl h-12 px-6 shrink-0 gap-2 transition-all ${purgeStep === 0 ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/10' : purgeStep === 1 ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20' : 'bg-red-700 hover:bg-red-800 shadow-lg shadow-red-500/30 animate-pulse'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                    {purgeStep === 0 ? 'Purge All Data' : purgeStep === 1 ? 'Confirm Purge' : 'FINAL CONFIRM'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
