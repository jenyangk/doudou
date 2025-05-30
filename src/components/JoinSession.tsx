"use client"

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Turnstile } from "@marsidev/react-turnstile";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string;

export default function JoinSession() {
    const [sessionId, setSessionId] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [captchaToken, setCaptchaToken] = useState<string>();

    const handleJoinSession = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { data, error } = await supabase.auth.signInAnonymously({
                options: {
                    captchaToken: captchaToken,
                    data: {
                        session_id: sessionId,
                    },
                },
            })

            if (error) throw error

            setMessage("Successfully joined the session!");
            // Here you would typically redirect to the session page or update the UI
        } catch (error) {
            if (error instanceof Error) {
                setMessage(error.message);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Join Session</CardTitle>
                    <CardDescription>Enter the session ID to join anonymously</CardDescription>
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
                            />
                            {message && (
                                <Alert>
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

