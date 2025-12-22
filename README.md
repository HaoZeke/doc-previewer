# PR Documentation Previewer

This GitHub Action automatically posts a download link for documentation
artifacts on Pull Requests. It utilizes [nightly.link](https://nightly.link/) to
provide direct access to build outputs without requiring users to navigate the
Actions UI.

## Features

- 🔗 **Automatic Linking**: Generates direct download links for artifacts.
- 🔄 **Smart Updates**: Updates existing comments to minimize PR clutter.
- 🎨 **Customizable**: Modify headers, artifact names, and link labels.

## Usage

Add this action to a workflow triggered by `workflow_run`.

```yaml
on:
  workflow_run:
    workflows: [Build Docs]
    types: [completed]

jobs:
  comment:
    if: github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: HaoZeke/doc-previewer@v1
        with:
          workflow_run_id: ${{ github.event.workflow_run.id }}
          head_sha: ${{ github.event.workflow_run.head_sha }}
          artifact_name: simulation-report
          comment_header: "### Documentation Preview"
```

## References

- [hywax/github-action-template](https://github.com/hywax/github-action-template/generate).
- [HaoZeke/large-file-auditor](https://github.com/HaoZeke/large-file-auditor/generate).

## Development

This includes contains the following scripts:

- `build` - Build for production
- `release` - Generate changelog and npm publish
- `lint` - Checks your code for any linting errors
- `test` - Run all tests
- `test:watch` - Run all tests with watch mode
- `test:coverage` - Run all tests with code coverage report
- `typecheck` - Run TypeScript type checking
- `prepare` - Script for setting up husky hooks

## License

[MIT](LICENSE).
