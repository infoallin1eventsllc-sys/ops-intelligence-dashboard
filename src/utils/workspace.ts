import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Event, Client, Vendor } from '../types';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://mail.google.com/');
provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://www.googleapis.com/auth/keep');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-In pop-up
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google Workspace credentials.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Workspace Sign-in Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// ----------------- CALENDAR SYNC FUNCTION -----------------
export const syncEventToGoogleCalendar = async (
  eventItem: Event,
  token: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: `[Ops Intel] ${eventItem.name}`,
        location: eventItem.venue,
        description: `Type: ${eventItem.type}\nGuest Count: ${eventItem.guestCount}\nProjected Revenue: $${eventItem.revenue.toLocaleString()}\nProjected Costs: $${eventItem.costs.toLocaleString()}\nProjected Profit: $${eventItem.profit.toLocaleString()}\n\nSynced dynamically via the Ops Intel interactive sandbox.`,
        start: {
          date: eventItem.date
        },
        end: {
          // calendar single-day events need end date to be the day after or we use start date for same-day
          date: eventItem.date
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Calendar API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return { success: true, url: data.htmlLink };
  } catch (error: any) {
    console.error('Google Calendar Sync Failed:', error);
    return { success: false, error: error.message };
  }
};

// ----------------- SHEETS SYNC FUNCTION -----------------
export const exportDataToGoogleSheets = async (
  events: Event[],
  clients: Client[],
  vendors: Vendor[],
  token: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // 1. Create a fresh new Google Sheet
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: `Ops Intelligence Ledger Report - ${new Date().toLocaleDateString()}`
        },
        sheets: [
          { properties: { title: 'Events Ledger' } },
          { properties: { title: 'Client Directory' } },
          { properties: { title: 'Vendor SLAs' } }
        ]
      })
    });

    if (!createResponse.ok) {
      const errText = await createResponse.text();
      throw new Error(`Google Sheets Creation Error: ${createResponse.status} - ${errText}`);
    }

    const sheetMetadata = await createResponse.json();
    const spreadsheetId = sheetMetadata.spreadsheetId;

    // 2. Prepare Events Ledger Data Matrix
    const eventHeader = ['Event ID', 'Event Name', 'Segment', 'Date', 'Revenue', 'Costs', 'Net Profit', 'Venue', 'Guests', 'Status'];
    const eventRows = events.map(e => [
      e.id,
      e.name,
      e.type,
      e.date,
      e.revenue,
      e.costs,
      e.profit,
      e.venue,
      e.guestCount,
      e.status
    ]);
    const eventMatrix = [eventHeader, ...eventRows];

    // 3. Prepare Client Directory Data Matrix
    const clientHeader = ['Client ID', 'Name', 'Phone', 'Email', 'Segment', 'Total Spend', 'Lifetime Value', 'Events Booked', 'Risk Rating'];
    const clientRows = clients.map(c => [
      c.id,
      c.name,
      c.phone,
      c.email,
      c.segment,
      c.totalSpend,
      c.lifetimeValue,
      c.eventCount,
      c.retentionRisk
    ]);
    const clientMatrix = [clientHeader, ...clientRows];

    // 4. Prepare Vendor SLAs Data Matrix
    const vendorHeader = ['Vendor ID', 'Name', 'Category', 'Total Contracts', 'Reliability Score', 'On Time Rate %', 'Cost Variance %', 'Total Paid', 'Flagged Status'];
    const vendorRows = vendors.map(v => [
      v.id,
      v.name,
      v.category,
      v.totalContracts,
      v.reliabilityScore,
      v.onTimeRate,
      v.avgCostVariance,
      v.totalPaid,
      v.flagged ? 'FLAGGED BREACH' : 'COMPLIANT'
    ]);
    const vendorMatrix = [vendorHeader, ...vendorRows];

    // 5. Populate sheets using batchUpdate or individual cell ranges
    const uploadData = async (range: string, values: any[][]) => {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values })
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to upload range ${range}: ${await response.text()}`);
      }
    };

    // Upload datasets parallelly to our sheets
    await Promise.all([
      uploadData('Events Ledger!A1', eventMatrix),
      uploadData('Client Directory!A1', clientMatrix),
      uploadData('Vendor SLAs!A1', vendorMatrix)
    ]);

    return { success: true, url: sheetMetadata.spreadsheetUrl };
  } catch (error: any) {
    console.error('Google Sheets Export Failed:', error);
    return { success: false, error: error.message };
  }
};

// ----------------- GMAIL INTEGRATION FUNCTIONS -----------------
export const sendGmailEmail = async (
  to: string,
  subject: string,
  htmlBody: string,
  token: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const rawContent = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      htmlBody
    ].join('\r\n');

    const base64Safe = btoa(unescape(encodeURIComponent(rawContent)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: base64Safe })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gmail Send Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error: any) {
    console.error('sendGmailEmail Failed:', error);
    return { success: false, error: error.message };
  }
};

export const listGmailMessages = async (token: string): Promise<any[]> => {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error(`Gmail API error: ${res.status} - ${await res.text()}`);
  }
  const data = await res.json();
  return data.messages || [];
};

export const getGmailMessageDetails = async (id: string, token: string): Promise<any> => {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error(`Gmail message fetch error: ${res.status}`);
  }
  return res.json();
};

// ----------------- GOOGLE DOCS INTEGRATION FUNCTIONS -----------------
export const createGoogleDoc = async (
  title: string,
  content: string,
  token: string
): Promise<{ success: boolean; documentId?: string; url?: string; error?: string }> => {
  try {
    const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });

    if (!createRes.ok) {
      throw new Error(`Google Docs Creation failed: ${await createRes.text()}`);
    }

    const doc = await createRes.json();
    const documentId = doc.documentId;

    // Fill content using batchUpdate
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              endOfSectionRecurrence: {
                locationType: 'BODY'
              },
              text: content
            }
          }
        ]
      })
    });

    if (!updateRes.ok) {
      throw new Error(`Google Docs content append failed: ${await updateRes.text()}`);
    }

    return { 
      success: true, 
      documentId, 
      url: `https://docs.google.com/document/d/${documentId}/edit` 
    };
  } catch (error: any) {
    console.error('createGoogleDoc Failed:', error);
    return { success: false, error: error.message };
  }
};

// ----------------- GOOGLE TASKS INTEGRATION FUNCTIONS -----------------
export const listGoogleTasks = async (token: string): Promise<any[]> => {
  const listRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!listRes.ok) {
    throw new Error(`Google Tasks API list error: ${listRes.status} - ${await listRes.text()}`);
  }
  const listsData = await listRes.json();
  const primaryList = listsData.items?.[0];
  if (!primaryList) return [];

  const tasksRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${primaryList.id}/tasks?maxResults=10`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!tasksRes.ok) {
    throw new Error(`Google Tasks list content error: ${tasksRes.status}`);
  }
  const tasksData = await tasksRes.json();
  return tasksData.items || [];
};

export const createGoogleTask = async (
  title: string,
  notes: string,
  due: string | null,
  token: string
): Promise<any> => {
  const listRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!listRes.ok) {
    throw new Error(`Failed to resolve Tasks List: ${await listRes.text()}`);
  }
  const listsData = await listRes.json();
  const primaryListId = listsData.items?.[0]?.id || '@default';

  const body: any = { title, notes };
  if (due) {
    body.due = new Date(due).toISOString();
  }

  const taskRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${primaryListId}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!taskRes.ok) {
    throw new Error(`Failed to insert task: ${await taskRes.text()}`);
  }
  return taskRes.json();
};

// ----------------- GOOGLE KEEP INTEGRATION FUNCTIONS -----------------
export const listGoogleKeepNotes = async (token: string): Promise<any[]> => {
  const res = await fetch('https://keep.googleapis.com/v1/notes', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Keep error: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.notes || [];
};

export const createGoogleKeepNote = async (
  title: string,
  bodyText: string,
  token: string
): Promise<any> => {
  const res = await fetch('https://keep.googleapis.com/v1/notes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title,
      body: {
        text: {
          text: bodyText
        }
      }
    })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Keep create error: HTTP ${res.status}`);
  }
  return res.json();
};
