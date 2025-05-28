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
        <div className="flex flex-col w-full min-h-screen bg-retro-background text-retro-text font-sans">
            {/* Consistent Header from Landing Page */}
            <header className='sticky top-0 flex h-16 items-center gap-4 border-b border-retro-text/20 bg-retro-background/80 backdrop-blur-sm px-4 md:px-6 justify-between z-50'>
              <Link href="/" className="flex items-center gap-2 hover:opacity-80">
                <Image src='/icon.png' alt="DouDou Logo" width={36} height={36} />
                <span className="font-bold text-xl text-retro-headline">DouDou</span>
              </Link>
              <Profile />
            </header>
            
            <main className="flex-1 py-8">
                {/* Apply retro card styling to Tabs and Cards if desired, or keep shadcn default */}
                {/* For now, focusing on header and background consistency */}
                <Tabs defaultValue="join_session" className="max-w-sm mx-auto">
                    {/* Consider styling TabsList and TabsTrigger with retro colors if needed */}
                    {/* e.g. text-retro-cta, border-retro-cta */}
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="create_session">Create Session</TabsTrigger>
                        <TabsTrigger value="join_session">Join Session</TabsTrigger>
                    </TabsList>
                    <TabsContent value="create_session">
                        {/* Let CreateSession component manage its own internal styling for now */}
                        <CreateSession />
                    </TabsContent>
                    <TabsContent value="join_session">
                        {/* Apply retro styling to Card components or use a wrapper with retro bg/border */}
                        <Card className="bg-retro-card-bg border-retro-text/10 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-retro-card-title">Join Session</CardTitle>
                                <CardDescription className="text-retro-subheadline">
                                    Join a created session
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="space-y-1">
                                    <Label htmlFor="name" className="text-retro-text">Username</Label>
                                    <Input id="username" placeholder="@jenyangkoh" required onChange={(e) => setUsername(e.target.value)} className="bg-white border-retro-text/30 focus:border-retro-cta focus:ring-retro-cta" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="current" className="text-retro-text">Session Code</Label>
                                    <Input id="current" type="text" placeholder="XXXXXX" required onChange={(e) => setSessionCode(e.target.value)} className="bg-white border-retro-text/30 focus:border-retro-cta focus:ring-retro-cta" />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={joinSession} className="w-full bg-retro-cta text-retro-cta-text hover:bg-retro-cta-hover">Join</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Consistent Footer from Landing Page */}
            <footer className="border-t border-retro-text/20 py-8 px-4 md:px-6 bg-retro-background/90">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-retro-subheadline">
                    <p className="mb-4 md:mb-0">&copy; {new Date().getFullYear()} DouDou. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/tos" className="hover:text-retro-headline transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="/policy" className="hover:text-retro-headline transition-colors">
                        Privacy Policy
                    </Link>
                </div>
            </footer>
        </div>
    );
}
