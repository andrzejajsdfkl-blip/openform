'use client';

import React from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Terminal, ShieldCheck, FileText, HardDrive, CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function SystemIntegrations() {
  const { toast } = useToast();

  const contextMenuVerbs = [
    {
      label: 'Otwórz (Open View)',
      verb: 'open',
      executable: 'OpenForm.exe',
      description: 'Opens the document in standard read-only view mode using the desktop UI.',
      badgeColor: 'bg-primary/10 text-primary border-primary/20',
      icon: '👁️',
    },
    {
      label: 'Edytuj (Edit Document)',
      verb: 'edit',
      executable: 'OpenFormEditor.exe',
      description: 'Launches the file in interactive edit mode inside the desktop application.',
      badgeColor: 'bg-accent/10 text-accent border-accent/20',
      icon: '✏️',
    },
    {
      label: 'Waliduj (Validate Schema)',
      verb: 'validate',
      executable: 'OpenFormValidator.exe',
      description: 'Validates schema compliance directly from Windows Explorer (returns validation console report).',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      icon: '✅',
    },
    {
      label: 'Eksportuj do PDF',
      verb: 'export',
      executable: 'OpenFormPdfExporter.exe',
      description: 'Instantly converts the selected .off file to a print-ready PDF in the same folder.',
      badgeColor: 'bg-green-500/10 text-green-400 border-green-500/20',
      icon: '📄',
    },
    {
      label: 'Importuj do serwera',
      verb: 'import',
      executable: 'openform-handler.bat',
      description: 'Triggers a local API request to ingest the offline file directly into the web application\'s vault.',
      badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      icon: '⬆️',
    }
  ];

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Copied to clipboard', description: text });
    });
  };

  const cliCommands = [
    {
      title: '1. Validate Offline Files',
      command: 'OpenFormValidator.exe <file_path.off>',
      description: 'Validates schema compliance and returns exit codes.',
      exitCodes: [
        { code: '0', desc: 'Schema is fully valid & healthy.' },
        { code: '1', desc: 'Validation fails (e.g. required field missing).' },
        { code: '2', desc: 'File not found or corrupted format.' },
      ]
    },
    {
      title: '2. Export to PDF',
      command: 'OpenFormPdfExporter.exe <file_path.off>',
      description: 'Instantly outputs a styled PDF replacing the .off suffix in the target directory.',
      exitCodes: []
    },
    {
      title: '3. Import to Web Vault',
      command: 'openform-handler.bat <file_path.off>',
      description: 'Sends the file to the running web instance on localhost:9002 via the import API.',
      exitCodes: []
    },
  ];

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
            System Integrations
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-2 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            Registry settings, Windows Explorer context menus, and terminal automation utilities.
          </p>
        </motion.div>

        {/* Status badges */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
          {[
            { label: '.off file association registered', ok: true },
            { label: 'Explorer context menu active', ok: true },
            { label: 'Local API handler configured', ok: true },
            { label: 'PDF exporter available', ok: true },
          ].map((status) => (
            <div key={status.label} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border ${status.ok ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {status.label}
            </div>
          ))}
        </motion.div>

        {/* Setup Info */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-xl hover:border-primary/40 transition-all duration-300">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-2xl border border-primary/20">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Registry Setup</CardTitle>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">Windows file association config</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>OpenForm registers deep Windows associations to provide seamless offline workflows. Configured automatically during installation:</p>
              <ul className="space-y-3 border-l-2 border-primary/20 pl-4">
                {[
                  { label: 'File Association', desc: '.off files map to the OpenForm.Document handler.' },
                  { label: 'Shell Submenu', desc: 'Adds a cascading OpenForm context menu in Windows Explorer.' },
                  { label: 'Local Ingestion', desc: 'Links the file import handler to port requests on the web dashboard.' },
                ].map((item) => (
                  <li key={item.label}>
                    <strong className="text-foreground">{item.label}:</strong>
                    <span className="ml-1 text-xs text-muted-foreground">{item.desc}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-xl hover:border-primary/40 transition-all duration-300">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-2xl border border-primary/20">
                <HardDrive className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Installation Paths</CardTitle>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">Filesystem integration roots</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { comment: '# User-level installation (Default fallback)', path: '%LOCALAPPDATA%\\Programs\\OpenForm\\' },
                { comment: '# Admin installation (If run as Administrator)', path: 'C:\\Program Files\\OpenForm\\' },
                { comment: '# Registry Root Branch', path: 'HKEY_CURRENT_USER\\Software\\Classes\\' },
              ].map((item, i) => (
                <div key={i} className="bg-background/50 border border-border/30 rounded-xl p-3 font-mono text-xs group relative">
                  <p className="text-muted-foreground/50">{item.comment}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-foreground font-semibold">{item.path}</p>
                    <button
                      onClick={() => copyCode(item.path)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-primary"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Explorer Context Menus */}
        <motion.div variants={itemVariants} className="space-y-5">
          <div>
            <h3 className="text-2xl font-bold text-foreground tracking-tight">Cascading Explorer Submenu</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Right-clicking a file with the <code className="bg-background/80 px-1.5 py-0.5 rounded font-mono border border-border/50 text-[11px] text-primary">.off</code> extension triggers this cascading menu:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {contextMenuVerbs.map((item, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group relative"
              >
                <Card className="h-full border-border/40 hover:border-primary/40 bg-card/40 backdrop-blur-xl shadow-md hover:shadow-[0_0_20px_rgba(var(--primary),0.1)] transition-all duration-300 flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className={`text-[10px] font-bold ${item.badgeColor}`}>
                        {item.executable}
                      </Badge>
                      <code className="text-[10px] text-muted-foreground/50 font-mono bg-background/40 border border-border/30 px-1.5 py-0.5 rounded">
                        verb:{item.verb}
                      </code>
                    </div>
                    <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      <span>{item.icon}</span>
                      {item.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground leading-relaxed pt-0 flex-1">
                    {item.description}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CLI Reference */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-xl">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-2xl border border-primary/20">
                <Terminal className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">CLI Usage &amp; Automation</CardTitle>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">Integrate into build scripts or CI/CD pipelines</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                All utilities support the following console syntax for scripting and automation workflows:
              </p>

              <div className="space-y-5">
                {cliCommands.map((cmd, i) => (
                  <div key={i} className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-foreground tracking-wider">{cmd.title}</h4>
                    <div className="bg-background/60 p-4 rounded-xl border border-border/40 group relative">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-primary font-bold font-mono text-sm">{cmd.command}</p>
                        <button
                          onClick={() => copyCode(cmd.command)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-primary"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{cmd.description}</p>
                      {cmd.exitCodes.length > 0 && (
                        <div className="pl-4 pt-2 border-t border-border/30 space-y-1">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground/50 tracking-wider mb-2">Exit Codes:</p>
                          {cmd.exitCodes.map((ec) => (
                            <p key={ec.code} className="font-mono text-xs">
                              <code className="text-foreground font-bold bg-background/60 px-1.5 rounded border border-border/30">{ec.code}</code>
                              <span className="text-muted-foreground ml-2">— {ec.desc}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
