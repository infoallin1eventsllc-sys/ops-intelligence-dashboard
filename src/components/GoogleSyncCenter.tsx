import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  FileSpreadsheet, 
  LogOut, 
  RefreshCw, 
  CheckCircle, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle,
  Mail,
  Send,
  FileText,
  Plus,
  Trash2,
  ClipboardList,
  Lightbulb,
  FileEdit,
  Pin,
  CheckSquare,
  Square,
  FileCode
} from 'lucide-react';
import { 
  googleSignIn, 
  logout, 
  initAuth, 
  exportDataToGoogleSheets, 
  syncEventToGoogleCalendar,
  sendGmailEmail,
  listGmailMessages,
  getGmailMessageDetails,
  createGoogleDoc,
  listGoogleTasks,
  createGoogleTask,
  listGoogleKeepNotes,
  createGoogleKeepNote
} from '../utils/workspace';
import { Event, Client, Vendor } from '../types';
import { User } from 'firebase/auth';

interface GoogleSyncCenterProps {
  events: Event[];
  clients: Client[];
  vendors: Vendor[];
  addActivity?: (message: string, type?: 'success' | 'warning' | 'info') => void;
  onTokenChange?: (token: string | null) => void;
}

type SyncTab = 'sheets' | 'gmail' | 'docs' | 'tasks' | 'keep';

// Local Note type for Keep fallback
interface LocalNote {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  timestamp: string;
}

export default function GoogleSyncCenter({
  events,
  clients,
  vendors,
  addActivity,
  onTokenChange
}: GoogleSyncCenterProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<SyncTab>('sheets');

  // Sheets / Calendar States
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState<string | null>(null);
  const [syncedEventsCount, setSyncedEventsCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Gmail States
  const [gmailMessages, setGmailMessages] = useState<any[]>([]);
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Docs States
  const [docTitle, setDocTitle] = useState('H1 2026 Boardroom Briefing');
  const [docBody, setDocBody] = useState('');
  const [selectedDocTemplate, setSelectedDocTemplate] = useState('');
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [createdDocUrl, setCreatedDocUrl] = useState<string | null>(null);

  // Tasks States
  const [googleTasks, setGoogleTasks] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Keep States
  const [keepNotes, setKeepNotes] = useState<any[]>([]);
  const [isLoadingKeep, setIsLoadingKeep] = useState(false);
  const [keepError, setKeepError] = useState<string | null>(null);
  const [newKeepTitle, setNewKeepTitle] = useState('');
  const [newKeepContent, setNewKeepContent] = useState('');
  const [isCreatingKeepNote, setIsCreatingKeepNote] = useState(false);
  
  // Keep Local Fallback State
  const [localNotes, setLocalNotes] = useState<LocalNote[]>([
    {
      id: '1',
      title: '📌 Boardroom VIP Setup Details',
      content: 'Confirm with catering for the Executive Summit on 2026-07-15. Need audio system redundancy check.',
      pinned: true,
      timestamp: 'Today, 8:15 AM'
    },
    {
      id: '2',
      title: '⚠️ Vendor Rate Negotiation',
      content: 'Negotiate the 10% volume discount with Soundwave Media. Currently waiting on updated contract sheet.',
      pinned: false,
      timestamp: 'Yesterday'
    }
  ]);

  // Sync state on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        onTokenChange?.(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        onTokenChange?.(null);
      }
    );
    return () => unsubscribe();
  }, [onTokenChange]);

  // Load contextual data based on active tab
  useEffect(() => {
    if (!token) return;
    if (activeTab === 'gmail') {
      fetchGmailInbox();
    } else if (activeTab === 'tasks') {
      fetchTasks();
    } else if (activeTab === 'keep') {
      fetchKeepNotes();
    }
  }, [activeTab, token]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        onTokenChange?.(result.accessToken);
        addActivity?.(`Connected successfully to Google Workspace with active secure scopes.`, 'success');
      }
    } catch (err: any) {
      console.error('Google Auth Failed:', err);
      addActivity?.(`Workspace connection error: ${err.message || 'Verification cancelled'}`, 'warning');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      onTokenChange?.(null);
      setSheetsUrl(null);
      setSyncedEventsCount(0);
      setLastSyncTime(null);
      setGmailMessages([]);
      setGoogleTasks([]);
      setKeepNotes([]);
      setCreatedDocUrl(null);
      addActivity?.('Disconnected Google Workspace securely from current sandbox session.', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // ----------------- SHEET & CALENDAR LOGIC -----------------
  const handleExportSheets = async () => {
    if (!token) return;
    setIsExportingSheets(true);
    try {
      const result = await exportDataToGoogleSheets(events, clients, vendors, token);
      if (result.success && result.url) {
        setSheetsUrl(result.url);
        addActivity?.(`Successfully exported Ledger, Clients, and Vendors to Google Sheets.`, 'success');
      } else {
        throw new Error(result.error || 'Unknown upload variance');
      }
    } catch (err: any) {
      addActivity?.(`Google Sheets export failed: ${err.message}`, 'warning');
    } finally {
      setIsExportingSheets(false);
    }
  };

  const handleSyncAllCalendar = async () => {
    if (!token) return;
    const upcomingEvents = events.filter(e => e.status === 'Upcoming');
    if (upcomingEvents.length === 0) {
      addActivity?.('No upcoming events scheduled to sync to Google Calendar.', 'info');
      return;
    }

    const confirmSync = window.confirm(`This will bulk sync all ${upcomingEvents.length} upcoming corporate/private events to your primary Google Calendar. Proceed?`);
    if (!confirmSync) return;

    setIsSyncingCalendar(true);
    let successCount = 0;

    try {
      for (const ev of upcomingEvents) {
        const result = await syncEventToGoogleCalendar(ev, token);
        if (result.success) {
          successCount++;
        }
      }
      setSyncedEventsCount(successCount);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      addActivity?.(`Successfully synchronized ${successCount} events to Google Calendar.`, 'success');
    } catch (err: any) {
      addActivity?.(`Google Calendar sync encountered errors: ${err.message}`, 'warning');
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // ----------------- GMAIL LOGIC -----------------
  const fetchGmailInbox = async () => {
    if (!token) return;
    setIsLoadingGmail(true);
    setGmailError(null);
    try {
      const messages = await listGmailMessages(token);
      const detailedMessages = [];
      // Fetch details of top 3 messages
      for (const msg of messages.slice(0, 3)) {
        try {
          const detail = await getGmailMessageDetails(msg.id, token);
          const headers = detail.payload?.headers || [];
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
          const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
          const date = headers.find((h: any) => h.name === 'Date')?.value || '';
          detailedMessages.push({
            id: msg.id,
            subject,
            from,
            date: new Date(date).toLocaleDateString(),
            snippet: detail.snippet
          });
        } catch (detailErr) {
          console.error(`Error fetching Gmail detail ${msg.id}:`, detailErr);
        }
      }
      setGmailMessages(detailedMessages);
    } catch (err: any) {
      console.error(err);
      setGmailError(err.message || 'Failed to sync Inbox');
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const applyEmailTemplate = (templateName: string) => {
    setSelectedTemplate(templateName);
    if (!templateName) return;

    const matchedClient = clients.find(c => c.email === emailTo) || clients[0];
    const clientName = matchedClient ? matchedClient.name : '[Client Company]';

    switch (templateName) {
      case 'briefing':
        setEmailSubject(`Ops Intelligence: H1 performance update for ${clientName}`);
        setEmailBody(`<h3>Operations Performance Briefing</h3>
<p>Dear Event stakeholders at <strong>${clientName}</strong>,</p>
<p>We are pleased to report that your upcoming corporate operations are on track. Our active budget optimization has protected event profitability with an optimized vendor distribution index of 81.8%.</p>
<p>Should you wish to review specific SLAs or event schedules, please consult our secure live synchronized Sheets workspace.</p>
<p>Sincerely,<br/><strong>Ops Intelligence Executive Team</strong></p>`);
        break;
      case 'escalation':
        setEmailSubject(`URGENT: Service SLA compliance check required - Action Required`);
        setEmailBody(`<h3>Vendor Service SLA Compliance Escalation</h3>
<p>Attention: operations coordinator,</p>
<p>This is an automated notification from our tracking ledger regarding a detected performance breach. Recent scheduling and equipment coordination lags have compromised key service level benchmarks.</p>
<p>Please respond to coordinate an immediate remediation session to prevent contract penalty indexing.</p>
<p>Respectfully,<br/><strong>Ops Analytics Assurance Group</strong></p>`);
        break;
      case 'followup':
        setEmailSubject(`Outstanding Invoices Status & H1 Review`);
        setEmailBody(`<h3>Outstanding Ledger & Balance Notice</h3>
<p>To the Billing Operations coordinator,</p>
<p>We are completing our mid-year accounting synchronization for outstanding event contracts. Please review your balance logs at your earliest convenience to maintain an active, un-flagged contract status.</p>
<p>Thank you for your business.</p>
<p>Sincerely,<br/><strong>Financial Audit Liaison</strong></p>`);
        break;
      default:
        break;
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !emailTo || !emailSubject || !emailBody) {
      alert('Please fill out all email dispatch parameters.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const result = await sendGmailEmail(emailTo, emailSubject, emailBody, token);
      if (result.success) {
        addActivity?.(`Gmail: Sent dispatch to "${emailTo}" successfully! (Msg ID: ${result.messageId})`, 'success');
        setEmailSubject('');
        setEmailBody('');
        setSelectedTemplate('');
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      addActivity?.(`Gmail dispatch error: ${err.message}`, 'warning');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // ----------------- DOCS LOGIC -----------------
  const applyDocTemplate = (template: string) => {
    setSelectedDocTemplate(template);
    if (!template) return;

    switch (template) {
      case 'ops_briefing':
        setDocTitle('Executive Ops Intelligence Briefing H1 2026');
        setDocBody(`OPS INTELLIGENCE BOARD - EXECUTIVE BRIEFING H1 2026
============================================================
COMPILED ON: ${new Date().toLocaleDateString()}

I. EXECUTIVE PERFORMANCE STATEMENT
-----------------------------------
Ops Intelligence has realized sustained margin velocity across the event portfolio. Dynamic mitigation of supply-chain overruns paired with structured client CRM updates has protected recurring contract pools. Realized net margins stand at 36.1% on a total realized volume of $451,500.

II. CURRENT STRATEGIC INITIATIVES
----------------------------------
1. Vendor SLA Restructuring: Migrating variance-heavy audio/visual suppliers to pre-negotiated SLAs to cap operational cost variance at a target max of +5%.
2. Customer Risk Mitigation: Restructured retention packages for enterprise segments currently designated at medium or high retention risk.
3. Pricing Adjustments: Implemented 1.25x pricing index triggers on private packages exceeding 300 guest capacity limits.`);
        break;
      case 'vendor_sla':
        setDocTitle('Standard Vendor Service Level Agreement (SLA)');
        setDocBody(`VENDOR SLA & QUALITY ASSURANCE AGREEMENT
==========================================

This agreement outlines the operational delivery benchmarks required by vendors contracted under the Ops Intelligence network.

1. TIMELINESS & SETUP MILESTONES
- On-Time Arrival Rate: Vendor must maintain a minimum 95% on-time arrival rate.
- Setup Window: All dynamic lighting and sound layouts must be completed 2.5 hours prior to the official event launch.

2. PENALTIES & REMEDIATION
- Any setup delay exceeding 45 minutes will trigger a automatic 12% pricing index penalty.
- Accumulation of 2 or more flagged service breaches in a calendar quarter will trigger manual performance contract review.`);
        break;
      default:
        break;
    }
  };

  const handleCreateDoc = async () => {
    if (!token) return;
    setIsCreatingDoc(true);
    try {
      const result = await createGoogleDoc(docTitle, docBody, token);
      if (result.success && result.url) {
        setCreatedDocUrl(result.url);
        addActivity?.(`Google Docs: Created "${docTitle}" successfully!`, 'success');
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      addActivity?.(`Google Docs creation error: ${err.message}`, 'warning');
    } finally {
      setIsCreatingDoc(false);
    }
  };

  // ----------------- TASKS LOGIC -----------------
  const fetchTasks = async () => {
    if (!token) return;
    setIsLoadingTasks(true);
    setTasksError(null);
    try {
      const tasks = await listGoogleTasks(token);
      setGoogleTasks(tasks);
    } catch (err: any) {
      console.error(err);
      setTasksError(err.message || 'Failed to list tasks.');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newTaskTitle) return;
    setIsAddingTask(true);
    try {
      await createGoogleTask(newTaskTitle, newTaskNotes, newTaskDue || null, token);
      addActivity?.(`Google Tasks: Added task "${newTaskTitle}" successfully!`, 'success');
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDue('');
      fetchTasks();
    } catch (err: any) {
      addActivity?.(`Google Tasks error: ${err.message}`, 'warning');
    } finally {
      setIsAddingTask(false);
    }
  };

  // ----------------- KEEP LOGIC & LOCAL FALLBACK -----------------
  const fetchKeepNotes = async () => {
    if (!token) return;
    setIsLoadingKeep(true);
    setKeepError(null);
    try {
      const notes = await listGoogleKeepNotes(token);
      setKeepNotes(notes);
    } catch (err: any) {
      console.error('Keep Fetch Error:', err);
      // As Keep API is highly enterprise-restricted, we fallback gracefully without breaking.
      setKeepError('Note: Google Keep API is restricted to Google Workspace Enterprise domains. Sandbox Offline Notes initialized.');
    } finally {
      setIsLoadingKeep(false);
    }
  };

  const handleAddKeepNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeepTitle && !newKeepContent) return;

    if (token && !keepError) {
      // Try sending to Google Keep API
      setIsCreatingKeepNote(true);
      try {
        await createGoogleKeepNote(newKeepTitle, newKeepContent, token);
        addActivity?.(`Google Keep: Synced note "${newKeepTitle}" successfully.`, 'success');
        setNewKeepTitle('');
        setNewKeepContent('');
        fetchKeepNotes();
        return;
      } catch (err: any) {
        console.warn('Keep API rejected create. Defaulting to local sandbox:', err);
      } finally {
        setIsCreatingKeepNote(false);
      }
    }

    // Local Fallback Path
    const newNote: LocalNote = {
      id: Date.now().toString(),
      title: newKeepTitle || 'Untitled Note',
      content: newKeepContent,
      pinned: false,
      timestamp: 'Just now'
    };
    setLocalNotes(prev => [newNote, ...prev]);
    setNewKeepTitle('');
    setNewKeepContent('');
    addActivity?.(`Sandbox Notes: Cached local briefing note "${newNote.title}".`, 'info');
  };

  const deleteLocalNote = (id: string) => {
    setLocalNotes(prev => prev.filter(n => n.id !== id));
    addActivity?.('Sandbox Notes: Dismissed cached briefing note.', 'info');
  };

  return (
    <div id="google-sync-center-card" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Component Title & Connection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1 bg-indigo-50 text-indigo-600 rounded">
              <ShieldCheck className="h-4 w-4" />
            </span>
            Google Workspace Sync Hub
          </h3>
          <p className="text-xs text-slate-500">
            Secure cross-app integrations: Calendar, Sheets, Gmail, Docs, Tasks, and Keep.
          </p>
        </div>

        {user ? (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Google Account'} 
                  className="w-5 h-5 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-indigo-500 text-[10px] text-white flex items-center justify-center font-bold">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                {user.displayName || user.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
              title="Disconnect Workspace"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            {isLoggingIn ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.45 1.635l2.45-2.45C17.275 1.54 14.92.5 12.24.5c-5.8 0-10.5 4.7-10.5 10.5s4.7 10.5 10.5 10.5c5.5 0 10.5-3.9 10.5-10.5 0-.715-.08-1.415-.225-2.115H12.24z" />
              </svg>
            )}
            <span>Connect Google Workspace</span>
          </button>
        )}
      </div>

      {user ? (
        <div className="space-y-4">
          {/* Sub-Tab Navigation */}
          <div className="flex flex-wrap gap-1 border-b border-slate-100 pb-2">
            <button
              onClick={() => setActiveTab('sheets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'sheets' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Sheets & Calendar</span>
            </button>
            <button
              onClick={() => setActiveTab('gmail')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'gmail' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Gmail Dispatch</span>
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'docs' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Docs Exporter</span>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'tasks' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Google Tasks</span>
            </button>
            <button
              onClick={() => setActiveTab('keep')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'keep' 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Pin className="h-3.5 w-3.5" />
              <span>Keep Notes</span>
            </button>
          </div>

          {/* Active Tab View Window */}
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 min-h-[220px]">
            <AnimatePresence mode="wait">
              {activeTab === 'sheets' && (
                <motion.div
                  key="sheets-view"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {/* Sheets Card */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                        Google Sheets Ledger
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Generate and push an interactive multi-tab ledger with your live database records: **Events Ledger**, **Client List**, and **Vendor Quality Control**.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={handleExportSheets}
                        disabled={isExportingSheets}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                      >
                        {isExportingSheets ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        <span>Export Workbook</span>
                      </button>

                      {sheetsUrl && (
                        <a
                          href={sheetsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold rounded border border-emerald-200 flex items-center gap-1 transition-all"
                        >
                          <span>Open Sheet</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Calendar Card */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                        Google Calendar
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Bulk synchronize upcoming boardroom, Private, and Corporate events directly to your main Google Calendar with automated venue detail packets.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <button
                        onClick={handleSyncAllCalendar}
                        disabled={isSyncingCalendar}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                      >
                        {isSyncingCalendar ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Calendar className="h-3 w-3" />
                        )}
                        <span>Bulk Sync Events</span>
                      </button>

                      {syncedEventsCount > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100">
                          <CheckCircle className="h-3 w-3 text-indigo-500" />
                          <span>Synced {syncedEventsCount} events ({lastSyncTime})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'gmail' && (
                <motion.div
                  key="gmail-view"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Inbox View */}
                    <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                          Recent Communications
                        </h4>
                        <button
                          onClick={fetchGmailInbox}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                          title="Refresh Inbox"
                        >
                          <RefreshCw className={`h-3 w-3 ${isLoadingGmail ? 'animate-spin' : ''}`} />
                        </button>
                      </div>

                      {isLoadingGmail ? (
                        <div className="space-y-2 py-4">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                        </div>
                      ) : gmailError ? (
                        <div className="p-3 text-[10px] text-amber-700 bg-amber-50 rounded border border-amber-100 leading-normal">
                          {gmailError}. (Please confirm your Gmail API scopes are validated).
                        </div>
                      ) : gmailMessages.length === 0 ? (
                        <div className="text-center py-6 text-[11px] text-slate-400">
                          No recent inbox messages loaded. Click refresh to query.
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                          {gmailMessages.map(msg => (
                            <div key={msg.id} className="p-2 bg-slate-50 rounded border border-slate-100 space-y-1 hover:bg-slate-100/70 transition-colors">
                              <div className="flex justify-between items-start text-[10px]">
                                <span className="font-bold text-slate-700 truncate max-w-[100px]">{msg.from}</span>
                                <span className="text-slate-400 shrink-0 font-mono">{msg.date}</span>
                              </div>
                              <p className="text-[10px] font-bold text-slate-900 truncate">{msg.subject}</p>
                              <p className="text-[9px] text-slate-500 line-clamp-2">{msg.snippet}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Compose and Dispatch */}
                    <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200">
                      <form onSubmit={handleSendEmail} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                            Email Dispatcher
                          </h4>
                          {/* Template Shortcuts */}
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => applyEmailTemplate('briefing')}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                                selectedTemplate === 'briefing' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              Digest
                            </button>
                            <button
                              type="button"
                              onClick={() => applyEmailTemplate('escalation')}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                                selectedTemplate === 'escalation' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              SLA Breach
                            </button>
                            <button
                              type="button"
                              onClick={() => applyEmailTemplate('followup')}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                                selectedTemplate === 'followup' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              Invoicing
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">To (Client Email)</label>
                            <select
                              value={emailTo}
                              onChange={e => {
                                setEmailTo(e.target.value);
                                if (selectedTemplate) applyEmailTemplate(selectedTemplate);
                              }}
                              className="w-full text-xs p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 bg-white outline-hidden"
                              required
                            >
                              <option value="">-- Select Client Recipient --</option>
                              {clients.map(c => (
                                <option key={c.id} value={c.email}>{c.name} ({c.email})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Subject Line</label>
                            <input
                              type="text"
                              value={emailSubject}
                              onChange={e => setEmailSubject(e.target.value)}
                              placeholder="e.g. Operations Performance Digest"
                              className="w-full text-xs p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-hidden"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Message Body (HTML Allowed)</label>
                          <textarea
                            value={emailBody}
                            onChange={e => setEmailBody(e.target.value)}
                            rows={4}
                            className="w-full text-xs p-2 border border-slate-200 rounded font-sans focus:ring-1 focus:ring-indigo-500 outline-hidden"
                            placeholder="Type client communication update here..."
                            required
                          />
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="submit"
                            disabled={isSendingEmail || !emailTo}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
                          >
                            {isSendingEmail ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            <span>Send via Gmail</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'docs' && (
                <motion.div
                  key="docs-view"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                          Google Docs Briefing Exporter
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Compile comprehensive executive briefings or contract structures and instantly build a Google Doc.
                        </p>
                      </div>

                      {/* Template selectors */}
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => applyDocTemplate('ops_briefing')}
                          className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                            selectedDocTemplate === 'ops_briefing' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Executive Briefing
                        </button>
                        <button
                          type="button"
                          onClick={() => applyDocTemplate('vendor_sla')}
                          className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                            selectedDocTemplate === 'vendor_sla' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Vendor SLA
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-1 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Document Title</label>
                        <input
                          type="text"
                          value={docTitle}
                          onChange={e => setDocTitle(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded font-semibold focus:ring-1 focus:ring-indigo-500 outline-hidden"
                          placeholder="e.g. Performance Briefing"
                        />
                      </div>
                      <div className="md:col-span-3 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Document Content (Raw Text / Markdown)</label>
                        <textarea
                          value={docBody}
                          onChange={e => setDocBody(e.target.value)}
                          rows={6}
                          className="w-full text-xs p-2 border border-slate-200 rounded font-mono focus:ring-1 focus:ring-indigo-500 outline-hidden"
                          placeholder="Write document draft or select an active template on the top right..."
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        {createdDocUrl && (
                          <a
                            href={createdDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded border border-emerald-200 transition-colors"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Open Created Doc</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      <button
                        onClick={handleCreateDoc}
                        disabled={isCreatingDoc || !docBody}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded shadow-xs hover:shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                      >
                        {isCreatingDoc ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileCode className="h-3.5 w-3.5" />
                        )}
                        <span>Export as Google Doc</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'tasks' && (
                <motion.div
                  key="tasks-view"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Live Task List */}
                    <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                          Live Google Tasks
                        </h4>
                        <button
                          onClick={fetchTasks}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                          title="Refresh Tasks"
                        >
                          <RefreshCw className={`h-3 w-3 ${isLoadingTasks ? 'animate-spin' : ''}`} />
                        </button>
                      </div>

                      {isLoadingTasks ? (
                        <div className="space-y-2 py-4">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                        </div>
                      ) : tasksError ? (
                        <div className="p-3 text-[10px] text-amber-700 bg-amber-50 rounded border border-amber-100 leading-normal">
                          {tasksError}. (Make sure Tasks API is initialized in project settings).
                        </div>
                      ) : googleTasks.length === 0 ? (
                        <div className="text-center py-6 text-[11px] text-slate-400 space-y-2">
                          <p>No active items on your Google Tasks list.</p>
                          <p className="text-[9px]">Tasks added on the right appear here instantly!</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto">
                          {googleTasks.map(task => (
                            <div 
                              key={task.id} 
                              className={`p-2 rounded border transition-colors flex items-start gap-2 ${
                                task.status === 'completed' ? 'bg-slate-50/70 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:bg-slate-50'
                              }`}
                            >
                              <div className="pt-0.5 text-slate-400">
                                {task.status === 'completed' ? (
                                  <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Square className="h-3.5 w-3.5 text-slate-300" />
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <p className={`text-xs font-semibold text-slate-800 ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                                  {task.title}
                                </p>
                                {task.notes && (
                                  <p className="text-[10px] text-slate-500 line-clamp-1">{task.notes}</p>
                                )}
                                {task.due && (
                                  <span className="text-[8px] font-bold text-rose-500 bg-rose-50 px-1 py-0.5 rounded uppercase">
                                    Due: {new Date(task.due).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Tasks & Operational Suggestions */}
                    <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                      {/* Suggestion list */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                          <Lightbulb className="h-3 w-3 text-amber-500" />
                          Recommended Operations Action Items
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div 
                            onClick={() => {
                              setNewTaskTitle('⚠️ Resolve Matrix Lights SLA compliance discrepancy');
                              setNewTaskNotes('Coordinate 10% volume discount rebate audit with account executives due to dispatch variance logs.');
                            }}
                            className="p-2 border border-dashed border-amber-200 hover:border-amber-400 bg-amber-50/30 rounded-lg text-left cursor-pointer transition-colors"
                          >
                            <span className="text-[10px] font-bold text-amber-700 uppercase block font-mono">Vendor Breach</span>
                            <span className="text-[11px] font-semibold text-slate-700 line-clamp-1">Mitigate Matrix Lights audio overrun</span>
                          </div>
                          <div 
                            onClick={() => {
                              setNewTaskTitle('📞 High Risk: Executive Outreach for SWYFT Logistics churn risk');
                              setNewTaskNotes('Reach out directly to logistics partners to renegotiate delivery buffers ahead of Q3 private events.');
                            }}
                            className="p-2 border border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 rounded-lg text-left cursor-pointer transition-colors"
                          >
                            <span className="text-[10px] font-bold text-indigo-700 uppercase block font-mono">Retention Mitigation</span>
                            <span className="text-[11px] font-semibold text-slate-700 line-clamp-1">Outreach SWYFT retention packages</span>
                          </div>
                        </div>
                      </div>

                      {/* Manual Task Creator */}
                      <form onSubmit={handleAddTask} className="border-t border-slate-100 pt-3 space-y-3">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                          Schedule Task on Google
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="sm:col-span-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Task Title</label>
                            <input
                              type="text"
                              value={newTaskTitle}
                              onChange={e => setNewTaskTitle(e.target.value)}
                              placeholder="e.g. Audit event cost margins"
                              className="w-full text-xs p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-hidden"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Due Date</label>
                            <input
                              type="date"
                              value={newTaskDue}
                              onChange={e => setNewTaskDue(e.target.value)}
                              className="w-full text-xs p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-hidden"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Notes / Action Details</label>
                          <textarea
                            value={newTaskNotes}
                            onChange={e => setNewTaskNotes(e.target.value)}
                            rows={2}
                            placeholder="Add strategic guidelines or context..."
                            className="w-full text-xs p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-hidden"
                          />
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="submit"
                            disabled={isAddingTask || !newTaskTitle}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
                          >
                            {isAddingTask ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                            <span>Schedule Task</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'keep' && (
                <motion.div
                  key="keep-view"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  {/* Graceful keep warning */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 leading-normal flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 pt-0.5" />
                    <div>
                      <strong>Google Keep API Notice:</strong> Keep API write operations require restricted Google Workspace Enterprise directory configurations. To provide a smooth developer environment, we automatically enable our high-yield offline <strong>Local Keep Workspace</strong> if your account lacks enterprise credentials!
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Add note card */}
                    <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200">
                      <form onSubmit={handleAddKeepNote} className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                          Draft Strategic Note
                        </h4>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Note Title</label>
                          <input
                            type="text"
                            value={newKeepTitle}
                            onChange={e => setNewKeepTitle(e.target.value)}
                            placeholder="e.g. 📌 Music Venue Redundancies"
                            className="w-full text-xs p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Note Content</label>
                          <textarea
                            value={newKeepContent}
                            onChange={e => setNewKeepContent(e.target.value)}
                            rows={4}
                            placeholder="Write setup instructions, checklist matrices, or audit briefs..."
                            className="w-full text-xs p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-hidden"
                            required
                          />
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="submit"
                            disabled={isCreatingKeepNote || !newKeepContent}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Save Note</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Notes grid */}
                    <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                        Active Strategic Board Notes
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                        {localNotes.map(note => (
                          <div 
                            key={note.id} 
                            className="p-3 rounded-lg border border-yellow-100 bg-yellow-50/45 hover:bg-yellow-50 hover:shadow-xs transition-all relative flex flex-col justify-between group space-y-2"
                          >
                            <div className="space-y-1">
                              <div className="flex justify-between items-start gap-4">
                                <h5 className="text-xs font-bold text-slate-900 leading-tight">
                                  {note.title}
                                </h5>
                                <button
                                  onClick={() => deleteLocalNote(note.id)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                                  title="Dismiss Note"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {note.content}
                              </p>
                            </div>
                            <div className="flex justify-between items-center pt-2 text-[9px] text-slate-400 font-mono">
                              <span>{note.timestamp}</span>
                              <span className="text-[8px] font-bold text-indigo-700 uppercase bg-indigo-50 px-1.5 py-0.5 rounded">
                                Saved Sandbox Note
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="p-5 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
          <div className="max-w-md mx-auto space-y-1">
            <div className="flex items-center justify-center space-x-1.5 text-slate-400">
              <AlertCircle className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Integration Standby</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Log in with your Google Account to automatically generate live analytical sheets, sync calendar logistics, send custom Gmail updates, compile Google Docs, and schedule active Tasks seamlessly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
