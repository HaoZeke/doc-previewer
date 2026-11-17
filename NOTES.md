# Moving `v1` Tag Plan

## Goal
Keep `v1` pointing at the latest stable `v1.x.y` release commit so existing workflows using `uses: HaoZeke/doc-previewer@v1` automatically receive backward-compatible fixes.

## Release Procedure
1. Ensure CI is green for the release commit and `dist/` is up to date.
2. Create an immutable semantic version tag for the release commit:
   - `v1.0.0`, `v1.0.1`, etc.
3. Move the lightweight `v1` tag to the same release commit:
   - `git tag -f v1 <release-commit-sha>`
4. Push both the immutable version tag and updated `v1` tag:
   - `git push origin v1.0.x`
   - `git push origin v1 --force`
5. Confirm the release notes/changelog describe changes since the prior `v1` target.

## Safety Rules
- Never move `v1` to unreviewed or failing commits.
- Only move `v1` for backward-compatible changes.
- For breaking changes, release under `v2` and introduce a separate moving `v2` tag.
