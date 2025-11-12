## Implementation Notes

- Built with Vite + TypeScript + Material UI to provide fast HMR and rich component availability.
- `ThemeModeProvider` persists dark/light preference in `localStorage` for long-running admin sessions.
- JWT token lifecycle is centralized in `AuthContext`; 401 responses trigger auto-logout for session hygiene.
- Orders/products/users pages use MUI DataGrid with optimistic updates and snackbars for UX feedback.
- `/test-order` route posts unauthenticated orders for marketing-site integration; real submissions can reuse the same payload.
- Signup/login components ship with seeded demo values to streamline QA and stakeholder reviews.
- Dashboard analytics rely on Recharts; `minWidth: 0` safeguards prevent negative-size warnings in responsive layouts.
- Mobile-first refinements hide non-critical columns, compact DataGrids, and wrap action toolbars for small breakpoints.
