import React, { useState } from 'react';
import { QAPair, StudentInfo, ThesisSection } from '../types';
import { generateInterviewQuestions } from '../services/geminiService';
import { generateThesisDoc, generateQADoc } from '../services/docxGenerator';
import { generateThesisPDF } from '../services/pdfGenerator';
import { Download, FileText, HelpCircle, Loader, ArrowLeft } from 'lucide-react';

interface Props {
  info: StudentInfo;
  sections: ThesisSection[];
  logo: string | null;
  onBack: () => void;
}

const QAGenerator: React.FC<Props> = ({ info, sections, logo, onBack }) => {
  const [qaList, setQaList] = useState<QAPair[]>([]);
  const [isLoadingQA, setIsLoadingQA] = useState(false);
  const [hasGeneratedQA, setHasGeneratedQA] = useState(false);

  const handleGenerateQA = async () => {
    setIsLoadingQA(true);
    
    // Aggregate content
    const fullText = sections.map(s => `${s.title}\n${s.content}`).join('\n\n');
    
    const resultJson = await generateInterviewQuestions(info, fullText);
    try {
        // Simple JSON parse cleanup in case MD formatting was returned
        const cleanedJson = resultJson.replace(/```json/g, '').replace(/```/g, '');
        const parsed = JSON.parse(cleanedJson);
        setQaList(parsed);
        setHasGeneratedQA(true);
    } catch (e) {
        console.error("Failed to parse QA JSON", e);
        alert("Failed to generate structured questions. Please try again.");
    } finally {
        setIsLoadingQA(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-blue-600 transition">
            <ArrowLeft size={20} className="mr-2"/> Back to Editing
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Finalize & Export</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Q&A Generation */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <HelpCircle className="mr-2 text-purple-600" />
                            Defense (Viva) Prep
                        </h3>
                        <p className="text-sm text-gray-500">Generate potential questions based on your thesis content.</p>
                    </div>
                    <button 
                        onClick={handleGenerateQA} 
                        disabled={isLoadingQA}
                        className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300 transition shadow-sm font-medium flex items-center"
                    >
                        {isLoadingQA ? <Loader size={18} className="animate-spin mr-2"/> : <HelpCircle size={18} className="mr-2"/>}
                        {hasGeneratedQA ? 'Regenerate Questions' : 'Generate Q&A'}
                    </button>
                </div>

                {qaList.length > 0 ? (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {qaList.map((qa, idx) => (
                            <div key={idx} className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                <p className="font-semibold text-purple-900 mb-2">Q{idx+1}: {qa.question}</p>
                                <p className="text-gray-700 text-sm leading-relaxed">{qa.answer}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <HelpCircle size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">Click generate to see likely questions for your thesis defense.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Downloads */}
        <div className="space-y-6">
            
            {/* Thesis Download */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                    <FileText className="mr-2 text-blue-600" />
                    Thesis Document
                </h3>
                <p className="text-sm text-gray-500 mb-6">Download the complete thesis formatted in standard academic style.</p>
                
                <div className="space-y-3">
                    <button
                        onClick={() => generateThesisDoc(info, sections, logo)}
                        className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5"
                    >
                        <Download size={20} />
                        <span className="font-semibold">Download DOCX</span>
                    </button>

                    <button
                        onClick={() => generateThesisPDF(info, sections, logo)}
                        className="w-full flex items-center justify-center space-x-2 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5"
                    >
                        <FileText size={20} />
                        <span className="font-semibold">Download PDF</span>
                    </button>
                </div>
                
                <div className="mt-4 text-xs text-gray-400 bg-gray-50 p-3 rounded">
                    Includes: Title Page, Abstract, Chapters 1-6, References, Page Numbers.
                </div>
            </div>

            {/* Q&A Download */}
             <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                    <HelpCircle className="mr-2 text-purple-600" />
                    Q&A Bank
                </h3>
                <p className="text-sm text-gray-500 mb-6">Download the generated interview questions to study offline.</p>
                
                <button
                    onClick={() => generateQADoc(qaList, info.topic)}
                    disabled={!hasGeneratedQA}
                    className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg shadow-md transition ${
                        hasGeneratedQA
                        ? 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    <Download size={20} />
                    <span className="font-semibold">Download Q&A (.docx)</span>
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default QAGenerator;