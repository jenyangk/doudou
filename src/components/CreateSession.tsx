"use client"

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateSession() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [sessionName, setSessionName] = useState('');
    const [maxUploadsPerUser, setMaxUploadsPerUser] = useState(1);
    const [maxVotesPerUser, setMaxVotesPerUser] = useState(3);

    useEffect(() => {
        // Check if the user is signed in
        const checkAuth = async () => {
          const { data: { session }, error } = await supabase.auth.getSession();
    
          if (error) {
            setIsLoggedIn(false);
          } else if (!session) {
            setIsLoggedIn(false);
          } else {
            setIsLoggedIn(true);
          }
        };
    
        checkAuth();
      }, []);

    const createSession = async () => {
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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if ((await supabase.auth.getUser()).data.user) {
            setIsLoggedIn(true);
            return;
        }

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) throw error;
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            }
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Create a Session</CardTitle>
                    <CardDescription>
                        Create a new voting session
                    </CardDescription>
                </CardHeader>
                {
                    isLoggedIn
                        ? <CardContent className="space-y-2">
                            <div className="space-y-1">
                                <Label htmlFor="username">Session Name</Label>
                                <Input id="sessionName" placeholder="My Session" required onChange={(e) => setSessionName(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sessionCode">Maximum Uploads Per User</Label>
                                <Input id="sessionCode" type="number" placeholder="1" min={1} required value={maxUploadsPerUser} onChange={(e) => setMaxUploadsPerUser(parseInt(e.target.value))} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sessionCode">Maximum Votes Per User</Label>
                                <Input id="sessionCode" type="number" placeholder="3" min={1} required value={maxVotesPerUser} onChange={(e) => setMaxVotesPerUser(parseInt(e.target.value))} />
                            </div>
                        </CardContent>
                        : <></>
                }
                <CardFooter>
                    {
                        isLoggedIn
                            ? <Button onClick={createSession} className="w-full">Create</Button>
                            : <Button onClick={handleLogin} className="w-full">Login with Google</Button>
                    }
                </CardFooter>
            </Card>
        </>
    )
}
