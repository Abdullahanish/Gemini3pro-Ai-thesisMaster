import React, { useState } from 'react';
import { ThesisSection, StudentInfo, PlagiarismIssue } from '../types';
import { generateSectionContent, checkPlagiarism } from '../services/geminiService';
import { Edit2, Save, RefreshCw, CheckCircle, AlertCircle, Sparkles, ShieldCheck, X, AlertTriangle, Repeat, Bot } from 'lucide-react';

interface Props {
  info: StudentInfo;
  sections: ThesisSection[];
  setSections: React.Dispatch<React.SetStateAction<ThesisSection[]>>;
  onNext: () => void;
  onBack: () => void;
}

// Component to render text with highlights
const HighlightedContent: React.FC<{ text: string; issues: PlagiarismIssue[] }> = ({ text, issues }) => {
    if (!text) return null;
    
    // Split into paragraphs first to maintain formatting
    const paragraphs = text.split('\n');

    return (
        <>
            {paragraphs.map((paragraph, pIdx) => {
                if (!paragraph.trim()) return <br key={pIdx} />;

                // Simple highlighting logic: find quotes and wrap them
                // Note: This assumes quotes don't overlap.
                let parts: { text: string; issue?: PlagiarismIssue }[] = [{ text: paragraph }];

                if (issues && issues.length > 0) {
                    issues.forEach(issue => {
                        const newParts: typeof parts = [];
                        parts.forEach(part => {
                            if (part.issue) {
                                newParts.push(part);
                                return;
                            }
                            // Clean up quote for matching (sometimes AI adds whitespace)
                            const cleanQuote = issue.quote.trim();
                            if (!part.text.includes(cleanQuote)) {
                                newParts.push(part);
                                return;
                            }
                            
                            const split = part.text.split(cleanQuote);
                            split.forEach((s, i) => {
                                if (s) newParts.push({ text: s });
                                if (i < split.length - 1) {
                                    newParts.push({ text: cleanQuote, issue: issue });
                                }
                            });
                        });
                        parts = newParts;
                    });
                }

                return (
                    <p key={pIdx} className="mb-4 whitespace-pre-wrap">
                        {parts.map((part, i) => 
                            part.issue ? (
                                <span 
                                    key={i} 
                                    className={`relative group cursor-help border-b-2 ${
                                        part.issue.type === 'ai-pattern' ? 'bg-purple-100 border-purple-400 text-purple-900' :
                                        part.issue.type === 'repetition' ? 'bg-blue-100 border-blue-400 text-blue-900' :
                                        'bg-amber-100 border-amber-400 text-amber-900'
                                    }`}
                                >
                                    {part.text}
                                    <span className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded p-2 w-64 z-50 mb-1 shadow-xl">
                                        <span className="font-bold block mb-1 uppercase text-[10px] tracking-wider text-gray-400">
                                            {part.issue.type.replace('-', ' ')}
                                        </span>
                                        {part.issue.comment}
                                    </span>
                                </span>
                            ) : (
                                <span key={i}>{part.text}</span>
                            )
                        )}
                    </p>
                );
            })}
        </>
    );
};

const ThesisEditor: React.FC<Props> = ({ info, sections, setSections, onNext, onBack }) => {
  const [activeTab, setActiveTab] = useState(sections[0].id);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  
  // Plagiarism Panel State
  const [showPlagiarismPanel, setShowPlagiarismPanel] = useState(false);

  const activeSection = sections.find(s => s.id === activeTab)!;

  const handleGenerate = async (sectionId: string) => {
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;

    // Update loading state
    const newSections = [...sections];
    newSections[sectionIndex].isLoading = true;
    setSections(newSections);

    // Call API
    const content = await generateSectionContent(
        newSections[sectionIndex].title,
        newSections[sectionIndex].promptContext,
        info
    );

    // Update content and loading state
    const updatedSections = [...sections];
    updatedSections[sectionIndex].content = content;
    updatedSections[sectionIndex].isGenerated = true;
    updatedSections[sectionIndex].isLoading = false;
    setSections(updatedSections);
    
    // If active, sync edit buffer
    if (activeTab === sectionId) {
        setEditedContent(content);
        setIsEditing(false);
    }
  };

  const handleCheckPlagiarism = async () => {
    const sectionIndex = sections.findIndex(s => s.id === activeTab);
    if (sectionIndex === -1 || !activeSection.content) return;

    const newSections = [...sections];
    newSections[sectionIndex].isCheckingPlagiarism = true;
    setSections(newSections);
    setShowPlagiarismPanel(true);

    const result = await checkPlagiarism(activeSection.content);

    const updatedSections = [...sections];
    updatedSections[sectionIndex].isCheckingPlagiarism = false;
    updatedSections[sectionIndex].plagiarismResult = result;
    setSections(updatedSections);
  };

  const handleEditToggle = () => {
    if (isEditing) {
        // Saving
        const sectionIndex = sections.findIndex(s => s.id === activeTab);
        const newSections = [...sections];
        newSections[sectionIndex].content = editedContent;
        // Invalidate previous plagiarism result on edit
        newSections[sectionIndex].plagiarismResult = undefined;
        setSections(newSections);
        setIsEditing(false);
    } else {
        // Starting edit
        setEditedContent(activeSection.content);
        setIsEditing(true);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 50) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 border-b bg-gray-50">
        <div>
            <h2 className="text-xl font-bold text-gray-800">Drafting: {activeSection.title}</h2>
            <p className="text-sm text-gray-500">Review and edit generated content.</p>
        </div>
        <div className="flex space-x-3">
             <button onClick={onBack} className="px-4 py-2 text-gray-600 hover:text-gray-900">Back</button>
             <button onClick={onNext} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Proceed to Q&A & Export</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r overflow-y-auto hidden md:block">
            {sections.map(section => (
                <button
                    key={section.id}
                    onClick={() => {
                        setActiveTab(section.id);
                        setIsEditing(false);
                        setShowPlagiarismPanel(false);
                    }}
                    className={`w-full text-left p-4 border-b text-sm font-medium transition-colors flex items-center justify-between ${
                        activeTab === section.id 
                        ? 'bg-white text-blue-600 border-l-4 border-l-blue-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <span className="truncate pr-2">{section.title}</span>
                    <div className="flex items-center space-x-1">
                        {section.isLoading && <RefreshCw size={14} className="animate-spin text-blue-500" />}
                        {!section.isLoading && section.isGenerated && <CheckCircle size={14} className="text-green-500" />}
                        {section.plagiarismResult && section.plagiarismResult.score < 50 && (
                            <AlertCircle size={14} className="text-red-500" />
                        )}
                    </div>
                </button>
            ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
            {/* Toolbar */}
            <div className="p-3 border-b flex justify-between items-center bg-white">
                <div className="flex items-center space-x-2">
                    {activeSection.content === '' && !activeSection.isLoading && !isEditing && (
                         <div className="flex items-center text-amber-600 text-sm bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                             <AlertCircle size={14} className="mr-1"/>
                             Not generated yet
                         </div>
                    )}
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleGenerate(activeTab)}
                        disabled={activeSection.isLoading}
                        className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 text-sm font-medium transition shadow-sm"
                    >
                         {activeSection.isLoading ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                <span>Writing...</span>
                            </>
                         ) : (
                            <>
                                <Sparkles size={16} />
                                <span>{activeSection.content ? 'Regenerate' : 'Generate with AI'}</span>
                            </>
                         )}
                    </button>
                    
                    {activeSection.content && (
                         <>
                            <button
                                onClick={handleCheckPlagiarism}
                                disabled={activeSection.isCheckingPlagiarism}
                                className={`flex items-center space-x-1 px-4 py-2 border rounded text-sm font-medium transition ${
                                    activeSection.plagiarismResult ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {activeSection.isCheckingPlagiarism ? (
                                    <RefreshCw size={16} className="animate-spin" />
                                ) : (
                                    <ShieldCheck size={16} />
                                )}
                                <span>{activeSection.plagiarismResult ? 'Re-check Originality' : 'Check Originality'}</span>
                            </button>

                            <button
                                onClick={handleEditToggle}
                                className={`flex items-center space-x-1 px-4 py-2 border rounded text-sm font-medium transition ${
                                    isEditing 
                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {isEditing ? (
                                    <>
                                        <Save size={16} />
                                        <span>Save Changes</span>
                                    </>
                                ) : (
                                    <>
                                        <Edit2 size={16} />
                                        <span>Edit Manually</span>
                                    </>
                                )}
                            </button>
                         </>
                    )}
                </div>
            </div>

            {/* Editor/Preview */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
                    <div className="max-w-4xl mx-auto min-h-full bg-white shadow-sm border p-12">
                        {isEditing ? (
                            <textarea
                                value={editedContent}
                                onChange={handleTextChange}
                                className="w-full h-[600px] p-4 font-mono text-sm border-0 focus:ring-0 outline-none resize-none bg-white text-gray-900"
                                placeholder="Content will appear here..."
                            />
                        ) : (
                            <div className="prose max-w-none font-academic text-justify leading-loose text-gray-800">
                                {activeSection.content ? (
                                    <HighlightedContent 
                                        text={activeSection.content} 
                                        issues={showPlagiarismPanel && activeSection.plagiarismResult ? activeSection.plagiarismResult.issues : []} 
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                        <Sparkles size={48} className="mb-4 opacity-20" />
                                        <p>Content not generated yet.</p>
                                        <p className="text-sm">Click "Generate with AI" to write this chapter.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Plagiarism Results */}
                {showPlagiarismPanel && activeSection.plagiarismResult && (
                    <div className="w-96 bg-white border-l shadow-xl flex flex-col z-10 transition-transform">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center">
                                <ShieldCheck className="mr-2 text-purple-600" size={20} />
                                Originality Report
                            </h3>
                            <button onClick={() => setShowPlagiarismPanel(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                            <div className={`p-6 rounded-xl border-2 mb-6 text-center ${getScoreBg(activeSection.plagiarismResult.score)}`}>
                                <div className="text-4xl font-bold mb-1 text-gray-800">{activeSection.plagiarismResult.score}%</div>
                                <div className={`text-sm font-bold uppercase tracking-wide ${getScoreColor(activeSection.plagiarismResult.score)}`}>
                                    Originality Score
                                </div>
                            </div>

                            {activeSection.plagiarismResult.issues.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Detailed Findings</h4>
                                    <div className="space-y-3">
                                        {activeSection.plagiarismResult.issues.map((issue, idx) => (
                                            <div key={idx} className="p-3 bg-white border rounded shadow-sm text-sm hover:shadow-md transition cursor-pointer">
                                                <div className="flex items-center mb-1">
                                                    {issue.type === 'ai-pattern' && <Bot size={14} className="text-purple-500 mr-1"/>}
                                                    {issue.type === 'repetition' && <Repeat size={14} className="text-blue-500 mr-1"/>}
                                                    {issue.type === 'cliche' && <AlertTriangle size={14} className="text-amber-500 mr-1"/>}
                                                    <span className={`text-xs font-bold uppercase ${
                                                        issue.type === 'ai-pattern' ? 'text-purple-600' :
                                                        issue.type === 'repetition' ? 'text-blue-600' :
                                                        'text-amber-600'
                                                    }`}>
                                                        {issue.type}
                                                    </span>
                                                </div>
                                                <p className="text-gray-800 font-medium mb-1">"{issue.quote}"</p>
                                                <p className="text-gray-500 text-xs">{issue.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">General Feedback</h4>
                            <ul className="space-y-3">
                                {activeSection.plagiarismResult.feedback.map((item, idx) => (
                                    <li key={idx} className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100 flex items-start">
                                        <div className="min-w-[6px] h-[6px] rounded-full bg-blue-400 mt-1.5 mr-2"></div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            
                            <div className="mt-6 text-xs text-gray-400 border-t pt-4">
                                * This analysis is AI-generated based on stylistic patterns and common phrases. It highlights text that appears generic or generated, not necessarily copied from a specific external source.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ThesisEditor;