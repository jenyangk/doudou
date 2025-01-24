"use client"

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { QrCodeIcon } from 'lucide-react';

import { supabase } from "@/lib/supabase";
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
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const [sessionName, setSessionName] = useState('');
    const [maxUploadsPerUser, setMaxUploadsPerUser] = useState(1);
    const [maxVotesPerUser, setMaxVotesPerUser] = useState(3);
    const [userSessions, setUserSessions] = useState<Session[]>([]);

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

            if (isGoogle) {
                // Only fetch sessions for Google users
                const { data: sessions, error: sessionsError } = await supabase
                    .from('sessions')
                    .select('id, sessionName, sessionCode, createdAt')
                    .eq('createdBy', session.user.id)
                    .order('createdAt', { ascending: false });

                if (sessionsError) {
                    toast.error('Error fetching sessions');
                    return;
                }

                setUserSessions(sessions as Session[]);
            }
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
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Create a Session</CardTitle>
                    <CardDescription>
                        Create a new voting session
                    </CardDescription>
                </CardHeader>
                {isGoogleUser ? (
                    <CardContent className="space-y-2">
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
                ) : (
                    <CardContent>
                        <p className="text-sm text-gray-500">Sign in with Google to create and manage sessions</p>
                    </CardContent>
                )}
                <CardFooter>
                    {isGoogleUser ? (
                        <Button onClick={createSession} className="w-full">Create</Button>
                    ) : (
                        <Button onClick={handleLogin} className="w-full">Sign in with Google</Button>
                    )}
                </CardFooter>
            </Card>

            {isGoogleUser && userSessions.length > 0 && (
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
            )}
        </div>
    );
}
