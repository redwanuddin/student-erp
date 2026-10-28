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
    given_name: '', surname: '', passport_number: '', date_of_birth: '',
    ssc_result_date: '', hsc_result_date: '',
    
    // SSC Detailed Fields
    ssc_type: 'SSC', ssc_year: '', ssc_gpa: '', ssc_board: '', ssc_city: '', ssc_institute: '', ssc_email: '', ssc_website: '', ssc_address: '', ssc_duration: '',
    
    // HSC Detailed Fields
    hsc_type: 'HSC', hsc_year: '', hsc_gpa: '', hsc_board: '', hsc_city: '', hsc_institute: '', hsc_email: '', hsc_website: '', hsc_address: '', hsc_duration: '',
    
    // English Test Fields
    english_test_name: 'Not taken', english_overall_score: '', english_listening: '', english_reading: '', english_writing: '', english_speaking: '', english_test_date: '', english_ref_number: '',
    
    passport_url: '', ssc_cert_url: '', hsc_cert_url: '',
  });

  useEffect(() => {
    const savedDraft = localStorage.getItem('student_onboarding_draft');
    const savedStep = localStorage.getItem('student_onboarding_step');
    if (savedDraft) {
      try { setFormData(JSON.parse(savedDraft)); } catch (e) {}
    }
    if (savedStep) setStep(Number(savedStep));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      localStorage.setItem('student_onboarding_draft', JSON.stringify(newData));
      return newData;
    });
  };

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    const filePath = `onboarding/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage.from('student-documents').upload(filePath, file);

    if (error) {
      alert('Error uploading file: ' + error.message);
    } else {
      const { data: urlData } = supabase.storage.from('student-documents').getPublicUrl(filePath);
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
    
    // Send everything to Supabase
    const { error } = await supabase.from('applications').insert([{
      ...formData,
      date_of_birth: formData.date_of_birth || null,
      ssc_result_date: formData.ssc_result_date || null,
      hsc_result_date: formData.hsc_result_date || null,
      english_test_date: formData.english_test_date || null,
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
          <p className="text-gray-600 mb-6">Your application has been saved successfully.</p>
          <Link href="/" className="bg-blue-600 text-white font-bold py-2 px-6 rounded hover:bg-blue-700">Return to Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <Link href="/" className="text-blue-600 hover:underline text-sm font-semibold">&larr; Back to Home</Link>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">Student Onboarding</h1>
        </div>

        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{num}</div>
              <span className={`ml-2 text-sm font-semibold hidden md:block ${step >= num ? 'text-blue-600' : 'text-gray-400'}`}>
                {num === 1 && "Personal Info"}{num === 2 && "Academic Info"}{num === 3 && "Documents"}
              </span>
              {num < 3 && <div className={`w-8 md:w-16 h-1 mx-2 rounded ${step > num ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          
          {/* STEP 1: Personal */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">Given Name</label><input type="text" name="given_name" value={formData.given_name} onChange={handleChange} className="w-full border p-2 rounded text-black" placeholder="First name" /></div>
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">Surname</label><input type="text" name="surname" value={formData.surname} onChange={handleChange} className="w-full border p-2 rounded text-black" placeholder="Last name" /></div>
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">Passport Number</label><input type="text" name="passport_number" value={formData.passport_number} onChange={handleChange} className="w-full border p-2 rounded text-black" placeholder="e.g., A01234567" /></div>
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">Date of Birth</label><input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
              </div>
            </div>
          )}

          {/* STEP 2: Detailed Academics */}
          {step === 2 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Academic Information</h2>
              
              {/* SSC Section */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-lg font-bold text-blue-800 mb-4">SSC / Dakhil / Equivalent</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Qualification Type</label><input type="text" name="ssc_type" value={formData.ssc_type} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Passing Year</label><input type="text" name="ssc_year" value={formData.ssc_year} onChange={handleChange} className="w-full border p-2 rounded text-black" placeholder="e.g., 2020" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Result Publication Date</label><input type="date" name="ssc_result_date" value={formData.ssc_result_date} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">GPA / Grade</label><input type="text" name="ssc_gpa" value={formData.ssc_gpa} onChange={handleChange} className="w-full border p-2 rounded text-black" placeholder="e.g., 5.00" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Education Board</label><input type="text" name="ssc_board" value={formData.ssc_board} onChange={handleChange} className="w-full border p-2 rounded text-black" placeholder="e.g., Dhaka" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Education City</label><input type="text" name="ssc_city" value={formData.ssc_city} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Institute Name</label><input type="text" name="ssc_institute" value={formData.ssc_institute} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Institute Email</label><input type="email" name="ssc_email" value={formData.ssc_email} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Institute Website (Optional)</label><input type="url" name="ssc_website" value={formData.ssc_website} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Duration of Education</label><input type="text" name="ssc_duration" value={formData.ssc_duration} onChange={handleChange} className="w-full border p-2 rounded text-black" placeholder="e.g., 2015 - 2020" /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-600 mb-1">School Address</label><input type="text" name="ssc_address" value={formData.ssc_address} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                </div>
              </div>

              {/* HSC Section */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-lg font-bold text-blue-800 mb-4">HSC / Alim / Equivalent</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Qualification Type</label><input type="text" name="hsc_type" value={formData.hsc_type} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Passing Year</label><input type="text" name="hsc_year" value={formData.hsc_year} onChange={handleChange} className="w-full border p-2 rounded text-black" placeholder="e.g., 2022" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Result Publication Date</label><input type="date" name="hsc_result_date" value={formData.hsc_result_date} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">GPA / Grade</label><input type="text" name="hsc_gpa" value={formData.hsc_gpa} onChange={handleChange} className="w-full border p-2 rounded text-black" placeholder="e.g., 5.00" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Education Board</label><input type="text" name="hsc_board" value={formData.hsc_board} onChange={handleChange} className="w-full border p-2 rounded text-black" placeholder="e.g., Dhaka" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Education City</label><input type="text" name="hsc_city" value={formData.hsc_city} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Institute Name</label><input type="text" name="hsc_institute" value={formData.hsc_institute} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Institute Email</label><input type="email" name="hsc_email" value={formData.hsc_email} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Institute Website (Optional)</label><input type="url" name="hsc_website" value={formData.hsc_website} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Duration of Education</label><input type="text" name="hsc_duration" value={formData.hsc_duration} onChange={handleChange} className="w-full border p-2 rounded text-black" placeholder="e.g., 2020 - 2022" /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-600 mb-1">College Address</label><input type="text" name="hsc_address" value={formData.hsc_address} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                </div>
              </div>

              {/* English Test Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-bold text-blue-800 mb-4">English Language Proficiency</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Test Name</label>
                    <select name="english_test_name" value={formData.english_test_name} onChange={handleChange} className="w-full border p-2 rounded text-black">
                      <option value="Not taken">Not taken / Not applicable</option>
                      <option value="IELTS Academic">IELTS Academic</option>
                      <option value="IELTS General Training">IELTS General Training</option>
                      <option value="TOEFL iBT">TOEFL iBT</option>
                      <option value="PTE Academic">PTE Academic</option>
                      <option value="Duolingo English Test">Duolingo English Test</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  {/* Only show score fields if a test is selected */}
                  {formData.english_test_name !== 'Not taken' && (
                    <>
                      <div><label className="block text-sm font-semibold text-gray-600 mb-1">Overall Score</label><input type="text" name="english_overall_score" value={formData.english_overall_score} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                      <div><label className="block text-sm font-semibold text-gray-600 mb-1">Test Date</label><input type="date" name="english_test_date" value={formData.english_test_date} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                      <div><label className="block text-sm font-semibold text-gray-600 mb-1">Listening Score</label><input type="text" name="english_listening" value={formData.english_listening} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                      <div><label className="block text-sm font-semibold text-gray-600 mb-1">Reading Score</label><input type="text" name="english_reading" value={formData.english_reading} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                      <div><label className="block text-sm font-semibold text-gray-600 mb-1">Writing Score</label><input type="text" name="english_writing" value={formData.english_writing} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                      <div><label className="block text-sm font-semibold text-gray-600 mb-1">Speaking Score</label><input type="text" name="english_speaking" value={formData.english_speaking} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                      <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-600 mb-1">Certificate / Reference Number</label><input type="text" name="english_ref_number" value={formData.english_ref_number} onChange={handleChange} className="w-full border p-2 rounded text-black" /></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Documents */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Document Uploads</h2>
              <p className="text-gray-600 mb-4">Please upload clear copies of your documents (PDF or Image).</p>
              
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <label className="block text-sm font-bold text-gray-700 mb-2">Passport Copy *</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'passport_url')} disabled={uploadingField === 'passport_url'} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" />
                {uploadingField === 'passport_url' && <p className="text-blue-600 mt-2 font-semibold">Uploading...</p>}
                {formData.passport_url && uploadingField !== 'passport_url' && (<div className="flex gap-4 mt-2"><span className="text-green-600 font-semibold">✅ Uploaded</span><a href={formData.passport_url} target="_blank" className="text-blue-600 text-sm hover:underline">View File</a></div>)}
              </div>

              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <label className="block text-sm font-bold text-gray-700 mb-2">SSC / Dakhil Certificate</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'ssc_cert_url')} disabled={uploadingField === 'ssc_cert_url'} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" />
                {uploadingField === 'ssc_cert_url' && <p className="text-blue-600 mt-2 font-semibold">Uploading...</p>}
                {formData.ssc_cert_url && uploadingField !== 'ssc_cert_url' && (<div className="flex gap-4 mt-2"><span className="text-green-600 font-semibold">✅ Uploaded</span><a href={formData.ssc_cert_url} target="_blank" className="text-blue-600 text-sm hover:underline">View File</a></div>)}
              </div>

              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <label className="block text-sm font-bold text-gray-700 mb-2">HSC / Alim Certificate</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'hsc_cert_url')} disabled={uploadingField === 'hsc_cert_url'} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" />
                {uploadingField === 'hsc_cert_url' && <p className="text-blue-600 mt-2 font-semibold">Uploading...</p>}
                {formData.hsc_cert_url && uploadingField !== 'hsc_cert_url' && (<div className="flex gap-4 mt-2"><span className="text-green-600 font-semibold">✅ Uploaded</span><a href={formData.hsc_cert_url} target="_blank" className="text-blue-600 text-sm hover:underline">View File</a></div>)}
              </div>

              {formData.english_test_name !== 'Not taken' && (
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <label className="block text-sm font-bold text-gray-700 mb-2">English Test Certificate</label>
                  <p className="text-xs text-gray-500 mb-2">Required because you entered a test score.</p>
                  {/* We will use the same filePath logic for this, adding it later */}
                  <div className="text-sm text-gray-400 italic">Upload coming in final version.</div>
                </div>
              )}

            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <button onClick={prevStep} disabled={step === 1} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded hover:bg-gray-300 disabled:opacity-50">Back</button>
            
            {step < 3 ? (
              <button onClick={nextStep} className="bg-blue-600 text-white font-bold py-2 px-6 rounded hover:bg-blue-700">Next Step</button>
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