'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [passportError, setPassportError] = useState('');

    const [formData, setFormData] = useState({
    given_name: '', surname: '', passport_number: '', date_of_birth: '',
    gender: '', place_of_birth: '', nid_number: '', passport_issue_date: '', passport_expiry_date: '', father_full_name: '', mother_full_name: '', 
    permanent_address: '', permanent_post_code: '', permanent_district: '',
    
    hsc_qualification_type: 'HSC', hsc_result_publication_date: '', hsc_gpa: '', hsc_subject: '', hsc_board: '', hsc_city: '', hsc_institute: '', hsc_email: '', hsc_website: '', hsc_address: '', hsc_class_start_date: '',
    ssc_qualification_type: 'SSC', ssc_result_publication_date: '', ssc_gpa: '', ssc_subject: '', ssc_board: '', ssc_city: '', ssc_institute: '', ssc_email: '', ssc_website: '', ssc_address: '', ssc_class_start_date: '',
    
    english_test_name: 'Not taken', english_overall_score: '', english_listening: '', english_reading: '', english_writing: '', english_speaking: '', english_test_date: '', english_ref_number: '',
    
    passport_url: '', hsc_certificate_url: '', ssc_certificate_url: '', hsc_transcript_url: '', ssc_transcript_url: '', english_certificate_url: '',
  });

  useEffect(() => {
    const savedDraft = localStorage.getItem('student_onboarding_draft');
    const savedStep = localStorage.getItem('student_onboarding_step');
    if (savedDraft) {
      try { setFormData(JSON.parse(savedDraft)); } catch (e) {}
    }
    if (savedStep) setStep(Number(savedStep));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      localStorage.setItem('student_onboarding_draft', JSON.stringify(newData));
      return newData;
    });
  };

  const checkPassportExists = async () => {
    const passport = formData.passport_number.trim();
    if (!passport) return;
    const { data } = await supabase.from('applications').select('id').eq('passport_number', passport).limit(1);
    if (data && data.length > 0) {
      setPassportError('This passport number is already registered.');
      alert("⚠️ This passport number is already registered in our system.\n\nIf this is you, please log in. Otherwise, please contact us.");
    } else {
      setPassportError('');
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.passport_number.trim()) return alert("Please enter your passport number.");
      if (passportError) return alert("Please resolve the passport number issue before proceeding.");
    }
    const next = Math.min(step + 1, 3);
    setStep(next);
    localStorage.setItem('student_onboarding_step', String(next));
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    const prev = Math.max(step - 1, 1);
    setStep(prev);
    localStorage.setItem('student_onboarding_step', String(prev));
    window.scrollTo(0, 0);
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
      const { data: urlData } = await supabase.storage.from('student-documents').getPublicUrl(filePath);
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
    if (!formData.passport_url || !formData.hsc_certificate_url || !formData.ssc_certificate_url || !formData.hsc_transcript_url || !formData.ssc_transcript_url) {
      alert("Please upload all required certificates and transcripts before submitting.");
      return;
    }
    if (formData.english_test_name !== 'Not taken' && !formData.english_certificate_url) {
      alert("Please upload your English Language Proficiency Certificate.");
      return;
    }

    setLoading(true);
    // Changed to 'clients' table
    const { error } = await supabase.from('clients').insert([{
      ...formData,
      date_of_birth: formData.date_of_birth || null,
      passport_issue_date: formData.passport_issue_date || null,
      passport_expiry_date: formData.passport_expiry_date || null,
      ssc_result_publication_date: formData.ssc_result_publication_date || null,
      hsc_result_publication_date: formData.hsc_result_publication_date || null,
      english_test_date: formData.english_test_date || null,
      status: 'Draft'
    }]);

    if (error) {
      if (error.code === '23505') alert("⚠️ This passport number is already registered.");
      else alert('Error saving application: ' + error.message);
    } else {
      localStorage.removeItem('student_onboarding_draft');
      localStorage.removeItem('student_onboarding_step');
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <main className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-4">Application Submitted!</h1>
          <p className="text-gray-700 mb-6 font-medium">Your application has been successfully submitted.</p>
          
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 text-left">
            <h3 className="font-bold text-blue-800 mb-2">Need help or have questions?</h3>
            <p className="text-sm text-gray-700 mb-1">Please contact our admissions team:</p>
            <p className="text-lg font-bold text-gray-900">📞 +880 1712 345678</p>
            <p className="text-sm text-gray-600 mt-1">Available Sunday - Thursday, 10 AM - 6 PM</p>
          </div>

          <Link href="/" className="bg-blue-600 text-white font-bold py-3 px-6 rounded hover:bg-blue-700 w-full block">Return to Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <Link href="/" className="text-blue-600 hover:underline text-sm font-semibold">&larr; Back to Home</Link>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">Student Onboarding</h1>
        </div>

        <div className="flex justify-between items-center mb-8 bg-white p-3 md:p-4 rounded-lg shadow-sm">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{num}</div>
              <span className={`ml-2 text-xs md:text-sm font-semibold hidden sm:block ${step >= num ? 'text-blue-600' : 'text-gray-400'}`}>
                {num === 1 && "Personal"}{num === 2 && "Academic"}{num === 3 && "Documents"}
              </span>
              {num < 3 && <div className={`w-4 md:w-16 h-1 mx-2 rounded ${step > num ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 md:p-8">
          
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <p className="text-sm text-yellow-700 font-medium">⚠️ Please ensure all information matches exactly as written on your passport.</p>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Personal Information</h2>
              
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">Given Name</label><input type="text" name="given_name" value={formData.given_name} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" placeholder="First name" required /></div>
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">Surname</label><input type="text" name="surname" value={formData.surname} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" placeholder="Last name" required /></div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Passport Number</label>
                  <input type="text" name="passport_number" value={formData.passport_number} onChange={handleChange} onBlur={checkPassportExists} className={`w-full border p-3 rounded text-black text-base ${passportError ? 'border-red-500 bg-red-50' : ''}`} placeholder="e.g., A01234567" required />
                  {passportError && <p className="text-red-600 text-sm font-semibold mt-1">{passportError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border p-3 rounded text-black text-base bg-white" required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">Date of Birth</label><input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">Place of Birth</label><input type="text" name="place_of_birth" value={formData.place_of_birth} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" placeholder="City/Country" required /></div>
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">National ID (NID) Number</label><input type="text" name="nid_number" value={formData.nid_number} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" placeholder="Optional if under 18" /></div>
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">Passport Date of Issue</label><input type="date" name="passport_issue_date" value={formData.passport_issue_date} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">Passport Date of Expiry</label><input type="date" name="passport_expiry_date" value={formData.passport_expiry_date} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">Father's Full Name</label><input type="text" name="father_full_name" value={formData.father_full_name} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                <div><label className="block text-sm font-semibold text-gray-600 mb-1">Mother's Full Name</label><input type="text" name="mother_full_name" value={formData.mother_full_name} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
              </div>

              <div className="pt-4 border-t mt-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Permanent Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-3"><label className="block text-sm font-semibold text-gray-600 mb-1">Address (Street, Village, House)</label><input type="text" name="permanent_address" value={formData.permanent_address} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" placeholder="e.g., House 12, Road 5, Mirpur" required /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Post Code</label><input type="text" name="permanent_post_code" value={formData.permanent_post_code} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" placeholder="e.g., 1216" required /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-600 mb-1">District</label><input type="text" name="permanent_district" value={formData.permanent_district} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" placeholder="e.g., Dhaka" required /></div>
                </div>
              </div>
              </div>
  
          )}          
          
          {step === 2 && (
            <div className="space-y-8">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <p className="text-sm text-yellow-700 font-medium">⚠️ All information should be as per your original Certificates.</p>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">Academic Information</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-lg font-bold text-blue-800 mb-4">1. College / Equivalent</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Qualification Type</label>
                    <select name="hsc_qualification_type" value={formData.hsc_qualification_type} onChange={handleChange} className="w-full border p-3 rounded text-black text-base bg-white" required>
                      <option value="HSC">HSC</option>
                      <option value="Alim">Alim</option>
                      <option value="HSC (Vocational)">HSC (Vocational)</option>
                      <option value="Diploma">Diploma</option>
                      <option value="O Level">O Level</option>
                    </select>
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Result Publication Date</label><input type="date" name="hsc_result_publication_date" value={formData.hsc_result_publication_date} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">GPA / Grade</label><input type="text" name="hsc_gpa" value={formData.hsc_gpa} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" placeholder="e.g., 5.00" required /></div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Subject</label>
                    <select name="hsc_subject" value={formData.hsc_subject} onChange={handleChange} className="w-full border p-3 rounded text-black text-base bg-white" required>
                      <option value="">Select Subject</option>
                      <option value="Science">Science</option>
                      <option value="Business Studies">Business Studies</option>
                      <option value="Humanities">Humanities</option>
                      <option value="General">General</option>
                      <option value="Technical">Technical</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Education Board</label><input type="text" name="hsc_board" value={formData.hsc_board} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" placeholder="e.g., Dhaka" required /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Education City</label><input type="text" name="hsc_city" value={formData.hsc_city} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Name of the College/Institute</label><input type="text" name="hsc_institute" value={formData.hsc_institute} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Institute Email</label><input type="email" name="hsc_email" value={formData.hsc_email} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Institute Website</label><input type="url" name="hsc_website" value={formData.hsc_website} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Class Start Date</label><input type="date" name="hsc_class_start_date" value={formData.hsc_class_start_date} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-600 mb-1">College Address</label><input type="text" name="hsc_address" value={formData.hsc_address} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-lg font-bold text-blue-800 mb-4">2. High School / Equivalent</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Qualification Type</label>
                    <select name="ssc_qualification_type" value={formData.ssc_qualification_type} onChange={handleChange} className="w-full border p-3 rounded text-black text-base bg-white" required>
                      <option value="SSC">SSC</option>
                      <option value="Dakhil">Dakhil</option>
                      <option value="SSC (Vocational)">SSC (Vocational)</option>
                      <option value="A Level">A Level</option>
                    </select>
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Result Publication Date</label><input type="date" name="ssc_result_publication_date" value={formData.ssc_result_publication_date} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">GPA / Grade</label><input type="text" name="ssc_gpa" value={formData.ssc_gpa} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" placeholder="e.g., 5.00" required /></div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Subject</label>
                    <select name="ssc_subject" value={formData.ssc_subject} onChange={handleChange} className="w-full border p-3 rounded text-black text-base bg-white" required>
                      <option value="">Select Subject</option>
                      <option value="Science">Science</option>
                      <option value="Business Studies">Business Studies</option>
                      <option value="Humanities">Humanities</option>
                      <option value="General">General</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Education Board</label><input type="text" name="ssc_board" value={formData.ssc_board} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" placeholder="e.g., Dhaka" required /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Education City</label><input type="text" name="ssc_city" value={formData.ssc_city} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Name of the High School/Institute</label><input type="text" name="ssc_institute" value={formData.ssc_institute} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Institute Email</label><input type="email" name="ssc_email" value={formData.ssc_email} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Institute Website</label><input type="url" name="ssc_website" value={formData.ssc_website} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                  <div><label className="block text-sm font-semibold text-gray-600 mb-1">Class Start Date</label><input type="date" name="ssc_class_start_date" value={formData.ssc_class_start_date} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-600 mb-1">School Address</label><input type="text" name="ssc_address" value={formData.ssc_address} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-bold text-blue-800 mb-4">English Language Proficiency</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Test Name</label>
                    <select name="english_test_name" value={formData.english_test_name} onChange={handleChange} className="w-full border p-3 rounded text-black text-base bg-white" required>
                      <option value="Not taken">Not taken / Not applicable</option>
                      <option value="IELTS Academic">IELTS Academic</option>
                      <option value="IELTS General Training">IELTS General Training</option>
                      <option value="TOEFL iBT">TOEFL iBT</option>
                      <option value="PTE Academic">PTE Academic</option>
                      <option value="Duolingo English Test">Duolingo English Test</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {formData.english_test_name !== 'Not taken' && (
                    <>
                      <div><label className="block text-sm font-semibold text-gray-600 mb-1">Overall Score</label><input type="text" name="english_overall_score" value={formData.english_overall_score} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                      <div><label className="block text-sm font-semibold text-gray-600 mb-1">Test Date</label><input type="date" name="english_test_date" value={formData.english_test_date} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                      <div><label className="block text-sm font-semibold text-gray-600 mb-1">Listening Score</label><input type="text" name="english_listening" value={formData.english_listening} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                      <div><label className="block text-sm font-semibold text-gray-600 mb-1">Reading Score</label><input type="text" name="english_reading" value={formData.english_reading} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                      <div><label className="block text-sm font-semibold text-gray-600 mb-1">Writing Score</label><input type="text" name="english_writing" value={formData.english_writing} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                      <div><label className="block text-sm font-semibold text-gray-600 mb-1">Speaking Score</label><input type="text" name="english_speaking" value={formData.english_speaking} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                      <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-600 mb-1">Certificate / Reference Number</label><input type="text" name="english_ref_number" value={formData.english_ref_number} onChange={handleChange} className="w-full border p-3 rounded text-black text-base" required /></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">Document Uploads</h2>
              <p className="text-gray-600 mb-4">Please upload clear copies of your documents (PDF or Image). All marked with * are mandatory.</p>
              
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <label className="block text-sm font-bold text-gray-700 mb-2">Passport Copy *</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'passport_url')} disabled={uploadingField === 'passport_url'} className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" required />
                {uploadingField === 'passport_url' && <p className="text-blue-600 mt-2 font-semibold">Uploading...</p>}
                {formData.passport_url && uploadingField !== 'passport_url' && (<div className="flex gap-4 mt-2"><span className="text-green-600 font-semibold">✅ Uploaded</span><a href={formData.passport_url} target="_blank" className="text-blue-600 text-sm hover:underline">View File</a></div>)}
              </div>

              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <label className="block text-sm font-bold text-gray-700 mb-2">{formData.hsc_qualification_type} Certificate *</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'hsc_certificate_url')} disabled={uploadingField === 'hsc_certificate_url'} className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" required />
                {uploadingField === 'hsc_certificate_url' && <p className="text-blue-600 mt-2 font-semibold">Uploading...</p>}
                {formData.hsc_certificate_url && uploadingField !== 'hsc_certificate_url' && (<div className="flex gap-4 mt-2"><span className="text-green-600 font-semibold">✅ Uploaded</span><a href={formData.hsc_certificate_url} target="_blank" className="text-blue-600 text-sm hover:underline">View File</a></div>)}
              </div>

              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <label className="block text-sm font-bold text-gray-700 mb-2">{formData.hsc_qualification_type} Transcript *</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'hsc_transcript_url')} disabled={uploadingField === 'hsc_transcript_url'} className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" required />
                {uploadingField === 'hsc_transcript_url' && <p className="text-blue-600 mt-2 font-semibold">Uploading...</p>}
                {formData.hsc_transcript_url && uploadingField !== 'hsc_transcript_url' && (<div className="flex gap-4 mt-2"><span className="text-green-600 font-semibold">✅ Uploaded</span><a href={formData.hsc_transcript_url} target="_blank" className="text-blue-600 text-sm hover:underline">View File</a></div>)}
              </div>

              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <label className="block text-sm font-bold text-gray-700 mb-2">{formData.ssc_qualification_type} Certificate *</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'ssc_certificate_url')} disabled={uploadingField === 'ssc_certificate_url'} className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" required />
                {uploadingField === 'ssc_certificate_url' && <p className="text-blue-600 mt-2 font-semibold">Uploading...</p>}
                {formData.ssc_certificate_url && uploadingField !== 'ssc_certificate_url' && (<div className="flex gap-4 mt-2"><span className="text-green-600 font-semibold">✅ Uploaded</span><a href={formData.ssc_certificate_url} target="_blank" className="text-blue-600 text-sm hover:underline">View File</a></div>)}
              </div>

              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <label className="block text-sm font-bold text-gray-700 mb-2">{formData.ssc_qualification_type} Transcript *</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'ssc_transcript_url')} disabled={uploadingField === 'ssc_transcript_url'} className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" required />
                {uploadingField === 'ssc_transcript_url' && <p className="text-blue-600 mt-2 font-semibold">Uploading...</p>}
                {formData.ssc_transcript_url && uploadingField !== 'ssc_transcript_url' && (<div className="flex gap-4 mt-2"><span className="text-green-600 font-semibold">✅ Uploaded</span><a href={formData.ssc_transcript_url} target="_blank" className="text-blue-600 text-sm hover:underline">View File</a></div>)}
              </div>

              {formData.english_test_name !== 'Not taken' && (
                <div className="p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                  <label className="block text-sm font-bold text-blue-800 mb-2">English Language Proficiency Certificate *</label>
                  <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'english_certificate_url')} disabled={uploadingField === 'english_certificate_url'} className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-200 file:text-blue-800 hover:file:bg-blue-300 cursor-pointer" required />
                  {uploadingField === 'english_certificate_url' && <p className="text-blue-600 mt-2 font-semibold">Uploading...</p>}
                  {formData.english_certificate_url && uploadingField !== 'english_certificate_url' && (<div className="flex gap-4 mt-2"><span className="text-green-600 font-semibold">✅ Uploaded</span><a href={formData.english_certificate_url} target="_blank" className="text-blue-600 text-sm hover:underline">View File</a></div>)}
                </div>
              )}
            </div>
          )}

          <div className={`flex mt-8 pt-6 border-t ${step > 1 ? 'justify-between' : 'justify-end'}`}>
            {step > 1 && (
              <button onClick={prevStep} className="bg-gray-200 text-gray-700 font-bold py-3 px-8 rounded hover:bg-gray-300 text-base">
                Back
              </button>
            )}
            
            {step < 3 ? (
              <button onClick={nextStep} className="bg-blue-600 text-white font-bold py-3 px-8 rounded hover:bg-blue-700 text-base">
                Next Step
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading || !formData.passport_url} className="bg-green-600 text-white font-bold py-3 px-8 rounded hover:bg-green-700 disabled:bg-gray-400 text-base">
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}