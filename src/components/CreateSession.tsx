"use client"

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
// QrCodeIcon is no longer used after removing session list
// import { QrCodeIcon } from 'lucide-react';

import { supabase } from "@/lib/supabase";
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
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const [sessionName, setSessionName] = useState('');
    const [maxUploadsPerUser, setMaxUploadsPerUser] = useState(1);
    const [maxVotesPerUser, setMaxVotesPerUser] = useState(3);
    // userSessions state is removed
    // const [userSessions, setUserSessions] = useState<Session[]>([]);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user) {
                setIsGoogleUser(false);
                return;
            }

            // Check if user is authenticated with Google
            const isGoogle = !session.user.is_anonymous;
            setIsGoogleUser(isGoogle);

            // Removed session fetching logic from here
            // if (isGoogle) { ... }
        };

        checkAuth();
    }, []);

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            },
        });
    };

    const createSession = async () => {
        if (!isGoogleUser) {
            toast.error('Please sign in with Google to create a session');
            return;
        }

        // Generate a unique session code (e.g., 6 characters long)
        const newSessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        if (sessionName === '' || maxUploadsPerUser <= 0 || maxVotesPerUser <= 0) {
            toast.error('Please fill in all fields');
            return;
        }

        const createdSession = await supabase
            .from('sessions')
            .insert([{ sessionName: sessionName, sessionCode: newSessionCode, createdBy: (await supabase.auth.getUser()).data.user?.id, maxUpload: maxUploadsPerUser, maxVoteAmount: maxVotesPerUser }])
            .select('id');

        if (createdSession) {
            router.push('/sessions/' + newSessionCode);
        } else {
            toast.error('Error creating session. Please try again');
        }
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
                {isGoogleUser ? (
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
                    {isGoogleUser ? (
                        <Button onClick={createSession} className="w-full bg-retro-cta text-retro-cta-text hover:bg-retro-cta-hover">Create</Button>
                    ) : (
                        <Button onClick={handleLogin} className="w-full bg-retro-cta text-retro-cta-text hover:bg-retro-cta-hover">Sign in with Google</Button>
                    )}
                </CardFooter>
            </Card>

            {/* Removed the redundant "Your Sessions" display section */}
        </div>
    );
}
