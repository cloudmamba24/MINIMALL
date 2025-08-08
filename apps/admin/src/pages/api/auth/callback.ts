import type { NextApiRequest, NextApiResponse } from 'next';

// This route just redirects to the main auth handler
// The actual callback logic is handled in /api/auth.ts
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Forward all query parameters to the main auth handler
  const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
  res.redirect(`/api/auth?${queryString}`);
}