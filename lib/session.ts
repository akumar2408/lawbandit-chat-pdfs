import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export function getOrCreateSessionId() {
  const cookieStore = cookies();
  const existing = cookieStore.get('lb_session_id')?.value;
  if (existing) return existing;
  const id = uuidv4();
  cookieStore.set('lb_session_id', id, { httpOnly: false, sameSite: 'lax', secure: true, path: '/' });
  return id;
}
