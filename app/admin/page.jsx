import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/admin-auth';
import AdminLogin from '@/app/components/AdminLogin';
import AdminDashboard from '@/app/components/AdminDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin — Hardware Hub',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const jar = await cookies();
  const autenticato = verifySessionCookie(jar.get('hh_admin')?.value);

  if (!autenticato) {
    return (
      <div className="admin-login-wrap">
        <AdminLogin />
      </div>
    );
  }
  return <AdminDashboard />;
}
