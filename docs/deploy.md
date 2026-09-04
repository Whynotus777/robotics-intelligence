# Deployment

The Vercel project is named `robotics-intelligence` (project ID
`prj_8tiIFwLA10hIFc5goh4YRjBLiy43`). Its root directory is `apps/web`, framework
is Next.js, install command is `pnpm install --frozen-lockfile`, build command
is `pnpm --filter web build`, and it uses Node.js 22. The production domain is
`map.quantumroboticslab.ai` and is attached to this project. Vercel DNS contains
`map CNAME fedbf38038248764.vercel-dns-017.com.` for the domain.

`DATA_PROVIDER=fixture` is a production environment variable. It keeps the web
application on generated fixtures until a later deployment deliberately changes
the data provider. Never commit Vercel credentials or environment values.

The account currently needs a GitHub **Login Connection** before the Vercel CLI
can connect `Whynotus777/robotics-intelligence`. Once connected, Vercel will
deploy `main` to production and every other branch as a preview. To roll back,
open the Vercel project dashboard, select the last known good deployment, and
use **Promote to Production**. Alternatively, restore the corresponding Git
commit on `main`; Vercel will create and promote the resulting production
deployment through the normal integration.

The repository currently reserves `apps/web` for Agent 1 and does not yet have
a Next.js app. Vercel project settings may be created in advance, but the first
production build can succeed only after that app is pushed.

At the time of configuration, the authoritative nameservers remain GoDaddy
(`ns05.domaincontrol.com`, `ns06.domaincontrol.com`), so Vercel cannot verify or
serve the subdomain yet. The Vercel DNS record is already present as requested;
the DNS zone must become authoritative (or the same CNAME must be added at the
authoritative provider) before `vercel domains verify map.quantumroboticslab.ai`
will succeed.
