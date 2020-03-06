# actions-fixed-dependencies

Checks whether all dependencies in the `package.json` are fixed.

Example:

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
      uses: actions/checkout@v1
    - name: Use Node.js 12.x
      uses: actions/setup-node@v1
      with:
        node-version: 12.x
    - name: Check dependencies
      uses: tangro/actions-fixed-dependencies@1.0.0
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        GITHUB_CONTEXT: ${{ toJson(github) }}
```

> **Attention** Do not forget to pass the `GITHUB_TOKEN` and `GITHUB_CONTEXT` to the `actions-fixed-dependencies` action.
> **Hint** You do not need a `npm install` step. This speeds up the job significantly

Steps this example job will perform

1. Check out the latest code
2. Use node v12
3. (this action) Check the dependencies

# Usage

The action will read the contents of the `package.json` and scan the `dependencies` and `devDependencies` by default. You can disable checking `dependencies` and `devDependencies` in the arguments.

The action will set a status to the commit to `pending` under the context `Tangro CI/fixed-dependencies`. When it finishes it will set the result as the description of the status.

It is also possible that the action posts a comment with the result to the commit. You have to set `post-comment` to `true`.

# Publishing an action

> **Important** Do **not** run `npm build`. It will be done automatically. And do not check in the `dist` directory.

There is a workflow already pre-configured that automatically publishs a new version when you push your code to the `master` branch. The workflow will take your npm package version and publish the action under that version. You have two options

- Keep the current version number and the action will be updated
- Bump the version number and a new action will be created

The action-release workflow will create a branch with the `package.json` version as its name. An already existing branch will be overwritten.

After the workflow/action has run your action will be available to be used.

# FAQ

## Do I need to check-in the node_modules folder

No. This template uses [@zeit/ncc](https://github.com/zeit/ncc) to automatically create and bundle a single `index.js` with the `node_modules` and code included.

## Can I put the `dist/` folder into the `.gitignore`

No. It needs to be present for the action. It is planned to automatically alter the `.gitignore` to always check-in the `dist/` folder. But that's not ready yet.

## What happens if I ran `npm build`

Just delete the `dist/` folder.

## Can I use a different branch than `master`

Yes. Edit the `.github/workflows/release-action.yml`
