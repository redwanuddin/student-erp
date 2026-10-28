'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StudentProfile() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // NEW: State for documents
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', params.id)
        .single();

      if (!error && data) {
        setStudent(data);
        if (data.notes) setNotes(data.notes);
        if (data.follow_up_date) setFollowUpDate(data.follow_up_date);
        
        // NEW: Fetch their documents
        fetchDocuments();
      }
      setLoading(false);
    };

    fetchStudent();
  }, [params.id, router]);

  // NEW: Fetch the list of uploaded files
  const fetchDocuments = async () => {
    const { data, error } = await supabase.storage
      .from('student-documents')
      .list(params.id as string); // Looks inside a folder named after the student's ID

    if (!error && data) {
      setDocuments(data);
    }
  };

  // NEW: Handle the file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    // We create a unique name for the file so two students can both upload "passport.pdf"
    // Format: studentID/17123456789_passport.pdf
    const filePath = `${student.id}/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from('student-documents')
      .upload(filePath, file);

    if (error) {
      alert('Error uploading file: ' + error.message);
    } else {
      // Refresh the document list immediately
      fetchDocuments();
    }
    
    setUploading(false);
    // Clear the input so you can upload another file
    e.target.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');

    const { error } = await supabase
      .from('students')
      .update({ 
        notes: notes,
        follow_up_date: followUpDate || null
      })
      .eq('id', params.id);

    if (error) {
      setSaveMessage('Error saving: ' + error.message);
    } else {
      setSaveMessage('Saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-black">Loading profile...</div>;
  if (!student) return <div className="p-8 text-center text-black">Student not found.</div>;

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="text-blue-600 hover:underline font-semibold">
            &larr; Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-blue-600 p-6 text-white">
            <h1 className="text-3xl font-bold">{student.full_name}</h1>
            <p className="text-blue-100 mt-1">Student ID: {student.id}</p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Phone Number</h3>
              <p className="mt-1 text-lg text-black">{student.phone}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Email Address</h3>
              <p className="mt-1 text-lg text-black">{student.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Destination Country</h3>
              <p className="mt-1 text-lg text-black">{student.destination}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Current Status</h3>
              <p className="mt-1 text-lg font-bold text-blue-600">{student.status || 'New'}</p>
            </div>
          </div>
        </div>

        {/* NEW: Document Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Student Documents</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-600 mb-2">Upload Passport, Certificates, etc.</label>
            <input 
              type="file" 
              onChange={handleFileUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {uploading && <p className="text-blue-600 mt-2 font-semibold">Uploading your file, please wait...</p>}
          </div>

          <ul className="divide-y divide-gray-200 border-t border-gray-200">
            {documents.length === 0 ? (
              <li className="py-4 text-gray-500 text-center">No documents uploaded yet.</li>
            ) : (
              documents.map((doc) => {
                // Get the public link to view/download the file
                const { data: urlData } = supabase.storage
                  .from('student-documents')
                  .getPublicUrl(`${student.id}/${doc.name}`);

                return (
                  <li key={doc.name} className="py-3 flex justify-between items-center">
                    <span className="text-gray-800 font-medium truncate max-w-xs">
                      {/* We clean up the timestamp from the name so it looks nice */}
                      {doc.name.split('_').slice(1).join('_') || doc.name}
                    </span>
                    <a 
                      href={urlData.publicUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-semibold text-sm"
                    >
                      View / Download
                    </a>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Counseling & Follow-up</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-600 mb-1">Next Follow-up Date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg text-black focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-600 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type your notes here..."
              rows={5}
              className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 text-white font-bold py-2 px-6 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Details'}
            </button>
            {saveMessage && (
              <span className={`font-semibold ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {saveMessage}
              </span>
            )}
          </div>
        </div>
        
      </div>
    </main>
  );
}