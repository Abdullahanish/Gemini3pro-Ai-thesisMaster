import React, { useState } from 'react';
import InputForm from './components/InputForm';
import ThesisEditor from './components/ThesisEditor';
import QAGenerator from './components/QAGenerator';
import { StudentInfo, ThesisSection, INITIAL_SECTIONS } from './types';
import { BookOpen, PenTool, GraduationCap } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [logo, setLogo] = useState<string | null>(null);
  
  const [info, setInfo] = useState<StudentInfo>({
    topic: '',
    studentName: '',
    rollNumber: '',
    ects: '',
    degree: '',
    department: '',
    university: '',
    supervisor: '',
    submissionYear: new Date().getFullYear().toString(),
    groupMembers: '',
    targetPages: '',
  });

  const [sections, setSections] = useState<ThesisSection[]>(INITIAL_SECTIONS);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="bg-blue-600 p-2 rounded-lg text-white">
                <GraduationCap size={24} />
             </div>
             <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">ThesisMaster AI</h1>
                <p className="text-xs text-gray-500 font-medium">Research Assistant & Format Generator</p>
             </div>
          </div>
          
          {/* Progress Steps */}
          <div className="hidden md:flex items-center space-x-4 text-sm font-medium">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 border-2 ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>1</div>
                Details
            </div>
            <div className={`h-0.5 w-8 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 border-2 ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>2</div>
                Write
            </div>
            <div className={`h-0.5 w-8 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 border-2 ${step >= 3 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>3</div>
                Export
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {step === 1 && (
            <InputForm 
                info={info} 
                setInfo={setInfo} 
                setLogo={setLogo} 
                logo={logo}
                onNext={() => setStep(2)} 
            />
        )}
        
        {step === 2 && (
            <ThesisEditor 
                info={info} 
                sections={sections} 
                setSections={setSections}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
            />
        )}

        {step === 3 && (
            <QAGenerator 
                info={info} 
                sections={sections} 
                logo={logo}
                onBack={() => setStep(2)} 
            />
        )}
      </main>

    </div>
  );
};

export default App;