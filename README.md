# David Rizky Wijaya — Portfolio

The source for [davidrwijaya.site](https://davidrwijaya.site): a portfolio of case studies and experiments, with an optional content management system and a small privacy aware analytics service.

## Project map

| Path | Purpose |
| --- | --- |
| `web/app` | Next.js routes, metadata, and API endpoints |
| `web/components` | Reusable UI and interactive experiences |
| `web/content` | Published portfolio content and seed data |
| `web/lib` | Shared domain logic, CMS, and integrations |
| `web/public` | Assets served by the site |
| `web/drizzle` | CMS database migrations |
| `web/game-server` | Off the Clock game API |
| `analytics-api` | Anonymous analytics collector and dashboard API |

The main app uses Next.js 16, React 19, TypeScript, Motion, and GSAP. The analytics collector uses Python's standard library. PostgreSQL is used only when the optional CMS is enabled.

## Develop locally

Use Node.js 22 and npm. From `web/`:

```sh
npm ci
cp .env.example .env
npm run dev
```

The site opens at `http://localhost:3000`. The default content lives in `web/content`, so the public pages work without a database. Contact delivery and the CMS need their own credentials; leave those integrations unconfigured until you need them. Never commit `.env` files or credentials.

Run the same checks used by the production image:

```sh
npm run typecheck
npm run lint
npm run build
```

Run the analytics service tests from the repository root:

```sh
python3 -m unittest discover -s analytics-api -p 'test_*.py'
```

## Deployment

`web/Dockerfile` builds and checks the Next.js app before producing a standalone runtime image. `web/compose.yaml` defines the portfolio, analytics, and game services. Configure the environment outside Git before running Compose. See `web/.env.example` for public app and contact variables, `web/CONTACT-EMAIL-SETUP.md` for email delivery, and `web/scripts/cms/README.md` for the optional CMS overlay.

The repository keeps source assets and migrations. Browser screenshots, local build caches, backups, private source documents, and export archives are excluded from new commits.

## License

The repository's code is licensed under MIT; see `LICENSE`. Portfolio content and third-party assets may have separate rights.
