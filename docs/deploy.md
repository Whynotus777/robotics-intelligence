# Deployment

The Vercel project is named `robotics-intelligence`. Its root directory is
`apps/web`, framework is Next.js, install command is `pnpm install
--frozen-lockfile`, build command is `pnpm --filter web build`, and it uses
Node.js 22. The production domain is `map.quantumroboticslab.ai`; Vercel owns
the required DNS record in the account that owns the apex domain.

`DATA_PROVIDER=fixture` is a production environment variable. It keeps the web
application on generated fixtures until a later deployment deliberately changes
the data provider. Never commit Vercel credentials or environment values.

Git integration deploys `main` to production and every other branch as a
preview. To roll back, open the Vercel project dashboard, select the last known
good deployment, and use **Promote to Production**. Alternatively, restore the
corresponding Git commit on `main`; Vercel will create and promote the resulting
production deployment through the normal integration.

The repository currently reserves `apps/web` for Agent 1 and does not yet have
a Next.js app. Vercel project settings may be created in advance, but the first
production build can succeed only after that app is pushed.
