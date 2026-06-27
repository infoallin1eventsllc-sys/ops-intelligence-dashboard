import 'dotenv/config';
import express, { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
app.use(express.json({ limit: '2mb' }));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

function buildSystemPrompt(
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
    .map((e) => `  - ${e.name}: $${e.revenue.toLocaleString()} revenue, $${e.profit.toLocaleString()} profit (${e.type})`)
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

  return `You are a sharp business intelligence analyst for All-In-1 Events LLC, an event management company.

LIVE BUSINESS DATA (YTD 2026):
Revenue: $${totalRevenue.toLocaleString()} | Net Profit: $${totalProfit.toLocaleString()} | Margin: ${margin}%
Events: ${events.length} total (${events.filter((e) => e.status === 'Completed').length} completed, ${events.filter((e) => e.status === 'Upcoming').length} upcoming, ${events.filter((e) => e.status === 'Cancelled').length} cancelled)
Clients: ${clients.length} (${clients.filter((c) => c.segment === 'Enterprise').length} Enterprise, ${clients.filter((c) => c.segment === 'SMB').length} SMB, ${clients.filter((c) => c.segment === 'Individual').length} Individual)
High-Risk Clients: ${highRiskClients.length > 0 ? highRiskClients.join(', ') : 'None'}
Flagged Vendors: ${flaggedVendors.length > 0 ? flaggedVendors.join(', ') : 'None'}

MONTHLY PERFORMANCE:
${monthlyBreakdown}

TOP EVENTS BY REVENUE:
${topEvents}

VENDOR RELIABILITY INDEX:
${topVendors}

Provide concise, specific, actionable business intelligence. Reference exact numbers from the data. Use markdown formatting (### headers, **bold** for key metrics). Keep responses under 300 words and focused on actionable insights.`;
}

app.post('/api/analyze', async (req: Request, res: Response) => {
  const {
    question,
    events = [],
    clients = [],
    vendors = [],
  } = req.body as {
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

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: buildSystemPrompt(events, clients, vendors),
      messages: [{ role: 'user', content: question }],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

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
