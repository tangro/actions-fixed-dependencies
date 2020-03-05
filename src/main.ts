import * as core from '@actions/core';
import { GitHubContext, setStatus } from '@tangro/tangro-github-toolkit';
import { Result } from './Result';
import { findUnfixedDependencies } from './dependencies/dependencies';

async function wrapWithSetStatus<T>(
  context: GitHubContext<{}>,
  step: string,
  code: () => Promise<Result<T>>
) {
  await setStatus({
    context,
    step,
    description: `Running ${step}`,
    state: 'pending'
  });
  core.info(`Setting status to pending`);

  try {
    const result = await code();
    await setStatus({
      context,
      step,
      description: result.shortText,
      state: result.isOkay ? 'success' : 'failure'
    });
    core.info(`Setting status to ${result.isOkay ? 'success' : 'failure'}`);
    return result;
  } catch (error) {
    await setStatus({
      context,
      step,
      description: `Failed: ${step}`,
      state: 'failure'
    });
    core.info(`Setting status to failure`);
    core.setFailed(`CI failed at step: ${step}`);
  }
}

async function run() {
  try {
    if (
      !process.env.GITHUB_CONTEXT ||
      process.env.GITHUB_CONTEXT.length === 0
    ) {
      throw new Error(
        'You have to set the GITHUB_CONTEXT in your secrets configuration'
      );
    }
    if (!process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN.length === 0) {
      throw new Error(
        'You have to set the GITHUB_TOKEN in your secrets configuration'
      );
    }

    const context = JSON.parse(
      process.env.GITHUB_CONTEXT || ''
    ) as GitHubContext<{}>;

    const [owner, repo] = context.repository.split('/');
    const checkDependencies = core.getInput('check-dependencies') === 'true';
    const checkDevDependencies =
      core.getInput('check-dev-dependencies') === 'true';

    const results = await wrapWithSetStatus(
      context,
      'fixed-dependencies',
      async () => {
        return findUnfixedDependencies({
          checkDependencies,
          checkDevDependencies
        });
      }
    );

    console.log(JSON.stringify(results, null, 2));
    core.info(JSON.stringify(results, null, 2));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
