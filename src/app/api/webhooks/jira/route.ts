import { NextRequest, NextResponse } from 'next/server';
import { createInitiative, getAllXMatrices, getInitiativeByJiraIssueKey, getInitiativesByXMatrix, updateInitiative } from '@/lib/db'; //why @  

interface JiraWebhookIssue {
  key?: string;
  self?: string; // why is it self and not url? because that's how Jira's API represents the issue URL in the webhook payload. The "self" field contains the API endpoint for the issue, which can be used to derive the URL to view the issue in Jira.
  fields?: {
    summary?: string;
    description?: unknown;
    issuetype?: { name?: string };
    status?: { name?: string };
    priority?: { name?: string };
  };
}

interface JiraWebhookPayload {
  webhookEvent?: string;
  issue?: JiraWebhookIssue;
}

function extractTextFromDescription(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;

  if (typeof value === 'object' && value !== null) { // what is the use of object check here? because Jira's rich text fields can be represented as nested objects with "text" and "content" properties. This function recursively extracts all text content from such structures, ensuring that we capture the full description even if it's formatted in a complex way.
    const node = value as { text?: string; content?: unknown[] };
    const parts: string[] = [];

    if (typeof node.text === 'string') {
      parts.push(node.text);
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        const childText = extractTextFromDescription(child);
        if (childText) parts.push(childText);
      }
    }

    return parts.join(' ').trim();
  }

  return '';
}

function normalizeIssueType(name?: string): 'story' | 'task' | null {
  if (!name) return null;
  const value = name.toLowerCase();
  if (value === 'story') return 'story';
  if (value === 'task' || value === 'sub-task' || value === 'subtask') return 'task';
  return null;
}

function mapPriority(name?: string): 'critical' | 'high' | 'medium' | 'low' { //why is name optional 
  const value = (name ?? '').toLowerCase();
  if (value.includes('highest') || value.includes('critical') || value.includes('blocker')) return 'critical';
  if (value.includes('high')) return 'high';
  if (value.includes('low') || value.includes('lowest')) return 'low';
  return 'medium';
}

function mapHealth(statusName?: string): 'on-track' | 'at-risk' | 'off-track' {
  const value = (statusName ?? '').toLowerCase();
  if (value.includes('done') || value.includes('closed') || value.includes('resolved')) return 'on-track';
  if (value.includes('blocked') || value.includes('rejected')) return 'off-track';
  if (value.includes('progress') || value.includes('review') || value.includes('todo') || value.includes('to do')) return 'at-risk';
  return 'on-track';
}

function buildIssueUrl(instanceUrl: string | null, issue: JiraWebhookIssue): string | undefined {
  if (instanceUrl && issue.key) {
    return `${instanceUrl.replace(/\/$/, '')}/browse/${issue.key}`;
  }

  if (!issue.self || !issue.key) return undefined;
  const base = issue.self.split('/rest/api')[0];
  if (!base) return undefined;
  return `${base}/browse/${issue.key}`;
}

function resolveXMatrixId(request: NextRequest): string | null {
  const fromQuery = request.nextUrl.searchParams.get('xmatrixId');
  if (fromQuery) return fromQuery;

  const fromEnv = process.env.JIRA_WEBHOOK_XMATRIX_ID;
  if (fromEnv) return fromEnv;

  const first = getAllXMatrices()[0];
  return first?.id ?? null;
}

function nextInitiativeCode(xmatrixId: string): string {
  const initiatives = getInitiativesByXMatrix(xmatrixId);
  const maxNumber = initiatives.reduce((max, item) => {
    const match = item.code?.match(/^I-(\d+)$/i);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);

  return `I-${maxNumber + 1}`;
}

export async function GET(request: NextRequest) {
  const xmatrixId = resolveXMatrixId(request);

  return NextResponse.json({
    ok: true,
    endpoint: '/api/webhooks/jira',
    mode: 'stories-to-initiatives-realtime',
    xmatrixId,
  });
}

export async function POST(request: NextRequest) {
  try {
    const expectedSecret = process.env.JIRA_WEBHOOK_SECRET;
    const suppliedSecret = request.nextUrl.searchParams.get('secret') || request.headers.get('x-webhook-secret');

    if (expectedSecret && suppliedSecret !== expectedSecret) { 
      return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 });
    }

    const payload = await request.json() as JiraWebhookPayload;
    const issue = payload.issue;

    if (!issue?.key) {
      return NextResponse.json({ ignored: true, reason: 'No issue in payload' });
    }

    const configuredProjectKey = request.nextUrl.searchParams.get('projectKey')?.toUpperCase();
    const issueProjectKey = issue.key.split('-')[0]?.toUpperCase();

    if (configuredProjectKey && issueProjectKey !== configuredProjectKey) {
      return NextResponse.json({ ignored: true, reason: 'Project key mismatch', issueKey: issue.key });
    }

    const issueType = normalizeIssueType(issue.fields?.issuetype?.name);
    if (!issueType || (issueType !== 'story' && issueType !== 'task')) {
      return NextResponse.json({ ignored: true, reason: 'Only Story and Task issues are synced', issueKey: issue.key });
    }

    const xmatrixId = resolveXMatrixId(request);
    if (!xmatrixId) {
      return NextResponse.json({ error: 'No xmatrixId configured for webhook sync' }, { status: 400 });
    }

    const title = issue.fields?.summary?.trim() || issue.key;
    const description = extractTextFromDescription(issue.fields?.description) || title;
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    const instanceUrl = request.nextUrl.searchParams.get('instanceUrl');
    const jiraIssueUrl = buildIssueUrl(instanceUrl, issue);

    const existing = getInitiativeByJiraIssueKey(issue.key);

    if (existing) {
      const updated = updateInitiative(existing.id, {
        title,
        description,
        priority: mapPriority(issue.fields?.priority?.name),
        health: mapHealth(issue.fields?.status?.name),
        jiraIssueType: 'story',
        jiraIssueKey: issue.key,
        jiraIssueUrl,
        jiraLastSynced: now,
        jiraSyncStatus: 'synced',
        jiraSyncError: undefined,
      });

      return NextResponse.json({ ok: true, action: 'updated', issueKey: issue.key, initiative: updated });
    }

    const created = createInitiative(xmatrixId, {
      id: `init-${crypto.randomUUID()}`,
      code: nextInitiativeCode(xmatrixId),
      title,
      description,
      priority: mapPriority(issue.fields?.priority?.name),
      health: mapHealth(issue.fields?.status?.name),
      startDate: today,
      endDate: today,
      jiraIssueType: 'story',
      jiraIssueKey: issue.key,
      jiraIssueUrl,
      jiraLastSynced: now,
      jiraSyncStatus: 'synced',
      jiraSyncError: undefined,
    });

    return NextResponse.json({ ok: true, action: 'created', issueKey: issue.key, initiative: created });
  } catch (error) {
    console.error('Jira webhook sync failed:', error);
    return NextResponse.json({ error: 'Webhook sync failed' }, { status: 500 });
  }
}
