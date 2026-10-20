// api/supabase-config.js
// Vercel Serverless Function to permanently link Supabase with Vercel and the client web app.
// Automatically serves Supabase connection credentials configured in Vercel Environment Variables.

export default function handler(req, res) {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.REACT_APP_SUPABASE_URL ||
    ""
  ).trim();

  const anonKey = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY ||
    ""
  ).trim();

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');

  return res.status(200).json({
    url,
    anonKey,
    connected: Boolean(url && anonKey),
    linkedWith: "Vercel + Supabase Direct Integration"
  });
}
