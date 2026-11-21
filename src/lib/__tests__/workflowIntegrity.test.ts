import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Android Release Workflow Integrity', () => {
  const workflowPath = join(process.cwd(), '.github/workflows/android-release.yml');

  it('workflow file exists and contains release job triggers and steps', () => {
    const yaml = readFileSync(workflowPath, 'utf8');
    expect(yaml).toContain('name: Build & Sign Android App Bundle');
    expect(yaml).toContain('workflow_dispatch:');
    expect(yaml).toContain('bundleRelease');
    expect(yaml).toContain('upload-artifact');
  });
});
