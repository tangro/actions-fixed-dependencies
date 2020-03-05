import stable from 'semver-stable';
import * as fs from 'fs';
import path from 'path';
import { Result } from '../Result';

export interface DependencyInformation {
  dependencies: Array<{ name: string; version: string }>;
  devDependencies: Array<{ name: string; version: string }>;
}

const collectUnstableDependencies = (dependencies: Record<string, string>) => {
  const allDependencies = Object.entries(dependencies).map(
    ([name, version]) => {
      return {
        name,
        version,
        isFixed: stable.is(version)
      };
    }
  );

  const unstableDependencies = allDependencies
    .filter(({ isFixed }) => isFixed)
    .map(({ name, version }) => ({ name, version }));

  return unstableDependencies;
};

const readPackageJson = ({ repo }: { repo: string }) => {
  try {
    const packageRaw = fs
      .readFileSync(
        path.join(process.env.RUNNER_WORKSPACE as string, repo, 'package.json')
      )
      .toString('utf-8');
    const { dependencies, devDependencies } = JSON.parse(packageRaw) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    return { dependencies, devDependencies };
  } catch (error) {
    console.log('ERROR', error);
    throw error;
  }
};

export const findUnfixedDependencies = async ({
  repo,
  checkDependencies,
  checkDevDependencies
}: {
  repo: string;
  checkDependencies: boolean;
  checkDevDependencies: boolean;
}): Promise<Result<DependencyInformation>> => {
  const { dependencies, devDependencies } = readPackageJson({ repo });
  const result = {
    dependencies: collectUnstableDependencies(dependencies),
    devDependencies: collectUnstableDependencies(devDependencies)
  };

  const isOkay =
    (checkDependencies ? result.dependencies.length === 0 : true) &&
    (checkDevDependencies ? result.dependencies.length === 0 : true);
  const shortText = isOkay
    ? `All dependencies are fixed`
    : [
        checkDependencies && result.dependencies.length === 0
          ? `${result.dependencies.length} unfixed dependencies`
          : '',
        checkDevDependencies && result.devDependencies.length === 0
          ? `${result.devDependencies.length} unfixed devDependencies`
          : ''
      ].join(', ');

  return {
    isOkay,
    shortText,
    metadata: result,
    text: shortText
  };
};
