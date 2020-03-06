import * as core from '@actions/core';
import {
  GitHubContext,
  wrapWithSetStatus
} from '@tangro/tangro-github-toolkit';
import { findUnfixedDependencies } from './dependencies/dependencies';

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

    if (results) {
      if (results.isOkay) {
      } else {
        core.setFailed(results.shortText);
      }
    }

    // TODO when action is run with a PR we want to add suggestions to fix the dependency
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
