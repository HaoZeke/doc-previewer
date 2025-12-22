import * as core from '@actions/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as mod from '../src/run'

vi.mock('@actions/github', () => ({
  getOctokit: vi.fn().mockReturnValue({
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
  }),
  context: {
    repo: { owner: 'owner', repo: 'repo' },
  },
}))

describe('run logic', () => {
  let getInputMock: any

  beforeEach(() => {
    getInputMock = vi
      .spyOn(core, 'getInput')
      .mockImplementation((name: string) => {
        if (name === 'workflow_run_id') {
          return '123'
        }
        if (name === 'head_sha') {
          return 'sha'
        }
        return ''
      })
    vi.spyOn(core, 'setFailed').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('runs without crashing', async () => {
    await mod.run()
    expect(getInputMock).toHaveBeenCalled()
  })
})
