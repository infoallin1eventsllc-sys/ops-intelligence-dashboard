import 'dotenv/config';
import express, { Request, Response } from 'express';

// ---------------------------------------------------------------------------
// To enable live Claude AI responses:
//   1. Add ANTHROPIC_API_KEY=<your-key> to .env
//   2. Uncomment the Anthropic block below and the `streamLive` call in the
//      route handler. The SSE wire protocol is identical — zero frontend changes.
// ---------------------------------------------------------------------------
// import Anthropic from '@anthropic-ai/sdk';
// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const app = express();
app.use(express.json({ limit: '2mb' }));

interface EventData {
  name: string;
  type: string;
  date: string;
  revenue: number;
  costs: number;
  profit: number;
  status: string;
  guestCount: number;
  venue: string;
}

interface ClientData {
  name: string;
  segment: string;
  totalSpend: number;
  lifetimeValue: number;
  retentionRisk: string;
}

interface VendorData {
  name: string;
  category: string;
  reliabilityScore: number;
  onTimeRate: number;
  avgCostVariance: number;
  flagged: boolean;
}

// ---------------------------------------------------------------------------
// Context builder — assembles a rich system prompt from live dashboard data.
// Used by both the mock streamer and the live Claude integration.
// ---------------------------------------------------------------------------
export function buildSystemPrompt(
  events: EventData[],
  clients: ClientData[],
  vendors: VendorData[],
): string {
  const active = events.filter((e) => e.status !== 'Cancelled');
  const totalRevenue = active.reduce((s, e) => s + e.revenue, 0);
  const totalProfit = active.reduce((s, e) => s + e.profit, 0);
  const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';
  const flaggedVendors = vendors.filter((v) => v.flagged).map((v) => v.name);
  const highRiskClients = clients.filter((c) => c.retentionRisk === 'High').map((c) => c.name);

  const topEvents = [...active]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(
      (e) =>
        `  - ${e.name}: $${e.revenue.toLocaleString()} revenue, $${e.profit.toLocaleString()} profit (${e.type})`,
    )
    .join('\n');

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const monthlyBreakdown = monthNames
    .map((month) => {
      const monthEvents = active.filter((e) => {
        const parts = e.date.split('-');
        const idx = parts.length >= 2 ? parseInt(parts[1], 10) - 1 : -1;
        return monthNames[idx] === month;
      });
      const rev = monthEvents.reduce((s, e) => s + e.revenue, 0);
      const prof = monthEvents.reduce((s, e) => s + e.profit, 0);
      return `  - ${month} 2026: $${rev.toLocaleString()} revenue, $${prof.toLocaleString()} profit (${monthEvents.length} events)`;
    })
    .join('\n');

  const topVendors = [...vendors]
    .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
    .slice(0, 5)
    .map(
      (v) =>
        `  - ${v.name} (${v.category}): Score ${v.reliabilityScore}/100, On-time ${v.onTimeRate}%` +
        `, Cost variance ${v.avgCostVariance > 0 ? '+' : ''}${v.avgCostVariance}%` +
        (v.flagged ? ' ⚠️ FLAGGED' : ''),
    )
    .join('\n');

  return `You are a sharp business intelligence analyst for All-In-1 Events LLC.

LIVE DATA (YTD 2026):
Revenue: $${totalRevenue.toLocaleString()} | Profit: $${totalProfit.toLocaleString()} | Margin: ${margin}%
Events: ${events.length} total | High-Risk Clients: ${highRiskClients.join(', ') || 'None'} | Flagged Vendors: ${flaggedVendors.join(', ') || 'None'}

MONTHLY:
${monthlyBreakdown}

TOP EVENTS:
${topEvents}

VENDORS:
${topVendors}`;
}

// ---------------------------------------------------------------------------
// Mock streamer — realistic word-by-word SSE stream, no external API needed.
// Responses reference actual seed data so they feel data-driven.
// ---------------------------------------------------------------------------
function selectMockResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('q2') || q.includes('revenue') || q.includes('drove')) {
    return `### Q2 2026 Revenue Analysis

**Total Q2 Revenue: $290,000** across 9 events (Apr–Jun), representing **57% of YTD gross**.

**Top drivers:**

1. **Apex Global Product Showcase** ($55,000) — largest single event YTD. Corporate showcases are your highest-yield category at an avg **31% margin**.

2. **Vanguard Capital Executive Retreat** ($50,000 upcoming) — high-margin VIP format with only 50 guests. Revenue per head: **$1,000**.

3. **Sarah & Michael Wedding** ($45,000) — Q2's only wedding; 31% margin with full vendor suite (photography, florals, venue, security).

**Action items:**
- Corporate events (11 of 17 active) drive **68% of total revenue** — prioritize enterprise client acquisition
- June alone: $170,000 active revenue. Protect the Vanguard and Cascade upcoming events closely
- Avg Q2 event margin: **30.2%** — slightly below Q1's 32.8%, largely due to Starlight Summer Carnival's thin 18% margin`;
  }

  if (q.includes('risk') || q.includes('churn') || q.includes('client')) {
    return `### Client Retention Risk Assessment

**2 high-risk accounts** require immediate action:

**1. Cascade Healthcare Corp** (Enterprise — LTV: $140,000)
- Complained about AV delays at June Medical Conference
- Has a second event upcoming June 30 — at risk of cancellation
- **Recommended action**: Personal outreach from account lead within 24 hours; offer 10% AV credit on the June 30 booking

**2. David Miller** (Individual — LTV: $12,500)
- Florist delivery issues at April event; low repeat probability
- Low revenue impact but negative word-of-mouth risk
- **Recommended action**: Send a goodwill discount for a future booking; low-cost retention

**3 medium-risk accounts to watch:**
- Greenwood Education Foundation — repeated discount demands eroding margin
- BioHealth Labs — scheduling friction with catering requirements
- EcoAction Alliance — strict zero-waste policy limits vendor flexibility

**Bright spot**: 7 of 12 clients are Low risk. Enterprise clients (Apex, Vanguard) show strong loyalty signals.`;
  }

  if (q.includes('vendor') || q.includes('supplier') || q.includes('best')) {
    return `### Vendor Performance Audit

**Top performers:**

1. **Apex Safety & Security** — Score **99/100** · 100% on-time · +1% cost variance · 11 contracts
2. **Shutter & Light Studios** — Score **98/100** · 100% on-time · 0% variance · Perfect record

**Flagged vendors requiring action:**

⚠️ **ProSonic AV Solutions** — Score **68/100** · 75% on-time · **+8.5% cost variance**
- Responsible for AV delays at Cascade Healthcare and BioHealth events
- Recommended: Swap to **Matrix Lights & Laser Tech** (89/100) for upcoming events

⚠️ **Mirage Tent & Rentals** — Score **48/100** · Only 50% on-time · **+18.5% cost variance**
- Arrived 4 hours late to Pinnacle Corporate Retreat
- Recommended: Remove from approved vendor list immediately

**Cost savings opportunity**: Replacing both flagged vendors on upcoming bookings would reduce cost variance exposure by an estimated **$4,200–$6,800**.`;
  }

  if (q.includes('profit') || q.includes('margin') || q.includes('improve')) {
    return `### Profitability Improvement Analysis

**Current state**: $154,300 net profit on $506,000 revenue — **30.5% blended margin**

**Top 3 actions to improve profitability:**

**1. Replace flagged AV vendors** (Est. impact: +1.5% margin)
- ProSonic AV averages +8.5% cost variance across 8 contracts
- Mirage Tent averages +18.5% across 4 contracts
- Switching both to higher-reliability alternatives saves ~$6,000–$9,000 YTD

**2. Raise floor price on nonprofit/Individual events** (Est. impact: +2% margin)
- Nonprofit events (Greenwood, EcoAction) average **26% margin** vs 32% for Corporate
- Individual events average **28% margin**
- Adding a 5% base price adjustment captures $8,000–$12,000 in additional profit

**3. Grow the Corporate segment** (Est. impact: highest leverage)
- Corporate events: 11 events, **32% avg margin**, $363,000 revenue
- One new Enterprise account at Apex/Vanguard scale adds ~$40,000–$55,000 revenue
- Focus sales effort on referrals from existing Enterprise clients`;
  }

  return `### Ops Intelligence Summary

**YTD Snapshot**: $506,000 revenue · $154,300 profit · **30.5% margin** across 17 active events

**Key insights from your data:**

- **Corporate is your engine**: 11 of 17 events, 68% of revenue, highest margins
- **Two vendors are dragging costs**: ProSonic AV (+8.5% variance) and Mirage Tent (+18.5%) — flagged and actionable
- **Two clients need attention**: Cascade Healthcare and David Miller carry high churn risk
- **Best month**: June 2026 at $170,000 active revenue (2 upcoming events still to close)
- **Best event format by ROI**: VIP corporate retreats — Vanguard's 50-guest retreat generates $1,000/head

**Suggested next questions:**
- "What drove Q2 revenue?"
- "Which clients are at risk?"
- "How can we improve profitability?"`;
}

// Streams text word-by-word to replicate the feel of a live LLM response.
async function streamMockResponse(res: Response, text: string): Promise<void> {
  const words = text.split(' ');
  for (const word of words) {
    res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
    await new Promise((resolve) => setTimeout(resolve, 28));
  }
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------
app.post('/api/analyze', async (req: Request, res: Response) => {
  const { question, events = [], clients = [], vendors = [] } = req.body as {
    question: string;
    events: EventData[];
    clients: ClientData[];
    vendors: VendorData[];
  };

  if (!question?.trim()) {
    res.status(400).json({ error: 'Question is required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Log the context being analyzed (visible in server console for demo purposes)
  const active = (events as EventData[]).filter((e) => e.status !== 'Cancelled');
  console.log(
    `[analyze] question="${question.slice(0, 60)}" events=${active.length} clients=${clients.length} vendors=${vendors.length}`,
  );

  try {
    // -----------------------------------------------------------------------
    // LIVE MODE (uncomment to use real Claude API):
    // -----------------------------------------------------------------------
    // const stream = anthropic.messages.stream({
    //   model: 'claude-haiku-4-5-20251001',
    //   max_tokens: 1024,
    //   system: buildSystemPrompt(events, clients, vendors),
    //   messages: [{ role: 'user', content: question }],
    // });
    // for await (const chunk of stream) {
    //   if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
    //     res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
    //   }
    // }
    // -----------------------------------------------------------------------

    const mockText = selectMockResponse(question);
    await streamMockResponse(res, mockText);

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ error: `Analysis failed: ${message}` })}\n\n`);
    res.end();
  }
});

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`Ops Intelligence server running on http://localhost:${PORT}`);
});
