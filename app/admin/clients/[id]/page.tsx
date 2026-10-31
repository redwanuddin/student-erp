'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../../lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function DetailContent() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClient = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) setError(error.message);
      else setClient(data);

      setLoading(false);
    };
    fetchClient();
  }, [params.id, router]);

  const handleStatusChange = async (newStatus: string) => {
    if (!client) return;
    setSaving(true);
    const { error } = await supabase
      .from('clients')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', client.id);

    if (error) {
      alert('Could not update status: ' + error.message);
    } else {
      setClient({ ...client, status: newStatus });
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-black">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!client) return <div className="p-8 text-center text-black">Client not found.</div>;

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin" className="text-blue-600 hover:underline font-semibold">&larr; Back to Dashboard</Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-blue-600 p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold">{client.given_name} {client.surname}</h1>
                <p className="text-blue-100 mt-1 text-sm">
                  Submitted {new Date(client.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div>
                <label className="block text-blue-100 text-xs font-semibold mb-1">Status</label>
                <select
                  value={client.status || 'Draft'}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={saving}
                  className="bg-white text-gray-800 font-semibold text-sm rounded-lg px-3 py-2 cursor-pointer disabled:opacity-60"
                >
                  <option value="Draft">Draft</option>
                  <option value="New">New</option>
                  <option value="Lead">Lead</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Counseling">Counseling</option>
                  <option value="Applied">Applied</option>
                  <option value="Visa">Visa</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Passport Number" value={client.passport_number} />
            <Field label="Date of Birth" value={client.date_of_birth} />
            <Field label="Gender" value={client.gender} />
            <Field label="Place of Birth" value={client.place_of_birth} />
            <Field label="National ID (NID)" value={client.nid_number} />
            <Field label="Passport Issue Date" value={client.passport_issue_date} />
            <Field label="Passport Expiry Date" value={client.passport_expiry_date} />
            <Field label="Father's Full Name" value={client.father_full_name} />
            <Field label="Mother's Full Name" value={client.mother_full_name} />
          </div>

          <div className="p-6 border-t grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50">
            <div className="md:col-span-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase">Permanent Address</h3>
              <p className="mt-1 text-lg text-black font-medium">{client.permanent_address || 'N/A'}</p>
            </div>
            <Field label="Post Code" value={client.permanent_post_code} />
            <div className="md:col-span-2">
              <Field label="District" value={client.permanent_district} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Academic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-blue-800 mb-3">{client.hsc_qualification_type || 'HSC'} / Equivalent</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <Row label="Result Date" value={client.hsc_result_publication_date} />
                <Row label="GPA" value={client.hsc_gpa} />
                <Row label="Subject" value={client.hsc_subject} />
                <Row label="Board" value={client.hsc_board} />
                <Row label="City" value={client.hsc_city} />
                <Row label="Institute" value={client.hsc_institute} />
                <Row label="Email" value={client.hsc_email} />
                <Row label="Website" value={client.hsc_website} />
                <Row label="Address" value={client.hsc_address} />
                <Row label="Class Start" value={client.hsc_class_start_date} />
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-blue-800 mb-3">{client.ssc_qualification_type || 'SSC'} / Equivalent</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <Row label="Result Date" value={client.ssc_result_publication_date} />
                <Row label="GPA" value={client.ssc_gpa} />
                <Row label="Subject" value={client.ssc_subject} />
                <Row label="Board" value={client.ssc_board} />
                <Row label="City" value={client.ssc_city} />
                <Row label="Institute" value={client.ssc_institute} />
                <Row label="Email" value={client.ssc_email} />
                <Row label="Website" value={client.ssc_website} />
                <Row label="Address" value={client.ssc_address} />
                <Row label="Class Start" value={client.ssc_class_start_date} />
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t">
            <h3 className="font-bold text-blue-800 mb-3">English Language Test</h3>
            {!client.english_test_name || client.english_test_name === 'Not taken' ? (
              <p className="text-sm text-gray-600">Not taken / Not applicable</p>
            ) : (
              <ul className="text-sm text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-2">
                <Row label="Test" value={client.english_test_name} />
                <Row label="Overall" value={client.english_overall_score} />
                <Row label="Listening" value={client.english_listening} />
                <Row label="Reading" value={client.english_reading} />
                <Row label="Writing" value={client.english_writing} />
                <Row label="Speaking" value={client.english_speaking} />
                <Row label="Test Date" value={client.english_test_date} />
                <Row label="Ref Number" value={client.english_ref_number} />
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Uploaded Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DocCard label="Passport Copy"          url={client.passport_url} />
            <DocCard label="HSC Certificate"        url={client.hsc_certificate_url} />
            <DocCard label="HSC Transcript"         url={client.hsc_transcript_url} />
            <DocCard label="SSC Certificate"        url={client.ssc_certificate_url} />
            <DocCard label="SSC Transcript"         url={client.ssc_transcript_url} />
            <DocCard label="English Certificate"    url={client.english_certificate_url} />
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-500 uppercase">{label}</h3>
      <p className="mt-1 text-lg text-black font-medium">{value || 'N/A'}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <li>
      <strong>{label}:</strong> {value || 'N/A'}
    </li>
  );
}

function DocCard({ label, url }: { label: string; url: string | null | undefined }) {
  return (
    <div className="border p-4 rounded-lg text-center bg-gray-50">
      <h3 className="font-semibold text-gray-700 mb-3">{label}</h3>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 inline-block w-full font-semibold">
          View File
        </a>
      ) : (
        <span className="text-gray-400 font-semibold text-sm">Not Provided</span>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-black">Loading...</div>}>
      <DetailContent />
    </Suspense>
  );
}