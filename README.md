# tangro/actions-fixed-dependencies

Checks whether all dependencies in the `package.json` are fixed.

# Version

You can use a specific `version` of this action. The latest published version is `v1.0.13`. You can also use `latest` to always get the latest version.

# Example:

```json
{
  "dependencies": {
    "lodash": "4.7.0", // accepted
    "lodash": "=4.7.0", // accepted

    "lodash": "latest", // not accepted
    "lodash": ">4.7.0", // not accepted
    "lodash": "^4.7.0", // not accepted
    "lodash": "~4.7.0" // not accepted
  }
}
```

# Example job

```yml
check-dependencies:
  runs-on: ubuntu-latest
  steps:
    - name: Checkout latest code
      uses: actions/checkout@v4
    - name: Use Node.js 16.x
      uses: actions/setup-node@v3.8.1
      with:
        node-version: 16.x
    - name: Check dependencies
      uses: tangro/actions-fixed-dependencies@v1.0.13
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        GITHUB_CONTEXT: ${{ toJson(github) }}
```

> **Attention** Do not forget to pass the `GITHUB_TOKEN` and `GITHUB_CONTEXT` to the `tangro/actions-fixed-dependencies` action.
> **Hint** You do not need a `npm install` step. This speeds up the job significantly

Steps this example job will perform

1. Check out the latest code
2. Use node v12
3. (this action) Check the dependencies

# Usage

The action will read the contents of the `package.json` and scan the `dependencies` and `devDependencies` by default. You can disable checking `dependencies` and `devDependencies` in the arguments.

The action will set a status to the commit to `pending` under the context `Tangro CI/fixed-dependencies`. When it finishes it will set the result as the description of the status.

It is also possible that the action posts a comment with the result to the commit. You have to set `post-comment` to `true`.

# Example with arguments

```yml
check-dependencies:
  runs-on: ubuntu-latest
  steps:
    - name: Checkout latest code
      uses: actions/checkout@v4
    - name: Use Node.js 16.x
      uses: actions/setup-node@v3.8.1
      with:
        node-version: 16.x
    - name: Check dependencies
      uses: tangro/actions-fixed-dependencies@v1.0.13
      with:
        check-dev-dependencies: false
        post-comment: true
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        GITHUB_CONTEXT: ${{ toJson(github) }}
```

This config will skip checking the dev dependencies and will post a comment when the dependency check failed

# Using with a static file server

You can also publish the test results to a static file server. The action will write the results into `dependencies/index.html`.

You can publish the results with our custom [deploy actions](https://github.com/tangro/actions-deploy)

```yml
check-dependencies:
  runs-on: ubuntu-latest
  steps:
    - name: Checkout latest code
      uses: actions/checkout@v4
    - name: Use Node.js 16.x
      uses: actions/setup-node@v3.8.1
      with:
        node-version: 16.x
    - name: Check dependencies
      uses: tangro/actions-fixed-dependencies@v1.0.13
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        GITHUB_CONTEXT: ${{ toJson(github) }}
    - name: Zip license check result
      if: always()
      run: |
        cd dependencies
        zip --quiet --recurse-paths ../dependencies.zip *
    - name: Deploy dependencies result
      if: always()
      uses: tangro/actions-deploy@v1.2.16
      with:
        context: auto
        zip-file: dependencies.zip
        deploy-url: ${{secrets.DEPLOY_URL}}
        project: fixed-dependencies
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        GITHUB_CONTEXT: ${{ toJson(github) }}
        DEPLOY_PASSWORD: ${{ secrets.DEPLOY_PASSWORD }}
        DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
```

> **Attention** Do not forget to use the correct `DEPLOY_URL` and provide all the tokens the actions need.

# Development

Follow the guide of the [tangro-actions-template](https://github.com/tangro/tangro-actions-template)

# Scripts

- `npm run update-readme` - Run this script to update the README with the latest versions.

  > You do not have to run this script, since it is run automatically by the release action

- `npm run update-dependencies` - Run this script to update all the dependencies
