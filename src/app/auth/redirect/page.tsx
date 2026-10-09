import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getRoleHome } from '@/lib/permissions';

export default async function AuthRedirectPage() {
  const user = await requireUser();
  const destination = getRoleHome(user.role);
  redirect(destination);
}
