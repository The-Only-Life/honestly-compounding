- GIT Commit Strategy

  - Whenever new changes are being made follow the following steps -
    1. Create a new branch from the `development` branch.
    2. Commit the changes to this new branch
    3. Raise a PR to the `development` branch from this branch.

- Repo Stack
  - Package Manager
    - Bun
  - Monorepo architecture. Check apps directory
  - The deployments happen on railway using the Dockerfile in the root of the repo.
