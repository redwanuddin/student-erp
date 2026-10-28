'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [students, setStudents] = useState<any[]>([]);
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
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setStudents(data);
      }
      setLoading(false);
    };

    checkAuthAndFetch();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('students')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setStudents(students.map(s => s.id === id ? { ...s, status: newStatus } : s));
    }
  };

  if (loading) return <div className="p-8 text-center text-black">Loading...</div>;

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                    <div className="flex gap-4 items-center">
            <Link href="/admin/applications" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold">
              View Applications
            </Link>
            <Link href="/" className="text-blue-600 hover:underline mt-2">
              Public Form
            </Link>
            <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Log Out
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Name</th>
                <th className="p-4 font-semibold text-gray-600">Destination</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                {/* NEW: Follow-up column */}
                <th className="p-4 font-semibold text-gray-600">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">
                    <Link href={`/admin/student/${student.id}`} className="text-blue-600 hover:underline">
                      {student.full_name}
                    </Link>
                    <div className="text-xs text-gray-500">{student.phone}</div>
                  </td>
                  <td className="p-4 text-black">{student.destination}</td>
                  <td className="p-4">
                    <select
                      value={student.status || 'New'}
                      onChange={(e) => handleStatusChange(student.id, e.target.value)}
                      className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 cursor-pointer font-semibold"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Counseling">Counseling</option>
                      <option value="Applied">Applied</option>
                      <option value="Visa">Visa</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </td>
                  {/* NEW: Show the follow-up date, highlight in red if it's today or past */}
                  <td className="p-4 text-sm">
                    {student.follow_up_date ? (
                      <span className={`font-bold ${
                        new Date(student.follow_up_date) <= new Date() ? 'text-red-600' : 'text-gray-800'
                      }`}>
                        {new Date(student.follow_up_date).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}