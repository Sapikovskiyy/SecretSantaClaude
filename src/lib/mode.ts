/**
 * App mode. Demo Mode is explicit: VITE_DEMO_MODE=true (or `vite --mode demo`).
 * Without it the app is a production build and must never fall back to local mocks —
 * until the backend exists it shows an honest "server not connected" screen.
 */
export const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.MODE === 'demo'
