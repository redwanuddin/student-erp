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
      const { data, error } = await supabase.from('applications').select('*').eq('id', params.id).single();
      if (!error && data) setApp(data);
      setLoading(false);
    };
    fetchApp();
  }, [params.id, router]);

  if (loading) return <div className="p-8 text-center text-black">Loading...</div>;
  if (!app) return <div className="p-8 text-center text-black">Application not found.</div>;

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/applications" className="text-blue-600 hover:underline font-semibold">&larr; Back</Link>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-green-600 p-6 text-white">
            <h1 className="text-3xl font-bold">{app.given_name} {app.surname}</h1>
            <p className="text-green-100 mt-1">Status: {app.status || 'Draft'}</p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><h3 className="text-sm font-semibold text-gray-500">Passport Number</h3><p className="mt-1 text-lg text-black">{app.passport_number || 'N/A'}</p></div>
            <div><h3 className="text-sm font-semibold text-gray-500">Date of Birth</h3><p className="mt-1 text-lg text-black">{app.date_of_birth || 'N/A'}</p></div>
          </div>
        </div>

        {/* Academic Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Academic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* SSC */}
            <div>
              <h3 className="font-bold text-blue-800 mb-2">SSC / Dakhil</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Type:</strong> {app.ssc_type || 'N/A'}</li>
                <li><strong>Year:</strong> {app.ssc_year || 'N/A'}</li>
                <li><strong>Result Date:</strong> {app.ssc_result_date || 'N/A'}</li>
                <li><strong>GPA:</strong> {app.ssc_gpa || 'N/A'}</li>
                <li><strong>Board:</strong> {app.ssc_board || 'N/A'}</li>
                <li><strong>City:</strong> {app.ssc_city || 'N/A'}</li>
                <li><strong>Institute:</strong> {app.ssc_institute || 'N/A'}</li>
                <li><strong>Institute Email:</strong> {app.ssc_email || 'N/A'}</li>
                <li><strong>Duration:</strong> {app.ssc_duration || 'N/A'}</li>
              </ul>
            </div>
            
            {/* HSC */}
            <div>
              <h3 className="font-bold text-blue-800 mb-2">HSC / Alim</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li><strong>Type:</strong> {app.hsc_type || 'N/A'}</li>
                <li><strong>Year:</strong> {app.hsc_year || 'N/A'}</li>
                <li><strong>Result Date:</strong> {app.hsc_result_date || 'N/A'}</li>
                <li><strong>GPA:</strong> {app.hsc_gpa || 'N/A'}</li>
                <li><strong>Board:</strong> {app.hsc_board || 'N/A'}</li>
                <li><strong>City:</strong> {app.hsc_city || 'N/A'}</li>
                <li><strong>Institute:</strong> {app.hsc_institute || 'N/A'}</li>
                <li><strong>Institute Email:</strong> {app.hsc_email || 'N/A'}</li>
                <li><strong>Duration:</strong> {app.hsc_duration || 'N/A'}</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t">
             <h3 className="font-bold text-blue-800 mb-2">English Test</h3>
             {app.english_test_name === 'Not taken' ? (
               <p className="text-sm text-gray-700">Student has not taken an English test.</p>
             ) : (
               <ul className="text-sm text-gray-700 space-y-1">
                 <li><strong>Test:</strong> {app.english_test_name}</li>
                 <li><strong>Overall Score:</strong> {app.english_overall_score || 'N/A'}</li>
                 <li><strong>Listening:</strong> {app.english_listening || 'N/A'}</li>
                 <li><strong>Reading:</strong> {app.english_reading || 'N/A'}</li>
                 <li><strong>Writing:</strong> {app.english_writing || 'N/A'}</li>
                 <li><strong>Speaking:</strong> {app.english_speaking || 'N/A'}</li>
                 <li><strong>Test Date:</strong> {app.english_test_date || 'N/A'}</li>
                 <li><strong>Ref Number:</strong> {app.english_ref_number || 'N/A'}</li>
               </ul>
             )}
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Uploaded Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border p-4 rounded-lg text-center bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-3">Passport</h3>
              {app.passport_url ? <a href={app.passport_url} target="_blank" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block w-full">View File</a> : <span className="text-red-500 font-semibold">Missing</span>}
            </div>
            <div className="border p-4 rounded-lg text-center bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-3">SSC Cert</h3>
              {app.ssc_cert_url ? <a href={app.ssc_cert_url} target="_blank" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block w-full">View File</a> : <span className="text-gray-400 font-semibold">Not Provided</span>}
            </div>
            <div className="border p-4 rounded-lg text-center bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-3">HSC Cert</h3>
              {app.hsc_cert_url ? <a href={app.hsc_cert_url} target="_blank" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block w-full">View File</a> : <span className="text-gray-400 font-semibold">Not Provided</span>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ApplicationDetailPage() {
  return <Suspense fallback={<div className="p-8 text-center text-black">Loading...</div>}><ApplicationDetailContent /></Suspense>;
}