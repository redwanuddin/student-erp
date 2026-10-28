'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ApplicationDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', params.id)
        .single();

      if (!error && data) {
        setApp(data);
      }
      setLoading(false);
    };

    fetchApp();
  }, [params.id, router]);

  if (loading) return <div className="p-8 text-center text-black">Loading application...</div>;
  if (!app) return <div className="p-8 text-center text-black">Application not found.</div>;

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/applications" className="text-blue-600 hover:underline font-semibold">
            &larr; Back to Applications
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-green-600 p-6 text-white">
            <h1 className="text-3xl font-bold">{app.given_name} {app.surname}</h1>
            <p className="text-green-100 mt-1">Status: {app.status || 'Draft'}</p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Passport Number</h3>
              <p className="mt-1 text-lg text-black">{app.passport_number || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Date of Birth</h3>
              <p className="mt-1 text-lg text-black">{app.date_of_birth || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">SSC Result Date</h3>
              <p className="mt-1 text-lg text-black">{app.ssc_result_date || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">HSC Result Date</h3>
              <p className="mt-1 text-lg text-black">{app.hsc_result_date || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Uploaded Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Passport */}
            <div className="border p-4 rounded-lg text-center bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-3">Passport</h3>
              {app.passport_url ? (
                <a href={app.passport_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block w-full">
                  View File
                </a>
              ) : (
                <span className="text-red-500 font-semibold">Not Uploaded</span>
              )}
            </div>

            {/* SSC Certificate */}
            <div className="border p-4 rounded-lg text-center bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-3">SSC Certificate</h3>
              {app.ssc_cert_url ? (
                <a href={app.ssc_cert_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block w-full">
                  View File
                </a>
              ) : (
                <span className="text-gray-400 font-semibold">Not Provided</span>
              )}
            </div>

            {/* HSC Certificate */}
            <div className="border p-4 rounded-lg text-center bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-3">HSC Certificate</h3>
              {app.hsc_cert_url ? (
                <a href={app.hsc_cert_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block w-full">
                  View File
                </a>
              ) : (
                <span className="text-gray-400 font-semibold">Not Provided</span>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

export default function ApplicationDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-black">Loading...</div>}>
      <ApplicationDetailContent />
    </Suspense>
  );
}