"use client"

"use client"

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs"; // Import useUser
import { QrCodeIcon } from 'lucide-react';

// Supabase import removed as src/lib/supabase.ts was deleted
// import { supabase } from "@/lib/supabase"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Session {
    id: number;
    sessionName: string;
    sessionCode: string;
    createdAt: Date;
}

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
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Create a Session</CardTitle>
                    <CardDescription>
                        Create a new voting session
                    </CardDescription>
                </CardHeader>
                {isSignedIn ? (
                    <CardContent className="space-y-2">
                        <div className="space-y-1">
                            <Label htmlFor="sessionName">Session Name</Label>
                            <Input id="sessionName" placeholder="My Session" required value={sessionName} onChange={(e) => setSessionName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="maxUploads">Maximum Uploads Per User</Label>
                            <Input id="maxUploads" type="number" placeholder="1" min={1} required value={maxUploadsPerUser} onChange={(e) => setMaxUploadsPerUser(parseInt(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="maxVotes">Maximum Votes Per User</Label>
                            <Input id="maxVotes" type="number" placeholder="3" min={1} required value={maxVotesPerUser} onChange={(e) => setMaxVotesPerUser(parseInt(e.target.value))} />
                        </div>
                    </CardContent>
                ) : (
                    <CardContent>
                        <p className="text-sm text-gray-500">Please sign in to create and manage sessions.</p>
                    </CardContent>
                )}
                <CardFooter>
                    <Button onClick={createSession} className="w-full" disabled={!isSignedIn}>
                        Create
                    </Button>
                </CardFooter>
            </Card>

            {/* Display of user sessions removed as Supabase client is not available */}
            {/* {isSignedIn && userSessions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Your Sessions</CardTitle>
                        <CardDescription>
                            Sessions you've created
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {userSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                                    onClick={() => router.push(`/sessions/${session.sessionCode}`)}
                                >
                                    <div>
                                        <p className="font-medium">{session.sessionName}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(session.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">{session.sessionCode}</span>
                                        <QrCodeIcon className="w-4 h-4 text-gray-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )} */}
        </div>
    );
}
