# Honestly Compounding

Welcome to the honestly-compounding repository! This is a monorepo containing both the web and server applications, managed with Bun.

## Prerequisites

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
- **Builder**: We use a `Dockerfile` to build the image.
- **Process**: The `start.sh` script handles the startup of both the web and server applications within the container.

---

## Local Docker deployment ⚙️

You can run the app locally using Docker in two modes:

### Production (build + serve via nginx) ✅

Build the production image and run it (serves on port 3000):

```bash
docker compose build web
docker compose up -d web
# Open http://localhost:3000
```

### Development (uses Vite) 💡

Run the dev container which mounts your workspace:

```bash
docker compose up --build dev
# Open http://localhost:5173
```

Notes:
- The `dev` service runs `bun install` and starts the Vite dev server; for faster iteration you can run `bun install` locally first.
- This setup uses Bun for installs and scripts to match local development with containers.

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

