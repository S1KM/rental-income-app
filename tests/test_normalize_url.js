function normalizeSupabaseUrl(raw) {
  if (!raw) return '';
  let u = String(raw).trim().replace(/^["']|["']$/g, '');
  // Match dashboard URL e.g. https://supabase.com/dashboard/project/abcdefghijk
  const dashMatch = u.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/);
  if (dashMatch) {
    return 'https://' + dashMatch[1] + '.supabase.co';
  }
  // If no scheme, add https://
  if (!/^https?:\/\//i.test(u)) {
    u = 'https://' + u;
  }
  // Strip trailing slashes, /rest/v1, /rest
  u = u.replace(/\/+$/, '');
  u = u.replace(/\/rest\/v1\/?$/i, '');
  u = u.replace(/\/rest\/?$/i, '');
  u = u.replace(/\/+$/, '');
  return u;
}

console.log('Case 1:', normalizeSupabaseUrl('https://abc.supabase.co/rest/v1'));
console.log('Case 2:', normalizeSupabaseUrl('https://abc.supabase.co/rest/v1/'));
console.log('Case 3:', normalizeSupabaseUrl('https://supabase.com/dashboard/project/xyz123/settings/api'));
console.log('Case 4:', normalizeSupabaseUrl('https://abc.supabase.co/'));
console.log('Case 5:', normalizeSupabaseUrl('abc.supabase.co'));
