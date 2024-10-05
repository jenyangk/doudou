'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CreateSession() {
  const [username, setUsername] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [sessionCode, setSessionCode] = useState<string>('');

  const createSession = async () => {
    // Generate a unique session code (e.g., 6 characters long)
    const newSessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from('sessions')
      .insert([{ sessionName: sessionName, sessionCode: newSessionCode, creator: username }])
      .select();

    if (data) {
      alert(`Session created! Your session code is: ${sessionCode}`);
    } else {
      console.error('Error creating session:', error);
    }
  };

  const joinSession = async () => {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('sessionCode', sessionCode)
      .single();

    if (error || !session) {
      console.error('Session not found:', error);
      return;
    }

    const userIdentifier = Math.random().toString(36).substring(2, 15);

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{ username, session_id: session.id, user_identifier: userIdentifier }]);

    if (userError) {
      console.error('Error joining session:', userError);
    } else {
      alert(`Welcome, ${username}! You have joined the session.`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Photo Vote Board</h1>
      <Input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <Input type="text" placeholder="Session Name" value={sessionName} onChange={(e) => setSessionName(e.target.value)} />
      <Button onClick={createSession}>Create Session</Button>
      <Input type="text" placeholder="Have a session code?" value={sessionCode} onChange={(e) => setSessionCode(e.target.value)} />
      <Button onClick={joinSession}>Join Session</Button>
    </div>
  );
}
