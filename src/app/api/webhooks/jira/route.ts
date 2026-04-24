import { NextRequest, NextResponse } from 'next/server';
import {
  createInitiative,
  createOwner,
  createRelationship,
  getAllXMatrices,
  getInitiativeByJiraIssueKey,
  getInitiativesByXMatrix,
  getOwnersByXMatrix,
  updateInitiative,
} from '@/lib/db';

interface JiraWebhookIssue {
  key?: string;
  self?: string; // why is it self and not url? because that's how Jira's API represents the issue URL in the webhook payload. The "self" field contains the API endpoint for the issue, which can be used to derive the URL to view the issue in Jira.
  fields?: {
    summary?: string;
    description?: unknown;
    issuetype?: { name?: string };
    status?: { name?: string };
    priority?: { name?: string };
    assignee?: {
      accountId?: string;
      displayName?: string;
      emailAddress?: string;
      avatarUrls?: { [size: string]: string };
    };
    duedate?: string;
    startDate?: string;
    [key: string]: unknown;
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

function mapPriority(name?: string): 'blocker' | 'critical' | 'major' | 'medium' | 'trivial' {
  const value = (name ?? '').toLowerCase();
  if (value.includes('blocker')) return 'blocker';
  if (value.includes('highest') || value.includes('critical')) return 'critical';
  if (value.includes('major')) return 'major';
  if (value.includes('medium')) return 'medium';
  if (value.includes('trivial') || value.includes('lowest') || value.includes('low') || value.includes('minor')) return 'trivial';
  return 'medium';
}

function mapHealth(statusName?: string): 'on-track' | 'at-risk' | 'off-track' {
  const value = (statusName ?? '').toLowerCase();
  if (value.includes('done') || value.includes('closed') || value.includes('resolved')) return 'on-track';
  if (value.includes('blocked') || value.includes('rejected')) return 'off-track';
  if (value.includes('progress') || value.includes('review') || value.includes('todo') || value.includes('to do')) return 'at-risk';
  return 'on-track';
}

function toISODate(value: unknown): string | undefined {
  if (!value) return undefined;

  if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
    return undefined;
  }

  if (typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  }

  return undefined;
}

function readCustomField(issue: JiraWebhookIssue, fieldName?: string): unknown {
  if (!fieldName || !issue.fields) return undefined;
  return issue.fields[fieldName];
}

function resolveInitiativeDates(issue: JiraWebhookIssue, request: NextRequest): { startDate?: string; endDate?: string } {
  const startDateField = request.nextUrl.searchParams.get('startDateField') || process.env.JIRA_START_DATE_FIELD;
  const endDateField = request.nextUrl.searchParams.get('endDateField') || process.env.JIRA_END_DATE_FIELD;

  const startDate =
    toISODate(readCustomField(issue, startDateField)) ||
    toISODate(issue.fields?.startDate);

  const endDate =
    toISODate(readCustomField(issue, endDateField)) ||
    toISODate(issue.fields?.duedate);

  return { startDate, endDate };
}

function initialsFromName(name: string): string {
  const parts = name
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return 'NA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function resolveAssigneeOwnerId(xmatrixId: string, issue: JiraWebhookIssue): string | null {
  const assignee = issue.fields?.assignee;
  if (!assignee?.displayName) {
    console.log(`[Webhook] No assignee found for issue ${issue.key}`);
    return null;
  }

  const owners = getOwnersByXMatrix(xmatrixId);
  console.log(`[Webhook] Looking for owner matching "${assignee.displayName}" among ${owners.length} existing owners:`, owners.map(o => o.name));
  
  const existingByName = owners.find(
    (owner) => owner.name.trim().toLowerCase() === assignee.displayName!.trim().toLowerCase(),
  );

  if (existingByName) {
    console.log(`[Webhook] ✅ Found existing owner: "${existingByName.name}" (ID: ${existingByName.id})`);
    return existingByName.id;
  }

  const newOwnerId = assignee.accountId ? `owner-jira-${assignee.accountId}` : `owner-jira-${crypto.randomUUID()}`;
  const avatar = assignee.avatarUrls?.['48x48'] || assignee.avatarUrls?.['24x24'] || '';

  console.log(`[Webhook] Creating new owner for "${assignee.displayName}" (ID: ${newOwnerId})`);

  const createdOwner = createOwner(xmatrixId, {
    id: newOwnerId,
    name: assignee.displayName,
    role: 'Jira Assignee',
    avatar,
    initials: initialsFromName(assignee.displayName),
    responsibilityType: 'responsible',
  });

  console.log(`[Webhook] ✅ Created new owner: "${createdOwner.name}" (ID: ${createdOwner.id})`);
  return createdOwner.id;
}

function syncAssigneeRelationship(xmatrixId: string, initiativeId: string, ownerId: string | null) {
  if (!ownerId) {
    console.log(`[Webhook] No owner ID to sync for initiative ${initiativeId}`);
    return;
  }

  try {
    const relationship = createRelationship(xmatrixId, {
      sourceId: initiativeId,
      sourceType: 'initiative',
      targetId: ownerId,
      targetType: 'owner',
      strength: 'primary',
    });
    console.log(`[Webhook] ✅ Synced relationship: initiative ${initiativeId} → owner ${ownerId}`);
  } catch (error) {
    console.error(`[Webhook] ❌ Failed to sync relationship: initiative ${initiativeId} → owner ${ownerId}:`, error);
    throw error;
  }
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
    startDateField: request.nextUrl.searchParams.get('startDateField') || process.env.JIRA_START_DATE_FIELD || null,
    endDateField: request.nextUrl.searchParams.get('endDateField') || process.env.JIRA_END_DATE_FIELD || null,
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
    const { startDate, endDate } = resolveInitiativeDates(issue, request);
    const instanceUrl = request.nextUrl.searchParams.get('instanceUrl');
    const jiraIssueUrl = buildIssueUrl(instanceUrl, issue);

    const existing = getInitiativeByJiraIssueKey(issue.key);

    if (existing) {
      const updated = updateInitiative(existing.id, {
        title,
        description,
        priority: mapPriority(issue.fields?.priority?.name),
        health: mapHealth(issue.fields?.status?.name),
        startDate,
        endDate,
        jiraIssueType: issueType,
        jiraIssueKey: issue.key,
        jiraIssueUrl,
        jiraLastSynced: now,
        jiraSyncStatus: 'synced',
        jiraSyncError: undefined,
      });

      const ownerId = resolveAssigneeOwnerId(xmatrixId, issue);
      syncAssigneeRelationship(xmatrixId, existing.id, ownerId);

      return NextResponse.json({ ok: true, action: 'updated', issueKey: issue.key, initiative: updated });
    }

    const created = createInitiative(xmatrixId, {
      id: `init-${crypto.randomUUID()}`,
      code: nextInitiativeCode(xmatrixId),
      title,
      description,
      priority: mapPriority(issue.fields?.priority?.name),
      health: mapHealth(issue.fields?.status?.name),
      startDate: startDate ?? today,
      endDate: endDate ?? today,
      jiraIssueType: issueType,
      jiraIssueKey: issue.key,
      jiraIssueUrl,
      jiraLastSynced: now,
      jiraSyncStatus: 'synced',
      jiraSyncError: undefined,
    });

    const ownerId = resolveAssigneeOwnerId(xmatrixId, issue);
    syncAssigneeRelationship(xmatrixId, created.id, ownerId);

    return NextResponse.json({ ok: true, action: 'created', issueKey: issue.key, initiative: created });
  } catch (error) {
    console.error('Jira webhook sync failed:', error);
    return NextResponse.json({ error: 'Webhook sync failed' }, { status: 500 });
  }
}
