import * as core from '@actions/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as mod from '../src/run'

const { octokit } = vi.hoisted(() => ({
  octokit: {
    rest: {
      search: { issuesAndPullRequests: vi.fn() },
      actions: { listWorkflowRunArtifacts: vi.fn() },
      issues: {
        listComments: vi.fn(),
        createComment: vi.fn(),
        updateComment: vi.fn(),
      },
    },
    paginate: vi.fn(),
  },
}))

vi.mock('@actions/github', () => ({
  getOctokit: vi.fn().mockReturnValue(octokit),
  context: {
    repo: { owner: 'owner', repo: 'repo' },
  },
}))

describe('run logic', () => {
  let getInputMock: any
  let baseInputs: Record<string, string>

  beforeEach(() => {
    vi.clearAllMocks()

    baseInputs = {
      'github-token': 'token',
      'workflow_run_id': '123',
      'head_sha': 'sha',
      'artifact_name': 'documentation',
      'zip_display_name': 'documentation.zip',
      'comment_header': '### Header',
      'marker_id': '',
    }

    getInputMock = vi
      .spyOn(core, 'getInput')
      .mockImplementation((name: string) => baseInputs[name] || '')
    vi.spyOn(core, 'setFailed').mockImplementation(() => {})

    octokit.rest.search.issuesAndPullRequests.mockResolvedValue({
      data: { items: [{ number: 42 }] },
    })
    octokit.paginate.mockResolvedValue([{ id: 100, name: 'documentation' }])
    octokit.rest.issues.listComments.mockResolvedValue({ data: [] })
    octokit.rest.issues.createComment.mockResolvedValue({})
    octokit.rest.issues.updateComment.mockResolvedValue({})
  })

  it('creates a new comment when no comments exist', async () => {
    await mod.run()
    expect(getInputMock).toHaveBeenCalled()
    expect(octokit.rest.issues.createComment).toHaveBeenCalledTimes(1)
    expect(octokit.rest.issues.updateComment).not.toHaveBeenCalled()
  })

  it('does not edit a human comment that quotes the marker', async () => {
    octokit.rest.issues.listComments.mockResolvedValue({
      data: [
        {
          id: 2,
          body: 'Please preserve <!-- doc-previewer:### Header --> in the generated comment.',
          user: { login: 'maintainer', type: 'User' },
        },
      ],
    })

    await mod.run()

    expect(octokit.rest.issues.createComment).toHaveBeenCalledTimes(1)
    expect(octokit.rest.issues.updateComment).not.toHaveBeenCalled()
  })

  it('updates an existing marker comment from github-actions[bot]', async () => {
    octokit.rest.issues.listComments.mockResolvedValue({
      data: [
        {
          id: 10,
          body: '<!-- doc-previewer:### Header -->\nold body',
          user: { login: 'github-actions[bot]', type: 'Bot' },
        },
      ],
    })

    await mod.run()

    expect(octokit.rest.issues.updateComment).toHaveBeenCalledTimes(1)
    expect(octokit.rest.issues.updateComment).toHaveBeenCalledWith(
      expect.objectContaining({ comment_id: 10 }),
    )
    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled()
  })

  it('updates an existing marker comment from another bot account', async () => {
    octokit.rest.issues.listComments.mockResolvedValue({
      data: [
        {
          id: 11,
          body: '<!-- doc-previewer:### Header -->\nold body',
          user: { login: 'preview-app[bot]', type: 'Bot' },
        },
      ],
    })

    await mod.run()

    expect(octokit.rest.issues.updateComment).toHaveBeenCalledWith(
      expect.objectContaining({ comment_id: 11 }),
    )
    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled()
  })

  it('supports two previewers on one PR by using different markers', async () => {
    baseInputs.marker_id = 'previewer-b'
    octokit.rest.issues.listComments.mockResolvedValue({
      data: [
        { id: 20, body: '<!-- doc-previewer:previewer-a -->\nA body', user: { login: 'github-actions[bot]' } },
        { id: 21, body: '<!-- doc-previewer:previewer-b -->\nB body', user: { login: 'github-actions[bot]' } },
      ],
    })

    await mod.run()

    expect(octokit.rest.issues.updateComment).toHaveBeenCalledTimes(1)
    expect(octokit.rest.issues.updateComment).toHaveBeenCalledWith(
      expect.objectContaining({ comment_id: 21 }),
    )
    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled()
  })

  it('uses the marker in the generated body', async () => {
    baseInputs.marker_id = 'previewer-c'
    await mod.run()

    expect(octokit.rest.issues.createComment).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('<!-- doc-previewer:previewer-c -->'),
      }),
    )
  })
})
