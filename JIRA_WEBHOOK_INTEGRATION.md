# Jira Webhook Integration - Story to Initiative Sync

## Overview

This document covers the **real-time Jira webhook integration** that automatically syncs Jira Stories to X-Matrix Initiatives in real-time.

---

## Architecture

### How It Works

1. **Jira sends webhook events** when a Story is created or updated
2. **X-Matrix receives event** at `/api/webhooks/jira` endpoint
3. **System validates** the webhook secret and project key
4. **Initiative is created or updated** based on the Jira Story
5. **Jira metadata is stored** for future reference and auditing

### Real-Time Processing

- No polling required
- Events processed within seconds
- Automatic upsert (create if new, update if exists)
- Jira field mapping to X-Matrix fields

---

## Setup Instructions

### Part 1: Configure X-Matrix Settings

1. Open X-Matrix application
2. Navigate to **Settings → Jira Integration**
3. Fill in the following fields:

| Field | Example | Description |
|-------|---------|-------------|
| **Jira Instance URL** | `https://shibik2004.atlassian.net` | Your Jira Cloud domain |
| **Jira Project Key** | `XMAT` | The project key from your Jira issue keys (e.g., XMAT-123) |
| **Target X-Matrix ID** | `xmatrix-1` | The X-Matrix ID where stories will sync |
| **Webhook Secret** | `my-secret-key-123` | Random string for validating webhooks (you create this) |

4. Click **"Save Webhook Settings"**
5. Click **"Copy Webhook URL"** - this will be used in Jira

### Part 2: Create Webhook in Jira

#### For Jira Cloud:

1. Go to **Jira Settings → Webhooks** (accessible from admin settings)
2. Click **"Create a webhook"**
3. Fill in:
   - **Name**: `XMatrix Stories Sync`
   - **Status**: `Enabled`
   - **URL**: Paste the webhook URL from Step 1.5

4. **Set Events** (both required):
   - ✅ `Issue created`
   - ✅ `Issue updated`

5. **Optional - Set JQL Filter** (recommended):
   ```
   project = XMAT AND issuetype = Story
   ```
   This ensures only Stories (not tasks or bugs) trigger the webhook

6. **Set Secret** (if webhook supports it):
   - Use the same secret from X-Matrix settings

7. Click **"Create webhook"**

---

## Testing the Integration

### Quick Test

1. **Create a new Story in Jira**
   - Project: Your configured project
   - Issue Type: Story
   - Title: "Test Story from Jira"

2. **Check X-Matrix**
   - Go to your X-Matrix
   - A new Initiative should appear within 5-10 seconds

3. **Verify the sync**
   - The Initiative title matches the Jira Story title
   - The Jira issue key is stored (visible in initiative details)

### Test Story Update

1. **Update the Story in Jira**
   - Change the title
   - Change the priority
   - Add description

2. **Check X-Matrix**
   - The Initiative should update automatically
   - Changes appear within seconds

---

## Field Mapping

When a Story is synced from Jira to X-Matrix, the following fields are mapped:

### Story Fields → Initiative Fields

| Jira Field | X-Matrix Field | Mapping |
|-----------|----------------|---------|
| **summary** | title | Direct copy |
| **description** | description | Parsed from Jira ADF format |
| **priority.name** | priority | See Priority Mapping |
| **status.name** | health | See Status Mapping |
| **issue.key** | jiraIssueKey | Unique identifier (XMAT-123) |
| **issue.url** | jiraIssueUrl | Link back to Jira |

### Priority Mapping

| Jira Priority | X-Matrix Priority |
|--------------|------------------|
| Highest | critical |
| High | high |
| Medium | medium |
| Low | low |
| Lowest | low |

### Status Mapping

| Jira Status | X-Matrix Health |
|------------|----------------|
| To Do, Open, New | on-track |
| In Progress | on-track |
| In Review | at-risk |
| Done, Closed | off-track |
| Blocked | off-track |

---

## API Endpoint Details

### Webhook Endpoint: `/api/webhooks/jira`

**Location**: `src/app/api/webhooks/jira/route.ts`

#### GET Request
Returns webhook endpoint info and health check

```bash
GET /api/webhooks/jira
```

Response:
```json
{
  "ok": true,
  "endpoint": "/api/webhooks/jira",
  "mode": "stories-to-initiatives-realtime",
  "xmatrixId": "xmatrix-1"
}
```

#### POST Request
Handles Jira webhook events

```bash
POST /api/webhooks/jira?projectKey=XMAT&xmatrixId=xmatrix-1&secret=my-secret
Content-Type: application/json

{
  "issue": {
    "key": "XMAT-123",
    "summary": "New Feature",
    "description": "...",
    "issuetype": { "name": "Story" },
    "priority": { "name": "High" },
    "status": { "name": "To Do" },
    "self": "https://..."
  }
}
```

Response on Success:
```json
{
  "ok": true,
  "action": "created",
  "initiative": {
    "id": "init-...",
    "code": "I-N-001",
    "title": "New Feature",
    "jiraIssueKey": "XMAT-123",
    "jiraIssueUrl": "https://...",
    "jiraLastSynced": 1712500800
  }
}
```

---

## Security

### Webhook Secret Validation

The webhook secret is validated on every request:

1. Secret from X-Matrix settings is stored locally
2. Jira includes secret in webhook URL: `?secret=...`
3. Server compares provided secret with expected secret
4. If mismatch → 401 Unauthorized response

### Best Practices

- ✅ Use a random, strong secret (minimum 16 characters)
- ✅ Keep secret in X-Matrix settings only (don't share)
- ✅ Use HTTPS only (ngrok for local testing)
- ✅ Restrict JQL to only Story issues
- ✅ Use project key filtering for multi-project setups

---

## Troubleshooting

### Webhook Not Triggering

**Problem**: Created a Story in Jira but no Initiative appears in X-Matrix

**Solutions**:
1. Check if webhook is **Enabled** in Jira settings
2. Verify **Project Key** matches your Jira project
3. Check **JQL filter** (if set) matches your Story
4. Verify **Issue Type** is "Story" (not Task or Bug)

### Secret Mismatch Error

**Problem**: Webhook returns 401 Unauthorized

**Solutions**:
1. Copy exact secret from X-Matrix settings
2. Ensure secret matches in both X-Matrix and Jira webhook
3. Check for extra spaces or special characters in secret

### Initiative Not Updating

**Problem**: Updated Story in Jira but Initiative doesn't change

**Solutions**:
1. Check that **"Issue updated"** event is selected in Jira webhook
2. Wait 5-10 seconds (network latency)
3. Verify the Story type (must be Story, not Task)
4. Check X-Matrix for any error messages

### ngrok Issues

**Problem**: "authentication failed: requires verified account"

**Solution**:
1. Sign up at https://dashboard.ngrok.com/signup
2. Get authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
3. Configure: `ngrok config add-authtoken YOUR_TOKEN`
4. Start: `ngrok http 3000`

---

## Database Schema

The following fields are used to track Jira sync metadata on Initiatives:

```sql
-- Added to initiatives table
jira_issue_key VARCHAR(50)           -- Jira issue key (XMAT-123)
jira_issue_url VARCHAR(500)          -- URL to Jira issue
jira_issue_type VARCHAR(50)          -- Issue type (story, task)
jira_last_synced BIGINT              -- Timestamp of last sync
jira_sync_status VARCHAR(50)         -- Status (synced, pending, error)
jira_sync_error TEXT                 -- Error message if sync failed
```

---

## Code Structure

### Key Files

```
src/
├── app/
│   └── api/
│       └── webhooks/
│           └── jira/
│               └── route.ts              # Main webhook handler
├── components/
│   └── settings/
│       └── JiraSettingsPanel.tsx         # Settings UI
├── lib/
│   ├── db.ts                            # Database helpers
│   │   ├── getInitiativeByJiraIssueKey()
│   │   ├── createInitiative()
│   │   └── updateInitiative()
│   └── types.ts                         # TypeScript types
```

### Helper Functions

**src/app/api/webhooks/jira/route.ts**:
- `extractTextFromDescription()` - Parse Jira ADF format
- `normalizeIssueType()` - Convert issue type to string
- `mapPriority()` - Map Jira priority to X-Matrix
- `mapHealth()` - Map Jira status to health
- `buildIssueUrl()` - Generate Jira browse URL
- `resolveXMatrixId()` - Get target X-Matrix ID
- `nextInitiativeCode()` - Generate initiative code (I-N-001)

---

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn
- X-Matrix running on `localhost:3000`
- Jira Cloud account with webhook access
- ngrok for HTTPS tunneling

### Setup

1. **Start X-Matrix**:
   ```bash
   npm run dev
   ```

2. **Start ngrok** (in another terminal):
   ```bash
   ngrok http 3000
   ```

3. **Configure webhook**:
   - Use ngrok HTTPS URL in X-Matrix settings
   - Create webhook in Jira with ngrok URL

4. **Test**:
   - Create a Story in Jira
   - Verify Initiative appears in X-Matrix

---

## Production Deployment

### Requirements

- HTTPS domain (required by Jira Cloud)
- Stable URL (no ngrok tunneling)
- Environment variables:
  ```env
  JIRA_WEBHOOK_SECRET=your-secret-here
  JIRA_WEBHOOK_XMATRIX_ID=xmatrix-id-here
  ```

### Deployment Steps

1. Deploy X-Matrix to production server with HTTPS
2. Create webhook in Jira with production domain URL
3. Store webhook secret in environment variables
4. Monitor webhook deliveries in Jira settings

---

## Performance

### Sync Speed

- **Average**: 2-5 seconds
- **Max**: 10 seconds
- **Network dependent**: Speed varies with network latency

### Scaling

- Handles unlimited Stories
- No rate limiting from Jira (guaranteed delivery)
- No API call quotas

---

## Support & Issues

For issues or questions:

1. Check the **Troubleshooting** section above
2. Verify webhook configuration in Jira settings
3. Check browser console for error messages
4. Review X-Matrix logs for sync errors

---

## Version History

- **v1.0** (Current): Webhook-based real-time Story to Initiative sync
  - Replaces old polling-based integration
  - Real-time processing
  - Automatic upsert
  - Full Jira field mapping
