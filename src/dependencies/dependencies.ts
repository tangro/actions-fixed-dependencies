import stable from 'semver-stable';
import * as fs from 'fs';
import path from 'path';
import { Result } from '../Result';

interface Dependency {
  name: string;
  version: string;
}

export interface DependencyInformation {
  dependencies: Array<Dependency>;
  devDependencies: Array<Dependency>;
}

const toText = ({
  dependencies,
  devDependencies,
  checkDependencies,
  checkDevDependencies,
  isOkay
}: DependencyInformation & {
  isOkay: boolean;
  checkDependencies: boolean;
  checkDevDependencies: boolean;
}): string => {
  if (isOkay) {
    return 'All dependencies are fixed';
  } else {
    const text = [
      !isOkay && checkDependencies && dependencies.length > 0
        ? `<h1>Dependencies</h1><ul>${dependencies.map(
            ({ name, version }) => `<li>${name}: ${version}</li>`
          )}</ul>`
        : '',
      !isOkay && checkDevDependencies && devDependencies.length > 0
        ? `<h1>Dev dependencies</h1><ul>${devDependencies.map(
            ({ name, version }) => `<li>${name}: ${version}</li>`
          )}</ul>`
        : ''
    ].join('<br/>');

    return `<html><body>${text}</body></html>`;
  }
};

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
    .filter(({ isFixed }) => !isFixed)
    .map(({ name, version }) => ({ name, version }));

  return unstableDependencies;
};

const readPackageJson = () => {
  try {
    const packageRaw = fs
      .readFileSync(path.join('./', 'package.json'))
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
  checkDependencies,
  checkDevDependencies
}: {
  checkDependencies: boolean;
  checkDevDependencies: boolean;
}): Promise<Result<DependencyInformation>> => {
  const { dependencies, devDependencies } = readPackageJson();
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
        checkDependencies && result.dependencies.length > 0
          ? `${result.dependencies.length} unfixed dependencies`
          : '',
        checkDevDependencies && result.devDependencies.length > 0
          ? `${result.devDependencies.length} unfixed devDependencies`
          : ''
      ].join(', ');

  return {
    isOkay,
    shortText,
    metadata: result,
    text: toText({ checkDependencies, checkDevDependencies, isOkay, ...result })
  };
};
