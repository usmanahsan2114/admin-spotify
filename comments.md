## Notes
- Chose TypeScript template for stronger typing across the dashboard.
- Added Material UI theme provider up front to simplify dark mode enablement in later steps.
- Root npm scripts now use `npm-run-all`; run `npm run dev` at the repository root to start both servers.
- Backend routes require a JWT for any mutating order/product/user action—default admin credentials are `admin@example.com` / `admin123`.
- New orders submitted via `/test-order` do not require authentication, allowing the marketing site (and this dummy form) to post directly to the API.
- Theme preference persists via `ThemeModeProvider`, and the navigation shell keeps `/test-order` accessible outside the main dashboard experience.
- Orders page currently relies on the default admin credentials (via `ensureDevAuthToken`) to perform inline status updates until the dedicated auth flow ships.
- Order details timeline entries are generated server-side whenever status/payment fields change; front-end surfaces them in reverse chronological order.
- Products CRUD uses the same dev token helper and performs optimistic updates; delete operations prompt for confirmation before hitting the API.
