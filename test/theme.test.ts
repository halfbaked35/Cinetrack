import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isValidHex, normalizeHex, hexToRgb, getLuminance, getContrastColor, contrastRatio } from '../src/lib/theme.ts'

describe('hex helpers', () => {
  it('accepts 3- and 6-digit hex with optional hash', () => {
    assert.equal(isValidHex('#fff'), true)
    assert.equal(isValidHex('fff'), true)
    assert.equal(isValidHex('#a1B2c3'), true)
    assert.equal(isValidHex('#ggg'), false)
    assert.equal(isValidHex('#12345'), false)
    assert.equal(isValidHex(''), false)
  })
  it('normalizes to lowercase 6-digit form', () => {
    assert.equal(normalizeHex('#FFF'), '#ffffff')
    assert.equal(normalizeHex('a1b2c3'), '#a1b2c3')
  })
  it('converts hex to rgb', () => {
    assert.deepEqual(hexToRgb('#010203'), { r: 1, g: 2, b: 3 })
    assert.equal(hexToRgb('nope'), null)
  })
  it('computes luminance and contrast', () => {
    assert.ok(getLuminance('#ffffff') > getLuminance('#000000'))
    assert.equal(getContrastColor('#000000'), '#fdfbf6')
    assert.equal(getContrastColor('#ffffff'), '#14130f')
  })
  it('picks the text colour with the higher WCAG contrast', () => {
    // YIQ picked light text here (2.45:1); dark text reads at 7.3:1.
    assert.equal(getContrastColor('#10b981'), '#14130f')
    assert.equal(getContrastColor('#7a2318'), '#fdfbf6')
  })
  it('computes WCAG contrast ratios', () => {
    assert.equal(Math.round(contrastRatio('#000000', '#ffffff')), 21)
    assert.equal(contrastRatio('#777777', '#777777'), 1)
  })
})
