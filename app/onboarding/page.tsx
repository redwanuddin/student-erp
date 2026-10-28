'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    given_name: '',
    surname: '',
    passport_number: '',
    date_of_birth: '',
    ssc_result_date: '',
    hsc_result_date: '',
    passport_url: '',
    ssc_certificate_url: '',
    hsc_certificate_url: '',
  });

  // 1. Load the draft AND the step when the page opens
  useEffect(() => {
    const savedDraft = localStorage.getItem('student_onboarding_draft');
    const savedStep = localStorage.getItem('student_onboarding_step');
    
    if (savedDraft) {
      try { setFormData(JSON.parse(savedDraft)); } catch (e) {}
    }
    if (savedStep) {
      setStep(Number(savedStep));
    }
  }, []);

  // 2. Update fields safely
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      localStorage.setItem('student_onboarding_draft', JSON.stringify(newData));
      return newData;
    });
  };

  // 3. Navigation saves the step
  const nextStep = () => {
    const next = Math.min(step + 1, 3);
    setStep(next);
    localStorage.setItem('student_onboarding_step', String(next));
  };

  const prevStep = () => {
    const prev = Math.max(step - 1, 1);
    setStep(prev);
    localStorage.setItem('student_onboarding_step', String(prev));
  };

  // 4. Generic upload function for any document
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    const filePath = `onboarding/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from('student-documents')
      .upload(filePath, file);

    if (error) {
      alert('Error uploading file: ' + error.message);
    } else {
      const { data: urlData } = supabase.storage
        .from('student-documents')
        .getPublicUrl(filePath);
        
      setFormData((prev) => {
        const newData = { ...prev, [fieldName]: urlData.publicUrl };
        localStorage.setItem('student_onboarding_draft', JSON.stringify(newData));
        return newData;
      });
    }
    
    setUploadingField(null);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    const { error } = await supabase.from('applications').insert([{
      given_name: formData.given_name,
      surname: formData.surname,
      passport_number: formData.passport_number,
      date_of_birth: formData.date_of_birth || null,
      ssc_result_date: formData.ssc_result_date || null,
      hsc_result_date: formData.hsc_result_date || null,
      passport_url: formData.passport_url || null,
      ssc_certificate_url: formData.ssc_certificate_url || null,
      hsc_certificate_url: formData.hsc_certificate_url || null,
      status: 'Draft'
    }]);

    if (error) {
      alert('Error saving application: ' + error.message);
    } else {
      localStorage.removeItem('student_onboarding_draft');
      localStorage.removeItem('student_onboarding_step');
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-4">Application Saved!</h1>
          <p className="text-gray-600 mb-6">Your draft has been saved to the database successfully.</p>
          <Link href="/" className="bg-blue-600 text-white font-bold py-2 px-6 rounded hover:bg-blue-700">
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-8 text-center">
          <Link href="/" className="text-blue-600 hover:underline text-sm font-semibold">
            &larr; Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">Student Onboarding</h1>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {num}
              </div>
              <span className={`ml-2 text-sm font-semibold hidden md:block ${
                step >= num ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {num === 1 && "Personal Info"}
                {num === 2 && "Academic Info"}
                {num === 3 && "Documents"}
              </span>
              {num < 3 && <div className={`w-8 md:w-16 h-1 mx-2 rounded ${step > num ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          
          {/* STEP 1: No more uploads here */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Step 1: Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Given Name</label>
                  <input type="text" name="given_name" value={formData.given_name} onChange={handleChange} className="w-full border p-2 rounded text-black" placeholder="First name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Surname</label>
                  <input type="text" name="surname" value={formData.surname} onChange={handleChange} className="w-full border p-2 rounded text-black" placeholder="Last name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Passport Number</label>
                  <input type="text" name="passport_number" value={formData.passport_number} onChange={handleChange} className="w-full border p-2 rounded text-black" placeholder="e.g., A01234567" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Date of Birth</label>
                  <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full border p-2 rounded text-black" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Step 2: Academic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">SSC Result Date</label>
                  <input type="date" name="ssc_result_date" value={formData.ssc_result_date} onChange={handleChange} className="w-full border p-2 rounded text-black" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">HSC Result Date</label>
                  <input type="date" name="hsc_result_date" value={formData.hsc_result_date} onChange={handleChange} className="w-full border p-2 rounded text-black" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ALL UPLOADS GO HERE */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Step 3: Document Uploads</h2>
              <p className="text-gray-600 mb-4">Please upload clear copies of your documents (PDF or Image).</p>
              
              {/* Passport Upload */}
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <label className="block text-sm font-bold text-gray-700 mb-2">Passport Copy *</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'passport_url')} disabled={uploadingField === 'passport_url'} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" />
                {uploadingField === 'passport_url' && <p className="text-blue-600 mt-2 font-semibold">Uploading...</p>}
                {formData.passport_url && uploadingField !== 'passport_url' && (
                  <div className="flex gap-4 mt-2">
                    <span className="text-green-600 font-semibold">✅ Uploaded</span>
                    <a href={formData.passport_url} target="_blank" className="text-blue-600 text-sm hover:underline">View File</a>
                  </div>
                )}
              </div>

              {/* SSC Certificate Upload */}
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <label className="block text-sm font-bold text-gray-700 mb-2">SSC / Dakhil Certificate</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'ssc_certificate_url')} disabled={uploadingField === 'ssc_certificate_url'} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" />
                {uploadingField === 'ssc_certificate_url' && <p className="text-blue-600 mt-2 font-semibold">Uploading...</p>}
                {formData.ssc_certificate_url && uploadingField !== 'ssc_certificate_url' && (
                  <div className="flex gap-4 mt-2">
                    <span className="text-green-600 font-semibold">✅ Uploaded</span>
                    <a href={formData.ssc_certificate_url} target="_blank" className="text-blue-600 text-sm hover:underline">View File</a>
                  </div>
                )}
              </div>

              {/* HSC Certificate Upload */}
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <label className="block text-sm font-bold text-gray-700 mb-2">HSC / Alim Certificate</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'hsc_certificate_url')} disabled={uploadingField === 'hsc_certificate_url'} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" />
                {uploadingField === 'hsc_certificate_url' && <p className="text-blue-600 mt-2 font-semibold">Uploading...</p>}
                {formData.hsc_certificate_url && uploadingField !== 'hsc_certificate_url' && (
                  <div className="flex gap-4 mt-2">
                    <span className="text-green-600 font-semibold">✅ Uploaded</span>
                    <a href={formData.hsc_certificate_url} target="_blank" className="text-blue-600 text-sm hover:underline">View File</a>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button onClick={prevStep} disabled={step === 1} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded hover:bg-gray-300 disabled:opacity-50">
              Back
            </button>
            
            {step < 3 ? (
              <button onClick={nextStep} className="bg-blue-600 text-white font-bold py-2 px-6 rounded hover:bg-blue-700">
                Next Step
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading || !formData.passport_url} className="bg-green-600 text-white font-bold py-2 px-6 rounded hover:bg-green-700 disabled:bg-gray-400">
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}