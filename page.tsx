"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  ShieldAlert,
  Search, // Added for Real-Time Check Icon
  Link, // Added for Source Links
} from "lucide-react";

// --- 1. Define Frontend Types (to match backend) ---
interface ClassificationResult {
  label: "REAL" | "FAKE" | "ERROR";
  score: number;
}
interface SimilarClaim {
  id: string;
  text: string;
  label: "REAL" | "FAKE" | "UNKNOWN";
  distance: number;
}

// New: Source model for web check grounding
interface Source {
    uri: string;
    title: string;
}

// New: RealTimeCheck model from Gemini API
interface RealTimeCheck {
    summary: string;
    sources: Source[] | null;
}

// Updated: Report Response now includes the real-time check
interface ReportResponse {
  classification: ClassificationResult;
  similar_claims: SimilarClaim[] | null;
  real_time_check: RealTimeCheck | null; // <-- NEW
}

// --- 2. Main Page Component ---
export default function Home() {
  const [text, setText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Changed initial state to match the updated interface
  const [report, setReport] = useState<ReportResponse | null>(null); 
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }
    setIsLoading(true);
    setReport(null);
    setError(null);
    try {
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text }),
      });
      if (!response.ok) {
        let errorDetail = `Error: ${response.status} - ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorDetail;
        } catch (jsonError) {
          console.error("Could not parse error response:", jsonError);
        }
        throw new Error(errorDetail);
      }
      // Ensure data conforms to the new ReportResponse structure
      const data: ReportResponse = await response.json(); 
      setReport(data);
    } catch (err: unknown) {
      console.error("Failed to analyze claim:", err);
      let errorMessage = "Failed to connect to the analysis service. Please ensure the backend is running and try again.";
      if (err instanceof Error) errorMessage = err.message;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Theme Colors --- HIGH CONTRAST DARK ZINC THEME ---
  const iconStrokeWidth = 2.5; 
  const bgColor = "bg-zinc-900"; 
  const textColor = "text-zinc-100"; 
  const mutedTextColor = "text-zinc-400"; 
  const cardBgColor = "bg-zinc-800"; 
  const cardBorderColor = "border-zinc-700"; 
  const inputBgColor = "bg-zinc-900"; 
  const inputBorderColor = "border-zinc-600"; 
  const placeholderColor = "placeholder-zinc-500"; 
  const focusRingColor = "focus:ring-red-500"; 
  const focusBorderColor = "focus:border-red-500"; 
  const buttonBgColor = "bg-red-600 hover:bg-red-700"; // Red button for action/alert focus
  const buttonHoverBgColor = "hover:bg-red-700";
  const buttonTextColor = "text-white"; 
  const headerAccentColor = "text-red-400"; 

  // Specific colors for states
  const errorColor = "text-red-400"; 
  const errorBgColor = "bg-red-900/20"; 
  const errorBorderColor = "border-red-500/30";
  const errorTextColor = "text-red-300";

  const realColor = "text-green-400"; 
  const realBgColor = "bg-green-900/20"; 
  const realBorderColor = "border-green-500/30";
  const realTextColor = "text-green-300";


  return (
    <main className={`flex min-h-screen flex-col items-center p-6 md:p-12 lg:p-24 ${textColor} ${bgColor}`}>

      {/* --- Error Alert Popup --- */}
      {error && (
        <div className={`fixed top-5 right-5 z-50 max-w-sm rounded-md border ${errorBorderColor} ${errorBgColor} p-4 text-red-200 shadow-lg backdrop-blur-sm`}>
          <div className="flex items-start gap-3">
             <AlertCircle className={`h-5 w-5 flex-shrink-0 ${errorColor}`} strokeWidth={iconStrokeWidth} />
             <div className="flex-1">
                <p className="font-medium text-zinc-100">Analysis Error</p>
                <p className={`mt-1 text-sm ${errorTextColor}`}>{error}</p>
             </div>
             <button
               onClick={() => setError(null)}
               className={`-m-1 rounded-full p-1 ${errorTextColor} hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900`}
               aria-label="Dismiss error"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
             </button>
          </div>
        </div>
      )}


      {/* --- Header --- */}
      <div className="z-10 mb-10 flex w-full max-w-5xl flex-col items-center justify-center text-center">
        <div className={`mb-4 flex items-center gap-2 ${headerAccentColor}`}>
          <ShieldAlert className="h-10 w-10" strokeWidth={iconStrokeWidth} />
          <h1 className={`text-4xl font-bold tracking-tight md:text-5xl font-serif`}>
            EchoGuard
          </h1>
        </div>
        <p className={`max-w-2xl text-lg ${mutedTextColor} md:text-xl`}>
          Analyze news, articles, and posts for misinformation. Get a real-time
          veracity score and see how it compares to similar known claims.
        </p>
      </div>

      {/* --- Main Input Card --- */}
      <div className={`w-full max-w-3xl rounded-lg border ${cardBorderColor} ${cardBgColor} p-6 shadow-md`}>
        <h2 className={`text-xl font-semibold ${textColor}`}>Submit a Claim</h2>
        <p className={`mb-4 text-sm ${mutedTextColor}`}>
          Paste the text you want to analyze below.
        </p>
        <textarea
          placeholder="Start typing or paste your text here..."
          className={`w-full min-h-[150px] resize-none rounded-md border ${inputBorderColor} ${inputBgColor} p-3 ${textColor} ${placeholderColor} ${focusBorderColor} focus:outline-none focus:ring-1 ${focusRingColor} disabled:opacity-50`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isLoading}
        />
        <button
          className={`mt-4 w-full flex items-center justify-center rounded-md ${buttonBgColor} px-4 py-2 font-medium ${buttonTextColor} ${buttonHoverBgColor} focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 disabled:opacity-70`}
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={iconStrokeWidth} />}
          {isLoading ? "Analyzing..." : "Analyze Claim"}
        </button>
      </div>

      {/* --- Results Section --- */}
      <div className={`mt-12 w-full max-w-3xl ${textColor}`}>
        {isLoading && <LoadingSkeleton iconStrokeWidth={iconStrokeWidth} />}
        {report && !isLoading && <ReportDisplay report={report} iconStrokeWidth={iconStrokeWidth} />}
      </div>
    </main>
  );
}

// --- 3. Loading Skeleton Component ---
function LoadingSkeleton({ iconStrokeWidth }: { iconStrokeWidth: number }) {
  const skeletonBg = "bg-zinc-700"; 
  const cardBg = "bg-zinc-800";
  const cardBorder = "border-zinc-700";
  return (
    <div className="space-y-6 animate-pulse">
      {/* Main Result Skeleton */}
      <div className={`rounded-lg border ${cardBorder} ${cardBg} p-6`}>
        <div className={`mb-4 h-6 w-1/3 rounded ${skeletonBg}`}></div>
        <div className="space-y-3">
          <div className={`h-10 w-1/2 rounded ${skeletonBg}`}></div>
          <div className={`h-5 w-full rounded ${skeletonBg}`}></div>
        </div>
      </div>
      {/* Real-Time Check Skeleton */}
       <div className={`rounded-lg border ${cardBorder} ${cardBg} p-6`}>
        <div className={`mb-4 h-6 w-1/4 rounded ${skeletonBg}`}></div>
        <div className="space-y-3">
          <div className={`h-4 w-full rounded ${skeletonBg}`}></div>
          <div className={`h-4 w-5/6 rounded ${skeletonBg}`}></div>
          <div className={`h-4 w-3/4 rounded ${skeletonBg}`}></div>
        </div>
      </div>
      {/* Similar Claims Skeleton */}
      <div className={`rounded-lg border ${cardBorder} ${cardBg} p-6`}>
        <div className={`mb-4 h-6 w-1/2 rounded ${skeletonBg}`}></div>
        <div className="space-y-4">
          <div className={`h-20 w-full rounded ${skeletonBg}`}></div>
          <div className={`h-20 w-full rounded ${skeletonBg}`}></div>
        </div>
      </div>
    </div>
  );
}

// --- 4. Report Display Component ---
function ReportDisplay({ report, iconStrokeWidth }: { report: ReportResponse; iconStrokeWidth: number }) {
  const isFake = report.classification.label === "FAKE";
  const scorePercent = (report.classification.score * 100).toFixed(0);

  // High contrast alert styles
  const alertBgColor = isFake ? "bg-zinc-800 border-red-500/40" : "bg-zinc-800 border-green-500/40"; 
  const alertIconColor = isFake ? "text-red-400" : "text-green-400";
  const alertTitleColor = isFake ? "text-red-300 font-semibold" : "text-green-300 font-semibold"; 
  const alertTextColor = "text-zinc-300";
  const badgeBgColor = "bg-zinc-600 text-zinc-100"; 
  const cardBorderColor = "border-zinc-700";
  const cardBgColor = "bg-zinc-800"; 
  const textColor = "text-zinc-100";
  const mutedTextColor = "text-zinc-400";


  return (
    <div className="space-y-8 animate-in fade-in">
      {/* --- Main Classification Result --- */}
      <div className={`rounded-lg border ${cardBorderColor} ${cardBgColor} shadow-md`}>
        <div className="p-6">
           <h2 className={`text-lg font-semibold ${textColor}`}>Internal Classification (Trained Model)</h2>
        </div>
        <div className={`border-t ${cardBorderColor} p-6 ${alertBgColor} rounded-b-lg`}>
          <div className="flex items-start gap-3">
            {isFake ? (
              <AlertCircle className={`h-5 w-5 flex-shrink-0 ${alertIconColor}`} strokeWidth={iconStrokeWidth}/>
            ) : (
              <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${alertIconColor}`} strokeWidth={iconStrokeWidth}/>
            )}
            <div className="flex-1">
              <p className={`text-lg font-bold ${alertTitleColor}`}>
                This claim is internally classified as {isFake ? "FAKE" : "REAL"}
              </p>
              <p className={`mt-1 text-base ${alertTextColor}`}>
                Our model is{" "}
                <span className={`rounded px-2 py-0.5 text-sm font-medium ${badgeBgColor}`}>
                  {scorePercent}%
                </span>{" "}
                confident in this assessment, based on patterns learned from historical fact-checking data.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* --- Real-Time Check from Gemini API --- */}
      <RealTimeCheckDisplay 
          realTimeCheck={report.real_time_check} 
          iconStrokeWidth={iconStrokeWidth} 
          cardBorderColor={cardBorderColor}
          cardBgColor={cardBgColor}
          textColor={textColor}
          mutedTextColor={mutedTextColor}
      />


      {/* --- Similar Claims Section --- */}
      <div className={`rounded-lg border ${cardBorderColor} ${cardBgColor} shadow-md`}>
        <div className="p-6">
            <h2 className={`text-lg font-semibold ${textColor}`}>Historical Propagation Tracking (Vector DB)</h2>
            <p className={`mt-1 text-sm ${mutedTextColor}`}>
                Here is what our system has recorded on claims with similar content from past user submissions.
            </p>
        </div>
        <div className={`border-t ${cardBorderColor} p-6`}>
          {report.similar_claims && report.similar_claims.length > 0 ? (
            <div className="space-y-4">
              {report.similar_claims.map((claim) => (
                <SimilarClaimCard key={claim.id} claim={claim} iconStrokeWidth={iconStrokeWidth}/>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-zinc-700 bg-zinc-800/50 p-8 text-center">
              <FileText className="h-10 w-10 text-zinc-600" strokeWidth={iconStrokeWidth}/>
              <p className={`mt-4 ${mutedTextColor}`}>
                No similar claims found in our database.
                <br />
                This appears to be a new or unique claim.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 5. Similar Claim Card Component ---
function SimilarClaimCard({ claim, iconStrokeWidth }: { claim: SimilarClaim; iconStrokeWidth: number }) {
  const isFake = claim.label === "FAKE";
  const similarityScore = (1 - claim.distance).toFixed(2);

  const badgeTextColor = "text-zinc-100";
  const badgeBgColor = isFake ? "bg-red-700/50" : "bg-green-700/50"; 
  const iconColor = isFake ? "text-red-400" : "text-green-400";
  const icon = isFake ? <AlertCircle className={`mr-1.5 h-3 w-3 ${iconColor}`} strokeWidth={iconStrokeWidth}/> : <CheckCircle2 className={`mr-1.5 h-3 w-3 ${iconColor}`} strokeWidth={iconStrokeWidth}/>;
  const cardBorderColor = "border-zinc-700";
  const cardBgColor = "bg-zinc-800"; 
  const textColor = "text-zinc-200";
  const mutedTextColor = "text-zinc-500";


  return (
    <div className={`rounded-md border ${cardBorderColor} ${cardBgColor} p-4`}>
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${badgeBgColor} ${badgeTextColor}`}>
            {icon}
            {claim.label}
          </span>
          <span className={`text-sm ${mutedTextColor}`}>
            Similarity: {similarityScore}
          </span>
        </div>
        <p className={`mt-3 ${textColor}`}>{claim.text}</p>
    </div>
  );
}

// --- 6. Real-Time Check Display Component ---
function RealTimeCheckDisplay({ 
    realTimeCheck, 
    iconStrokeWidth, 
    cardBorderColor,
    cardBgColor,
    textColor,
    mutedTextColor
}: {
    realTimeCheck: RealTimeCheck | null;
    iconStrokeWidth: number;
    cardBorderColor: string;
    cardBgColor: string;
    textColor: string;
    mutedTextColor: string;
}) {
    // If the API call returned null (likely due to the 403 error)
    if (!realTimeCheck) {
        return (
            <div className={`rounded-lg border ${cardBorderColor} ${cardBgColor} shadow-md`}>
                <div className="p-6">
                    <h2 className={`text-lg font-semibold ${textColor} flex items-center gap-2`}>
                        <Search className="w-5 h-5 text-red-500" strokeWidth={iconStrokeWidth} />
                        Real-Time Web Verification (Gemini API)
                    </h2>
                    <div className="mt-4 flex flex-col items-center justify-center rounded-md border border-dashed border-red-700/50 bg-red-900/10 p-8 text-center">
                        <AlertCircle className="h-10 w-10 text-red-600" strokeWidth={iconStrokeWidth}/>
                        <p className={`mt-4 ${textColor}`}>
                            Real-time check unavailable.
                        </p>
                        <p className={`mt-1 text-sm ${mutedTextColor}`}>
                            The external verification service encountered an issue (e.g., API key or network error).
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const isMisinformationWarning = realTimeCheck.summary.toLowerCase().includes('misinformation') || realTimeCheck.summary.toLowerCase().includes('false');
    const borderAccentColor = isMisinformationWarning ? "border-red-500/40" : "border-green-500/40";
    const iconAccentColor = isMisinformationWarning ? "text-red-400" : "text-green-400";

    return (
        <div className={`rounded-lg border ${cardBorderColor} ${cardBgColor} shadow-md`}>
            <div className="p-6">
                <h2 className={`text-lg font-semibold ${textColor} flex items-center gap-2`}>
                    <Search className="w-5 h-5 text-red-400" strokeWidth={iconStrokeWidth} />
                    Real-Time Web Verification (Gemini API)
                </h2>
                <p className={`mt-1 text-sm ${mutedTextColor}`}>
                    Summary generated from current web results using Google Search Grounding.
                </p>
            </div>
            <div className={`border-t ${cardBorderColor} p-6`}>
                {/* Summary */}
                <div className={`p-4 rounded-lg border ${borderAccentColor} bg-zinc-800/50`}>
                    <h3 className={`text-base font-semibold ${textColor} flex items-start gap-3`}>
                        <FileText className={`w-5 h-5 mt-1 flex-shrink-0 ${iconAccentColor}`} strokeWidth={iconStrokeWidth}/>
                        Analysis Summary:
                    </h3>
                    <p className={`mt-2 text-sm ${mutedTextColor}`}>{realTimeCheck.summary}</p>
                </div>
                
                {/* Sources */}
                {realTimeCheck.sources && realTimeCheck.sources.length > 0 && (
                    <div className="mt-6">
                        <h4 className={`text-sm font-semibold ${textColor} mb-3`}>
                            Sources Used ({realTimeCheck.sources.length})
                        </h4>
                        <ul className="space-y-2">
                            {realTimeCheck.sources.map((source, index) => (
                                <li key={index} className="flex items-start">
                                    <Link className={`h-4 w-4 mr-2 mt-0.5 flex-shrink-0 ${mutedTextColor}`} strokeWidth={iconStrokeWidth}/>
                                    <a 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className={`text-xs ${mutedTextColor} hover:text-red-400 transition-colors underline truncate`}
                                        title={source.title}
                                    >
                                        {source.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
