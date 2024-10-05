import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function CreateSession() {
  const [username, setUsername] = useState('');

  const createSession = async () => {
    // Generate a unique session code (e.g., 6 characters long)
    const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data, error } = await supabase
      .from('sessions')
      .insert([{ session_code: sessionCode, creator: username }])
      .select();

    if (data) {
      alert(`Session created! Your session code is: ${sessionCode}`);
    } else {
      console.error('Error creating session:', error);
    }
  };

  return (
    <div>
      <input 
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button onClick={createSession}>Create Session</button>
    </div>
  );
}
