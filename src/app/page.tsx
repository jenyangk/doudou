'use client'

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { supabase } from "@/lib/supabase"; // Supabase import removed
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
// import { Alert, AlertDescription } from "@/components/ui/alert"; // Alert not used after removing handleLogin
import CreateSession from "@/components/CreateSession";
import JoinSession from "@/components/JoinSession"; // Import JoinSession component
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

    // createSession function removed as it uses Supabase
    // const createSession = async () => { ... };

    // joinSession function removed as it uses Supabase
    // const joinSession = async () => { ... };
    
    // State for OTP login (email, loading, message) removed as handleLogin is removed
    // const [email, setEmail] = useState("");
    // const [loading, setLoading] = useState(false);
    // const [message, setMessage] = useState<string | null>(null);

    // handleLogin function removed as it uses Supabase OTP
    // const handleLogin = async (e: React.FormEvent) => { ... };

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
                        {/* Replaced inline join form with JoinSession component */}
                        <JoinSession /> 
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
