'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AnimatedSubscribeButton } from "@/components/ui/animated-subscribe-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

export default function Sessions() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [sessionName, setSessionName] = useState('');
    const [sessionCode, setSessionCode] = useState('');
    const [maxUploadsPerUser, setMaxUploadsPerUser] = useState('1');
    const [maxVotesPerUser, setMaxVotesPerUser] = useState('3');

    const createSession = async () => {
        // Generate a unique session code (e.g., 6 characters long)
        const newSessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        if (sessionName === '' || username === '') {
            toast.error('Please fill in all fields');
            return;
        }

        const createdSession = await supabase
            .from('sessions')
            .insert([{ sessionName: sessionName, sessionCode: newSessionCode, creator: username, maxUpload: parseInt(maxUploadsPerUser), maxVoteAmount: parseInt(maxVotesPerUser) }])
            .select('id');

        const createdUser = await supabase
            .from('session_users')
            .insert([{ username, sessionId: createdSession.data![0].id, isCreator: true }]);

        if (createdUser) {
            router.push('/sessions/' + newSessionCode + '?username=' + username);
        } else {
            toast.error('Error creating session. Please try again');
        }
    };

    const joinSession = async () => {
        const { data: session, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('sessionCode', sessionCode)
            .single();

        if (error || !session) {
            toast.error('Session not found. Please try again');
            return;
        }

        const checkUser = await supabase
            .from('session_users')
            .select('*')
            .eq('sessionId', session.id)
            .eq('username', username)
            .maybeSingle();

        if (checkUser.data) {
            toast.success('Rejoining session');
            router.push('/sessions/' + sessionCode + '?username=' + username);
        } else {
            const createdUser = await supabase
                .from('session_users')
                .insert([{ username, sessionId: session.id }]);

            if (createdUser.error) {
                toast.error('Error joining session. Please try again');
            } else {
                router.push('/sessions/' + sessionCode + '?username=' + username);
            }
        }
    };

    return (
        <div className="flex w-full min-h-screen">
            <header className="sticky top-0 flex h-16 items-center gap-4 px-4 md:px-6">
                <Image src='/icon.png' alt="DouDou" width={32} height={32} />
            </header>
            <Tabs defaultValue="join_session" className="m-auto max-w-sm flex-auto">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create_session">Create Session</TabsTrigger>
                    <TabsTrigger value="join_session">Join Session</TabsTrigger>
                </TabsList>
                <TabsContent value="create_session">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create a Session</CardTitle>
                            <CardDescription>
                                Create a new session
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="space-y-1">
                                <Label htmlFor="name">Username</Label>
                                <Input id="username" placeholder="Put your name in here" required onChange={(e) => setUsername(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="username">Session Name</Label>
                                <Input id="sessionName" placeholder="My Session" required onChange={(e) => setSessionName(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sessionCode">Maximum Uploads Per User</Label>
                                <Input id="sessionCode" type="number" placeholder="1" required value={maxUploadsPerUser} onChange={(e) => setMaxUploadsPerUser(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="sessionCode">Maximum Votes Per User</Label>
                                <Input id="sessionCode" type="number" placeholder="3" required value={maxVotesPerUser} onChange={(e) => setMaxVotesPerUser(e.target.value)} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={createSession} className="w-full">Create</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="join_session">
                    <Card>
                        <CardHeader>
                            <CardTitle>Join Session</CardTitle>
                            <CardDescription>
                                Join a created session
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="space-y-1">
                                <Label htmlFor="name">Username</Label>
                                <Input id="username" placeholder="@jenyangkoh" required onChange={(e) => setUsername(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="current">Session Code</Label>
                                <Input id="current" type="text" placeholder="XXXXXX" required onChange={(e) => setSessionCode(e.target.value)} />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={joinSession} className="w-full">Join</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
