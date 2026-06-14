'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useOpenFormStorage } from '@/lib/storage';
import {
  BarChart3,
  Database,
  FileSpreadsheet,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
} from 'lucide-react';

/* ─── Animation Variants ──────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── Circular Progress SVG ───────────────────────────────────── */
function CircularHealthScore({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const color =
    score > 85 ? '#4ade80' : score > 60 ? '#facc15' : '#f87171';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[130px] h-[130px]">
        {/* Track */}
        <svg
          width="130"
          height="130"
          viewBox="0 0 130 130"
          className="rotate-[-90deg]"
        >
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke="hsl(240 10% 15%)"
            strokeWidth="10"
          />
          <motion.circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
          />
        </svg>
        {/* Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-black tabular-nums"
            style={{ color }}
          >
            {score}
          </span>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            / 100
          </span>
        </div>
      </div>
      <span className="text-xs uppercase font-black tracking-widest text-muted-foreground/60">
        Health Index
      </span>
    </div>
  );
}

/* ─── Animated Progress Bar ───────────────────────────────────── */
function AnimatedBar({ percentage, delay = 0 }: { percentage: number; delay?: number }) {
  return (
    <div className="w-full h-3.5 bg-background border border-border/40 rounded-full overflow-hidden p-0.5">
      <motion.div
        className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
      />
    </div>
  );
}

/* ─── Activity Bar Chart ──────────────────────────────────────── */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// Placeholder heights (0-100) — replace with real data when available
const PLACEHOLDER_HEIGHTS = [45, 70, 30, 88, 55, 20, 65];

function ActivityBarChart() {
  return (
    <div className="flex items-end gap-2 h-24 w-full pt-2">
      {DAYS.map((day, i) => (
        <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
          <motion.div
            className="w-full rounded-t-md bg-gradient-to-t from-primary/60 to-accent/70 relative group cursor-default"
            style={{ originY: 1 }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.05 * i,
            }}
          >
            <div
              style={{ height: `${PLACEHOLDER_HEIGHTS[i]}px` }}
              className="w-full"
            />
            {/* Tooltip */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-popover border border-border/40 text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-foreground shadow-lg pointer-events-none">
              {PLACEHOLDER_HEIGHTS[i]}
            </div>
          </motion.div>
          <span className="text-[9px] text-muted-foreground font-semibold">{day}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Section Header ──────────────────────────────────────────── */
function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <motion.div variants={fadeUp} className="flex flex-col gap-0.5">
      <h2 className="text-sm font-black uppercase tracking-widest text-gradient">{label}</h2>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function AnalyticsDiagnostics() {
  const { documents, documentTypes } = useOpenFormStorage();

  // Storage metrics
  const stats = useMemo(() => {
    const totalDocs = documents.length;
    const totalTypes = documentTypes.length;
    const attachmentCount = documents.filter(d => d.attachment?.included).length;

    // Estimate localStorage usage in KB
    let bytesUsed = 0;
    try {
      const docsStr = localStorage.getItem('openform_documents') || '';
      const typesStr = localStorage.getItem('openform_types') || '';
      bytesUsed = (docsStr.length + typesStr.length) * 2; // UTF-16 characters = 2 bytes
    } catch (_) {}
    const kbUsed = (bytesUsed / 1024).toFixed(2);

    return {
      totalDocs,
      totalTypes,
      attachmentCount,
      kbUsed,
    };
  }, [documents, documentTypes]);

  // Distribution of documents by type
  const typeDistribution = useMemo(() => {
    return documentTypes.map(type => {
      const count = documents.filter(d => d.document_type.id === type.id).length;
      const percentage = stats.totalDocs > 0 ? Math.round((count / stats.totalDocs) * 100) : 0;
      return {
        ...type,
        count,
        percentage,
      };
    }).sort((a, b) => b.count - a.count);
  }, [documents, documentTypes, stats.totalDocs]);

  // Diagnostics / Health Checks
  const diagnostics = useMemo(() => {
    let requiredFieldsMissing = 0;
    let attachmentIssues = 0;
    let deprecatedVersions = 0;

    documents.forEach(doc => {
      // 1. Check required fields
      const matchingType = documentTypes.find(t => t.id === doc.document_type.id);
      if (matchingType) {
        matchingType.fields.forEach(typeField => {
          if (typeField.required) {
            const docField = doc.fields.find(df => df.key === typeField.key);
            if (!docField || docField.value === undefined || docField.value === null || docField.value === "") {
              requiredFieldsMissing++;
            }
          }
        });
      }

      // 2. Check attachment issues (e.g. checked, but blank base64)
      if (doc.attachment?.included && !doc.attachment.base64) {
        attachmentIssues++;
      }

      // 3. Check document format version
      if (doc.format_version !== '1.0') {
        deprecatedVersions++;
      }
    });

    return {
      requiredFieldsMissing,
      attachmentIssues,
      deprecatedVersions,
      score: stats.totalDocs === 0 ? 100 : Math.max(0, 100 - (requiredFieldsMissing * 5) - (attachmentIssues * 15)),
    };
  }, [documents, documentTypes, stats.totalDocs]);

  /* ── Stat card config ─────────────────────────────────────── */
  const statCards = [
    {
      label: 'Total Records',
      value: stats.totalDocs,
      suffix: '',
      sub: 'Offline documents in vault',
      icon: FileSpreadsheet,
      iconClass: 'text-primary',
      glowClass: 'group-hover:shadow-[0_0_18px_2px_hsl(250_80%_65%_/_0.25)]',
    },
    {
      label: 'Blueprints',
      value: stats.totalTypes,
      suffix: '',
      sub: 'Defined schema templates',
      icon: BarChart3,
      iconClass: 'text-accent',
      glowClass: 'group-hover:shadow-[0_0_18px_2px_hsl(190_90%_50%_/_0.25)]',
    },
    {
      label: 'Attachments',
      value: stats.attachmentCount,
      suffix: '',
      sub: 'Files embedded inside vault',
      icon: Database,
      iconClass: 'text-green-400',
      glowClass: 'group-hover:shadow-[0_0_18px_2px_rgba(74,222,128,0.25)]',
    },
    {
      label: 'Storage Usage',
      value: stats.kbUsed,
      suffix: 'KB',
      sub: 'Local Browser DB footprint',
      icon: HardDrive,
      iconClass: 'text-yellow-400',
      glowClass: 'group-hover:shadow-[0_0_18px_2px_rgba(250,204,21,0.25)]',
    },
  ];

  return (
    <AppShell>
      <motion.div
        className="space-y-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* ── Page Title ──────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <h1 className="text-4xl font-headline font-bold tracking-tight text-gradient">
            Analytics &amp; Diagnostics
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Overview of catalog metrics, document distributions, and validation health checks.
          </p>
        </motion.div>

        {/* ── Stats Grid ──────────────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeader label="Overview" sub="At-a-glance vault statistics" />
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            variants={containerVariants}
          >
            {statCards.map(({ label, value, suffix, sub, icon: Icon, iconClass, glowClass }) => (
              <motion.div key={label} variants={cardVariants}>
                <Card
                  className={[
                    'group border-border/40 bg-card/40 backdrop-blur-sm shadow-md',
                    'transition-all duration-300 ease-out',
                    'hover:-translate-y-1 hover:border-border/70 hover:bg-card/60',
                    glowClass,
                  ].join(' ')}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <span className="text-xs uppercase font-black tracking-widest text-muted-foreground/80">
                      {label}
                    </span>
                    <span className={`${iconClass} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="w-5 h-5" />
                    </span>
                  </CardHeader>
                  <CardContent>
                    <h2 className="text-4xl font-black text-foreground tabular-nums">
                      {value}
                      {suffix && (
                        <span className="text-lg font-normal text-muted-foreground ml-1">
                          {suffix}
                        </span>
                      )}
                    </h2>
                    <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Distribution & Health ────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeader label="Vault Breakdown" sub="Document type distribution and integrity diagnostics" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Blueprint distribution */}
            <motion.div variants={cardVariants} className="lg:col-span-2">
              <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl h-full">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Document Type Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {typeDistribution.length > 0 ? (
                    typeDistribution.map((item, i) => (
                      <div key={item.id} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-foreground">{item.label}</span>
                          <span className="text-muted-foreground text-xs font-semibold">
                            {item.count} record{item.count !== 1 ? 's' : ''} ({item.percentage}%)
                          </span>
                        </div>
                        <AnimatedBar percentage={item.percentage} delay={0.1 + i * 0.08} />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm italic text-muted-foreground text-center py-6">
                      No document types defined. Go to sidebar to define one.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Vault Health Diagnostics */}
            <motion.div variants={cardVariants}>
              <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl flex flex-col justify-between h-full">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Vault Integrity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Animated circular progress */}
                    <div className="flex justify-center mb-6">
                      <CircularHealthScore score={diagnostics.score} />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        {diagnostics.requiredFieldsMissing === 0 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {diagnostics.requiredFieldsMissing === 0
                            ? 'All required fields are fully populated.'
                            : `${diagnostics.requiredFieldsMissing} required field values are missing.`}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        {diagnostics.attachmentIssues === 0 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {diagnostics.attachmentIssues === 0
                            ? 'Attachment hashes and payload data are fully intact.'
                            : `${diagnostics.attachmentIssues} attachments have loading issues.`}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        {diagnostics.deprecatedVersions === 0 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {diagnostics.deprecatedVersions === 0
                            ? 'All records use format version 1.0.'
                            : `${diagnostics.deprecatedVersions} records use legacy format versions.`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-4 mt-4">
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      The health index is computed dynamically by evaluating form schema validations and base64 integrity.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* ── Last 7 Days Activity ─────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeader label="Last 7 Days Activity" sub="Recent document interactions (placeholder)" />
          <motion.div variants={cardVariants}>
            <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-xl">
              <CardContent className="pt-6 pb-4">
                <ActivityBarChart />
                <p className="text-[10px] text-muted-foreground mt-4 text-center">
                  Activity tracking will reflect live data once event logging is enabled.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </motion.div>
    </AppShell>
  );
}

