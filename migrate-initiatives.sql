-- Backup by renaming old table
ALTER TABLE initiatives RENAME TO initiatives_backup;

-- Create new initiatives table with updated schema
CREATE TABLE initiatives (
  id TEXT PRIMARY KEY,
  xmatrix_id TEXT NOT NULL,
  code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK(priority IN ('blocker', 'critical', 'major', 'medium', 'trivial')),
  health TEXT CHECK(health IN ('on-track', 'at-risk', 'off-track')),
  start_date TEXT,
  end_date TEXT,
  jira_issue_type TEXT CHECK(jira_issue_type IN ('story', 'task')),
  jira_issue_key TEXT,
  jira_issue_url TEXT,
  jira_last_synced INTEGER,
  jira_sync_status TEXT CHECK(jira_sync_status IN ('synced', 'pending', 'error')),
  jira_sync_error TEXT,
  FOREIGN KEY (xmatrix_id) REFERENCES xmatrix(id) ON DELETE CASCADE
);

-- Copy data with priority mapping (high -> major)
INSERT INTO initiatives (id, xmatrix_id, code, title, description, priority, health, start_date, end_date, jira_issue_type, jira_issue_key, jira_issue_url, jira_last_synced, jira_sync_status, jira_sync_error)
SELECT 
  id, 
  xmatrix_id, 
  code,
  title, 
  description, 
  CASE priority
    WHEN 'high' THEN 'major'
    WHEN 'critical' THEN 'critical'
    WHEN 'medium' THEN 'medium'
    WHEN 'low' THEN 'trivial'
    ELSE priority
  END,
  health, 
  start_date, 
  end_date, 
  jira_issue_type,
  jira_issue_key, 
  jira_issue_url,
  jira_last_synced,
  jira_sync_status,
  jira_sync_error
FROM initiatives_backup;

-- Drop old table
DROP TABLE initiatives_backup;
