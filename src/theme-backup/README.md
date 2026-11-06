# Paper theme backup

The app's original default light theme, **Paper**, preserved as it was before the four-theme redesign. Nothing in the app imports these files.

| File | What it holds |
| --- | --- |
| `paper.css` | The original `:root` colour tokens and derived tokens, plus the dotted "paper tooth" body texture. |
| `paper.ts` | The original picker entry (name, note, swatch), its colour defaults, and the original marked-episode colour. |

The full pre-redesign theme system (all six old themes and the colour customiser) is also in git history, in the commit before the redesign.

## Restore Paper as a third theme

1. **`src/styles/themes.css`:** copy the tokens from `paper.css` into a new block. Change the selector from `:root` to `[data-theme='paper']` and add `color-scheme: light;`. Paper predates these tokens, so add them too (Porcelain's values work): `--border-strong`, `--scrim`, `--scrim-soft`, `--shadow-pop`, `--shadow-sheet`, `--shadow-drawer` and `--poster-edge`. The `--input` and `--radius` tokens are already shared.
2. **`src/lib/theme.ts`:**
   - Add `'paper'` to `THEME_IDS`.
   - Add an entry to `THEMES` with `name: 'Paper'`, a `description`, `tone: 'light'` and `themeColor: '#ffffff'`.
   - Remove `paper: 'porcelain'` from `RETIRED_THEMES`.
3. **`public/theme-boot.js`:** add `paper: '#ffffff'` to `THEMES` and remove `paper` from `RETIRED`.
4. Run `npm test`. `test/theme.test.ts` checks Paper's colour contrast and that the files above agree.

## Roll back the whole redesign

If the redesign was committed on its own, one revert undoes it:

```bash
git log --oneline -- src/styles/themes.css   # the oldest entry is the redesign commit
git revert <that-commit>
```
