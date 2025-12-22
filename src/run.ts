import { getInput, info, error as logError, setFailed } from '@actions/core'
import { context, getOctokit } from '@actions/github'

export async function run(): Promise<void> {
  try {
    const token = getInput('github-token')
    const runId = Number.parseInt(getInput('workflow_run_id'), 10)
    const headSha = getInput('head_sha')
    const artifactName = getInput('artifact_name')
    const zipName = getInput('zip_display_name')
    const header = getInput('comment_header')

    const octokit = getOctokit(token)
    const { owner, repo } = context.repo

    // Find the Pull Request associated with the commit SHA
    const { data: searchResults }
            = await octokit.rest.search.issuesAndPullRequests({
              q: `repo:${owner}/${repo} is:pr sha:${headSha}`,
              per_page: 1,
            })

    if (searchResults.items.length < 1) {
      info('No matching pull request found for this SHA.')
      return
    }

    const prNumber = searchResults.items[0].number
    info(`Targeting pull request #${prNumber}`)

    // Locate the documentation artifact
    const artifacts = await octokit.paginate(
      octokit.rest.actions.listWorkflowRunArtifacts,
      { owner, repo, run_id: runId },
    )

    const docArtifact = artifacts.find((a) => a.name === artifactName)

    if (!docArtifact) {
      logError(`Artifact "${artifactName}" not found in run ${runId}.`)
      return
    }

    // Construct the comment body
    const link = `https://nightly.link/${owner}/${repo}/actions/artifacts/${docArtifact.id}.zip`
    const marker = ``
    const body = `${marker}\n${header}\n\nDownload: [${zipName}](${link})\n\nUnzip and open \`index.html\` to view.`

    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
    })

    const existingComment = comments.find((c) => c.body?.includes(marker))

    if (existingComment) {
      info(`Updating existing comment: ${existingComment.id}`)
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body,
      })
    } else {
      info('Creating a new comment.')
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body,
      })
    }
  } catch (error) {
    if (error instanceof Error) {
      setFailed(error.message)
    }
  }
}
