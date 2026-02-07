import React from 'react';
import { StudentInfo } from '../types';
import { Upload, FileText } from 'lucide-react';

interface Props {
  info: StudentInfo;
  setInfo: (info: StudentInfo) => void;
  setLogo: (logo: string | null) => void;
  logo: string | null;
  onNext: () => void;
}

const InputForm: React.FC<Props> = ({ info, setInfo, setLogo, logo, onNext }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInfo({ ...info, [name]: value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check for PDF
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file for the example paper.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setInfo({ ...info, referenceFile: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Basic validation - optional fields are allowed to be empty
  const isFormValid = info.topic && info.university;

  // Common input class to ensure visibility and consistent styling
  const inputClass = "w-full p-3 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition";

  return (
    <div className="max-w-4xl mx-auto bg-white text-gray-900 p-8 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Thesis Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Info */}
        <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Thesis Topic *</label>
            <input
                type="text"
                name="topic"
                value={info.topic}
                onChange={handleChange}
                placeholder="e.g., An NLP-Based Intelligent Chatbot for Academic Assistance"
                className={inputClass}
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Name / Lead Author</label>
            <input
                type="text"
                name="studentName"
                value={info.studentName}
                onChange={handleChange}
                placeholder="Full Name (Optional)"
                className={inputClass}
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
            <input
                type="text"
                name="rollNumber"
                value={info.rollNumber}
                onChange={handleChange}
                placeholder="Registration ID"
                className={inputClass}
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Degree Program</label>
            <input
                type="text"
                name="degree"
                value={info.degree}
                onChange={handleChange}
                placeholder="e.g., BS Computer Science"
                className={inputClass}
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ECTS / Credits</label>
            <input
                type="text"
                name="ects"
                value={info.ects}
                onChange={handleChange}
                placeholder="e.g., 30 ECTS"
                className={inputClass}
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
                type="text"
                name="department"
                value={info.department}
                onChange={handleChange}
                placeholder="e.g., Department of CS"
                className={inputClass}
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">University Name *</label>
            <input
                type="text"
                name="university"
                value={info.university}
                onChange={handleChange}
                placeholder="University Name"
                className={inputClass}
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Name</label>
            <input
                type="text"
                name="supervisor"
                value={info.supervisor}
                onChange={handleChange}
                placeholder="Dr. Name"
                className={inputClass}
            />
        </div>

         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Members</label>
            <input
                type="text"
                name="groupMembers"
                value={info.groupMembers}
                onChange={handleChange}
                placeholder="Separate by comma (Optional)"
                className={inputClass}
            />
        </div>

         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Submission Year</label>
            <input
                type="text"
                name="submissionYear"
                value={info.submissionYear}
                onChange={handleChange}
                placeholder="2024"
                className={inputClass}
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Pages (Approx.)</label>
            <input
                type="number"
                name="targetPages"
                value={info.targetPages}
                onChange={handleChange}
                placeholder="e.g. 50"
                min="1"
                max="800"
                className={inputClass}
            />
        </div>

        <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">University Logo (Optional)</label>
                <div className="flex items-center space-x-4 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition h-24 bg-gray-50">
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoChange} 
                        className="hidden" 
                        id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer flex items-center space-x-2 text-blue-600 font-medium">
                        <Upload size={20} />
                        <span>Upload Logo</span>
                    </label>
                    {logo && <img src={logo} alt="Logo Preview" className="h-12 w-12 object-contain" />}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Example Thesis/Paper (PDF)</label>
                <div className="flex items-center space-x-4 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition h-24 bg-gray-50">
                    <input 
                        type="file" 
                        accept="application/pdf" 
                        onChange={handleReferenceChange} 
                        className="hidden" 
                        id="ref-upload"
                    />
                    <label htmlFor="ref-upload" className="cursor-pointer flex items-center space-x-2 text-blue-600 font-medium">
                        <FileText size={20} />
                        <span>Upload PDF</span>
                    </label>
                    {info.referenceFile && (
                         <div className="text-green-600 text-sm font-semibold flex items-center">
                            <CheckCircleIcon />
                            <span className="ml-1">Loaded</span>
                         </div>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Used by AI as context/style guide.</p>
            </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
            onClick={onNext}
            disabled={!isFormValid}
            className={`px-8 py-3 rounded-lg text-white font-semibold shadow-md transition-all ${
                isFormValid 
                ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
        >
            Next: Generate Content
        </button>
      </div>
    </div>
  );
};

// Simple Icon component for local use
const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

export default InputForm;