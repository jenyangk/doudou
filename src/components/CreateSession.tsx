"use client"

"use client"

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
// QrCodeIcon is no longer used after removing session list
// import { QrCodeIcon } from 'lucide-react';


// Supabase import removed as src/lib/supabase.ts was deleted
// import { supabase } from "@/lib/supabase"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Separator is not used
// import { Separator } from "@/components/ui/separator";

// Session interface is no longer needed here
// interface Session {
//     id: number;
//     sessionName: string;
//     sessionCode: string;
//     createdAt: Date;
// }

export default function CreateSession() {
    const router = useRouter();
    const { isSignedIn, user } = useUser(); // Use Clerk's useUser hook
    const [sessionName, setSessionName] = useState('');
    const [maxUploadsPerUser, setMaxUploadsPerUser] = useState(1);
    const [maxVotesPerUser, setMaxVotesPerUser] = useState(3);
    // const [userSessions, setUserSessions] = useState<Session[]>([]); // Removed: Supabase data fetching

    // Removed useEffect for fetching user sessions as Supabase client is not available
    // useEffect(() => {
    //     const fetchUserSessions = async () => {
    //         if (isSignedIn && user && supabase) { // Check if supabase is defined
    //             const { data: sessions, error: sessionsError } = await supabase
    //                 .from('sessions')
    //                 .select('id, sessionName, sessionCode, createdAt')
    //                 .eq('createdBy', user.id) // Use user.id from Clerk
    //                 .order('createdAt', { ascending: false });

    //             if (sessionsError) {
    //                 toast.error('Error fetching sessions');
    //                 return;
    //             }
    //             setUserSessions(sessions as Session[]);
    //         } else {
    //             setUserSessions([]); // Clear sessions if user is not signed in
    //         }
    //     };

    //     fetchUserSessions();
    // }, [isSignedIn, user]); // Re-run effect when isSignedIn or user changes

    const createSession = async () => {
        if (!isSignedIn || !user) {
            toast.error('Please sign in to create a session.');
            return;
        }

        // Generate a unique session code (e.g., 6 characters long)
        const newSessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        if (sessionName === '' || maxUploadsPerUser <= 0 || maxVotesPerUser <= 0) {
            toast.error('Please fill in all fields');
            return;
        }

        // Supabase data operation removed
        // const { data: createdSession, error } = await supabase
        //     .from('sessions')
        //     .insert([{ sessionName: sessionName, sessionCode: newSessionCode, createdBy: user.id, maxUpload: maxUploadsPerUser, maxVoteAmount: maxVotesPerUser }])
        //     .select('id');

        // if (error) {
        //     toast.error(error.message || 'Error creating session. Please try again');
        // } else if (createdSession) {
        // router.push('/sessions/' + newSessionCode);
        // } else {
        //     toast.error('Error creating session. Please try again');
        // }
        toast.info("Session creation is temporarily disabled. User ID: " + user.id + " Session Code: " + newSessionCode );
        // router.push('/sessions/' + newSessionCode); // Simulate navigation for UI testing
    };

    return (
        // The outer div with space-y-4 might not be needed if it's just one card now.
        // Keeping it for now as it doesn't harm.
        <div className="space-y-4">
            <Card className="bg-retro-card-bg border-retro-text/10 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-retro-card-title">Create a Session</CardTitle>
                    <CardDescription className="text-retro-subheadline">
                        Create a new voting session
                    </CardDescription>
                </CardHeader>
                {isSignedIn ? (
                    <CardContent className="space-y-2">
                        <div className="space-y-1">
                            <Label htmlFor="sessionName" className="text-retro-text">Session Name</Label>
                            <Input id="sessionName" placeholder="My Awesome Session" required onChange={(e) => setSessionName(e.target.value)} className="bg-white border-retro-text/30 focus:border-retro-cta focus:ring-retro-cta" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="maxUploads" className="text-retro-text">Maximum Uploads Per User</Label>
                            <Input id="maxUploads" type="number" placeholder="1" min={1} required value={maxUploadsPerUser} onChange={(e) => setMaxUploadsPerUser(parseInt(e.target.value))} className="bg-white border-retro-text/30 focus:border-retro-cta focus:ring-retro-cta" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="maxVotes" className="text-retro-text">Maximum Votes Per User</Label>
                            <Input id="maxVotes" type="number" placeholder="3" min={1} required value={maxVotesPerUser} onChange={(e) => setMaxVotesPerUser(parseInt(e.target.value))} className="bg-white border-retro-text/30 focus:border-retro-cta focus:ring-retro-cta" />
                        </div>
                    </CardContent>
                ) : (
                    <CardContent>
                        <p className="text-sm text-retro-subheadline">Sign in with Google to create and manage sessions.</p>
                    </CardContent>
                )}
                <CardFooter>
                    <Button onClick={createSession} className="w-full" disabled={!isSignedIn}>
                        Create
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
