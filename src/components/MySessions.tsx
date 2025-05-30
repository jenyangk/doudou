'use client'; // If using event handlers or hooks directly in this component, though Link is fine.

import Link from 'next/link';

interface Session {
  id: string;
  sessionName: string;
  sessionCode: string;
  created_at: string; // Or Date
}

interface MySessionsProps {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
}

export default function MySessions({ sessions, isLoading, error }: MySessionsProps) {
  if (isLoading) {
    return <div className="text-center p-4 text-retro-subheadline">Loading your sessions...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500 bg-red-100 border border-red-500 rounded-md">{error}</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center p-6 bg-retro-card-bg border border-retro-text/10 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-retro-card-title mb-2">No Sessions Yet!</h3>
        <p className="text-retro-card-text">
          You haven&apos;t created any sessions. Why not start one now?
        </p>
        {/* Optional: Could add a Link to create session here if desired */}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Link href={`/sessions/${session.sessionCode}`} key={session.id} legacyBehavior>
          <a className="block p-4 sm:p-6 bg-retro-card-bg border border-retro-text/10 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out cursor-pointer">
            <h3 className="text-xl sm:text-2xl font-semibold text-retro-card-title mb-1 sm:mb-2">{session.sessionName}</h3>
            <p className="text-sm sm:text-md text-retro-subheadline">Code: <span className="font-mono bg-retro-background/50 px-1.5 py-0.5 rounded text-retro-text">{session.sessionCode}</span></p>
            <p className="text-xs text-gray-400 mt-2">Created: {new Date(session.created_at).toLocaleDateString()}</p>
          </a>
        </Link>
      ))}
    </div>
  );
}
