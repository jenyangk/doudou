'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AuthCodeError() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                        <CardTitle>Authentication Error</CardTitle>
                    </div>
                    <CardDescription>
                        There was a problem with the authentication process
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-sm text-gray-500 space-y-2">
                        <p>This could happen for several reasons:</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>The authentication code has expired</li>
                            <li>The code has already been used</li>
                            <li>There was a network error</li>
                        </ul>
                    </div>
                    <div className="text-sm">
                        Please try signing in again. If the problem persists, contact support.
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                    <Link href="/">
                        <Button variant="outline">Go Home</Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
} 