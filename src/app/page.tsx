'use client'

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CreateSession from "@/components/CreateSession";
import Profile from "@/components/Profile";
import Link from "next/link";

export default function Sessions(props: { searchParams: Promise<{ sessionCode: string }> }) {
    const searchParams = use(props.searchParams);
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [sessionName, setSessionName] = useState('');
    const [sessionCode, setSessionCode] = useState(searchParams.sessionCode);
    const [maxUploadsPerUser, setMaxUploadsPerUser] = useState('1');
    const [maxVotesPerUser, setMaxVotesPerUser] = useState('3');

    useEffect(() => {
        if (searchParams.sessionCode !== '') {
            setSessionCode(searchParams.sessionCode);
        }
    });

    const createSession = async () => {
        // Generate a unique session code (e.g., 6 characters long)
        const newSessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        if (sessionName === '' || username === '') {
            toast.error('Please fill in all fields');
            return;
        }

        const createdSession = await supabase
            .from('sessions')
            .insert([{ sessionName: sessionName, sessionCode: newSessionCode, creator: (await supabase.auth.getUser()).data.user?.id, maxUpload: parseInt(maxUploadsPerUser), maxVoteAmount: parseInt(maxVotesPerUser) }])
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

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) throw error

            setMessage("Check your email for the login link!")
            // Add a delay before redirecting to ensure the message is seen
            setTimeout(() => {
                router.push("/dashboard")
            }, 3000)
        } catch (error) {
            if (error instanceof Error) {
                setMessage(error.message)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col w-full min-h-screen">
            <header className='sticky top-0 flex h-12 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between'>
                <div className='flex items-center space-x-2 gap-2'>
                    <Link href="/" className="hover:opacity-80">
                        <Image 
                            src='/icon.png' 
                            alt="DouDou" 
                            width={32} 
                            height={32} 
                            className="transition-opacity" 
                        />
                    </Link>
                </div>
                <span className='text-md font-bold flex items-center space-x-2 gap-2'>
                    <Profile />
                </span>
            </header>
            
            <main className="flex-1 py-8">
                <Tabs defaultValue="join_session" className="max-w-sm mx-auto">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="create_session">Create Session</TabsTrigger>
                        <TabsTrigger value="join_session">Join Session</TabsTrigger>
                    </TabsList>
                    <TabsContent value="create_session">
                        <CreateSession />
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
            </main>

            <footer className="border-t py-4 px-4 md:px-6">
                <div className="max-w-sm mx-auto flex justify-center gap-4 text-sm text-gray-500">
                    <Link href="/tos" className="hover:text-gray-900 transition-colors">
                        Terms of Service
                    </Link>
                    <Link href="/policy" className="hover:text-gray-900 transition-colors">
                        Privacy Policy
                    </Link>
                </div>
            </footer>
        </div>
    );
}
