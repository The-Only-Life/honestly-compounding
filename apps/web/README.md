# Honestly Compounding

Welcome to the honestly-compounding repository! This is a monorepo containing both the web and server applications, managed with Bun.

<<<<<<< HEAD:README.md
## Prerequisites
=======
Professional stock research and analysis platform
>>>>>>> origin/development:apps/web/README.md

- **Bun**: This project uses [Bun](https://bun.sh/) as the package manager and runtime. Make sure you have it installed.

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/The-Only-Life/honestly-compounding.git
    cd honestly-compounding
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Run the development environment:**
    To start both the web and server applications simultaneously:
    ```bash
    bun run dev
    ```

    **Individual commands:**
    - Web app only: `bun run dev:web`
    - Server only: `bun run dev:server`

## Project Structure

- `apps/web`: The frontend web application.
- `apps/server`: The backend server application.

## Deployment

Deployments are managed via [Railway](https://railway.app/) and are automatically triggered from the `development` branch.

- **Configuration**: governed by `railway.toml`.
- **Builder**: We use a `Dockerfile` to build the image (based on `oven/bun`).
- **Process**: The `start.sh` script handles the startup of both the web and server applications within the container.

## Contribution Guidelines

We follow a strict development workflow to ensure code quality and stability.

1.  **Branching Strategy:**
    - **Primary Development Branch**: `development`.
    - **Never commit directly to `main` or `development`.**
    - Always create a new feature branch from `development`:
      ```bash
      git checkout -b feature/your-feature-name
      ```

2.  **Pull Requests (PRs):**
    - Once your work is ready, push your branch and open a Pull Request against `development`.
    - Provide a clear description of your changes.

3.  **Code Review & Merging:**
    - All PRs need to be reviewed and approved by at least one other team member.
    - **Get approval before merging.**
    - Rebase and merge is preferred to keep the history clean.

