'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function ApplicationsContent() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setApplications(data);
      }
      setLoading(false);
    };

    checkAuthAndFetch();
  }, [router]);

  if (loading) return <div className="p-8 text-center text-black">Loading applications...</div>;

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-blue-600 hover:underline font-semibold">
            &larr; Back to Inquiries
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-8">Onboarding Applications</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Date</th>
                <th className="p-4 font-semibold text-gray-600">Name</th>
                <th className="p-4 font-semibold text-gray-600">Passport</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No onboarding applications found yet.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-medium text-black">
                      {app.given_name} {app.surname}
                    </td>
                    <td className="p-4 text-black">{app.passport_number || 'N/A'}</td>
                    <td className="p-4">
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        {app.status || 'Draft'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-black">Loading...</div>}>
      <ApplicationsContent />
    </Suspense>
  );
}