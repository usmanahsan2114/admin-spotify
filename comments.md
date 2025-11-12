## Notes
- Chose TypeScript template for stronger typing across the dashboard.
- Added Material UI theme provider up front to simplify dark mode enablement in later steps.
- Root npm scripts now use `npm-run-all`; run `npm run dev` at the repository root to start both servers.
- Backend routes require a JWT for any mutating order/product/user action—default admin credentials are `admin@example.com` / `admin123`.
- New orders submitted via `/test-order` do not require authentication, allowing the marketing site (and this dummy form) to post directly to the API.
