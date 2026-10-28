'use client';

import { useState } from 'react';
import { supabase } from './lib/supabase';

export default function Home() {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    destination: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // This sends the data to your Supabase table!
    const { error } = await supabase.from('students').insert([formData]);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Success! Student saved to database.');
      setFormData({ full_name: '', phone: '', email: '', destination: '' }); // clear form
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Student Inquiry Form
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Full Name"
            required
            className="border p-2 rounded text-black"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Phone Number"
            required
            className="border p-2 rounded text-black"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email Address"
            required
            className="border p-2 rounded text-black"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="text"
            placeholder="Destination Country (e.g., UK, Canada)"
            required
            className="border p-2 rounded text-black"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
          />
          
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 mt-2"
          >
            {loading ? 'Saving...' : 'Submit Inquiry'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center font-semibold ${message.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    </main>
  );
}