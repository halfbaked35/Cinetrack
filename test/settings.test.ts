import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// No local API under the test runner: settings load fails fast and retries quietly.
globalThis.fetch = (async () => new Response('offline', { status: 503 })) as typeof fetch

const { currentSettings, importSettings, settingsForBackup } = await import('../src/lib/settings.ts')

describe('renamed settings keys', () => {
  it('reads values saved under the pre-rename keys', () => {
    assert.equal(importSettings({ defaultShelfTab: 'tv', shelfColumns: 8 }), true)
    const settings = currentSettings()
    assert.equal(settings.defaultLibraryTab, 'tv')
    assert.equal(settings.forYouColumns, 8)
  })

  it('prefers the new key when both are present', () => {
    importSettings({ defaultLibraryTab: 'movie', defaultShelfTab: 'tv', forYouColumns: 4, shelfColumns: 9 })
    assert.equal(currentSettings().defaultLibraryTab, 'movie')
    assert.equal(currentSettings().forYouColumns, 4)
  })

  it('does not write the old keys back out', () => {
    const backup = settingsForBackup()
    assert.equal('defaultShelfTab' in backup, false)
    assert.equal('shelfColumns' in backup, false)
  })
})

describe('retired masthead settings', () => {
  it('drops the old archive name keys instead of carrying them along', () => {
    importSettings({ archiveName: 'My Film Diary', archiveItalicWordIndices: [1] })
    const backup = settingsForBackup()
    assert.equal('archiveName' in backup, false)
    assert.equal('archiveItalicWordIndices' in backup, false)
  })
})
