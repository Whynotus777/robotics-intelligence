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

On 4 September 2026, `vercel git connect` could not connect
`Whynotus777/robotics-intelligence`: the authenticated Vercel account still
needs a GitHub **Login Connection**. Installing the Vercel GitHub App alone did
not satisfy that account-level requirement. After the Login Connection is
added, rerun `npx vercel git connect https://github.com/Whynotus777/robotics-intelligence.git --yes`
from `apps/web`; Vercel will then deploy `main` to production and every other
branch as a preview. To roll back, open the Vercel project dashboard, select
the last known good deployment, and use **Promote to Production**. Alternatively,
restore the corresponding Git commit on `main`; Vercel will create and promote
the resulting production deployment through the normal integration.

`apps/web` now holds the Next.js 15 App Router application. `pnpm --filter web
build` succeeds from the repository root, and `next.config.ts` sets
`outputFileTracingRoot` to the repository root so the Vercel build from root
directory `apps/web` traces the linked workspace packages.

`npx vercel domains inspect map.quantumroboticslab.ai` on 4 September 2026 did
not report the subdomain as verified. It reports the apex as a third-party
domain with current GoDaddy nameservers (`ns05.domaincontrol.com`,
`ns06.domaincontrol.com`) rather than the intended Vercel nameservers. The
GoDaddy CNAME (`map` → `cname.vercel-dns.com`) may still be propagating; inspect
or verify the domain again after propagation before relying on the custom domain.
Git connection live 4 Sep 2026