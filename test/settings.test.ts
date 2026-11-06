import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// No local API under the test runner: settings load fails fast and retries quietly.
globalThis.fetch = (async () => new Response('offline', { status: 503 })) as typeof fetch

const { importSettings, settingsForBackup } = await import('../src/lib/settings.ts')

const RETIRED = [
  // Renamed, then removed.
  'defaultShelfTab',
  'shelfColumns',
  // The old customisable masthead.
  'archiveName',
  'archiveItalicWordIndices',
  // Removed to keep Settings simple; their behaviour is fixed now.
  'statusBadgeShape',
  'statusBadgeSize',
  'statusBadgePosition',
  'statusBadgeIcon',
  'statusBadgeShadow',
  'posterQuality',
  'forYouColumns',
  'dateStyle',
  'defaultLibraryTab',
  'defaultSort',
  'openAfterAdd',
  'defaultWatchDate',
  'blurEpisodeCovers',
]

describe('retired settings', () => {
  it('are dropped from saved settings and never written back out', () => {
    const old: Record<string, unknown> = {
      defaultShelfTab: 'tv',
      shelfColumns: 8,
      archiveName: 'My Film Diary',
      archiveItalicWordIndices: [1],
      statusBadgeShape: 'square',
      statusBadgeSize: 'small',
      statusBadgePosition: 'bottom-left',
      statusBadgeIcon: true,
      statusBadgeShadow: true,
      posterQuality: 'saver',
      forYouColumns: 4,
      dateStyle: 'absolute',
      defaultLibraryTab: 'movie',
      defaultSort: 'title',
      openAfterAdd: true,
      defaultWatchDate: 'blank',
      blurEpisodeCovers: true,
    }
    assert.equal(importSettings(old), true)
    const backup = settingsForBackup()
    for (const key of RETIRED) assert.equal(key in backup, false, `${key} should be retired`)
  })
})
