"use client"

import { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Supabase import removed
// Turnstile import removed as it was tied to Supabase anonymous auth

// const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string; // Turnstile siteKey removed

export default function JoinSession() {
    const router = useRouter(); // Initialize useRouter
    const [sessionId, setSessionId] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    // captchaToken state removed

    const handleJoinSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (!sessionId.trim()) {
            setMessage("Please enter a session ID.");
            setLoading(false);
            return;
        }

        // Supabase anonymous sign-in logic removed.
        // With Clerk, if /sessions/[id] is protected, middleware will prompt sign-in.
        // If it's public, no specific "join" auth action is needed here.
        // This component will now just navigate to the session page.
        
        try {
            // Simulate a brief delay then navigate.
            // In a real scenario, you might validate the session ID format here if needed.
            await new Promise(resolve => setTimeout(resolve, 500)); 
            
            router.push(`/sessions/${sessionId}`);
            // setMessage("Navigating to session..."); // Optional: message before navigation
        } catch (error) {
            // This catch block might be less relevant now unless navigation itself can throw an error
            if (error instanceof Error) {
                setMessage(error.message);
            } else {
                setMessage("An unexpected error occurred.");
            }
            setLoading(false); // Ensure loading is set to false on error
        }
        // setLoading(false); // setLoading will be false after navigation or if an error occurs and is caught.
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Join Session</CardTitle>
                    <CardDescription>Enter the session ID to join.</CardDescription> 
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleJoinSession}>
                        <div className="space-y-4">
                            <Input
                                type="text"
                                placeholder="Session ID"
                                value={sessionId}
                                onChange={(e) => setSessionId(e.target.value)}
                                required
                                className="text-center text-lg" // Added some styling
                            />
                            {/* Turnstile component removed */}
                            {message && (
                                <Alert variant={message.startsWith("Successfully") || message.startsWith("Navigating") ? "default" : "destructive"}>
                                    <AlertDescription>{message}</AlertDescription>
                                </Alert>
                            )}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Joining..." : "Join Session"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </>
    )
}

