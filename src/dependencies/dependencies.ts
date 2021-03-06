import * as core from '@actions/core';
import stable from 'semver-stable';
import * as fs from 'fs';
import path from 'path';
import { Result } from '@tangro/tangro-github-toolkit';

interface Dependency {
  name: string;
  version: string;
}

export interface DependencyInformation {
  dependencies: Array<Dependency>;
  devDependencies: Array<Dependency>;
}

const toFileText = ({
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
        ? `<h1>Dependencies</h1><ul>${dependencies
            .map(({ name, version }) => `<li>${name}: ${version}</li>`)
            .join('')}</ul>`
        : '',
      !isOkay && checkDevDependencies && devDependencies.length > 0
        ? `<h1>Dev dependencies</h1><ul>${devDependencies
            .map(({ name, version }) => `<li>${name}: ${version}</li>`)
            .join('')}</ul>`
        : ''
    ].join('<br/>');

    return `<html><body>${text}</body></html>`;
  }
};

const toComment = ({
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
        ? `### Dependencies
${dependencies
  .map(({ name, version }) => `- ${name}: ${version}`)
  .join('\r\n')}`
        : '',
      !isOkay && checkDevDependencies && devDependencies.length > 0
        ? `### Dev dependencies
${devDependencies
  .map(({ name, version }) => `- ${name}: ${version}`)
  .join('\r\n')}`
        : ''
    ].join('\r\n\r\n');

    return `You have unfixed dependencies in your package.json please fix them:

${text}`;
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
    core.error(`ERROR: ${error}`);
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

  const fileContent = toFileText({
    checkDependencies,
    checkDevDependencies,
    isOkay,
    ...result
  });
  const comment = toComment({
    checkDependencies,
    checkDevDependencies,
    isOkay,
    ...result
  });

  fs.mkdirSync('dependencies');
  fs.writeFileSync(path.join('dependencies', 'index.html'), fileContent);

  core.info(`Result written to ${path.join('dependencies', 'index.html')}`);

  return {
    isOkay,
    shortText,
    metadata: result,
    text: comment
  };
};
