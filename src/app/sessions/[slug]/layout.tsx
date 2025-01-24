'use client'

import { use, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { QrCodeIcon, Copy, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import QRCodeStyling from "qr-code-styling";
import Profile from '@/components/Profile';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function SessionLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const resolvedParams = use(params);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const qrCodeRef = useRef<HTMLDivElement>(null);

    const sessionUrl = `https://doudou.muniee.com/sessions/${resolvedParams.slug}`;

    const [qrCode] = useState<QRCodeStyling>(() => new QRCodeStyling({
        width: 200,
        height: 200,
        data: sessionUrl,
        image: '/icon-large.png',
        dotsOptions: {
            color: "#000000",
            type: "dots",
        },
        imageOptions: {
            crossOrigin: "anonymous",
            margin: 10
        }
    }));

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(sessionUrl);
            setIsCopied(true);
            toast.success('Link copied to clipboard');
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            toast.error('Failed to copy link');
        }
    };

    useEffect(() => {
        const signInAnonymously = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                const { data, error } = await supabase.auth.signInAnonymously({
                    options: {
                        data: {
                            session_id: resolvedParams.slug,
                        },
                    },
                });
                
                if (data.session) {
                    setIsAuthReady(true);
                }
            } else {
                setIsAuthReady(true);
            }
        };

        signInAnonymously();
    }, [resolvedParams.slug]);

    useEffect(() => {
        if (isPopoverOpen) {
            setTimeout(() => {
                if (qrCodeRef.current) {
                    qrCode?.append(qrCodeRef.current);
                }
            }, 100);
        }
    }, [isPopoverOpen, qrCode]);

    if (!isAuthReady) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div>
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
                    <span className='text-md font-bold flex items-center space-x-2 gap-2'>
                        <Popover onOpenChange={setIsPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <QrCodeIcon className='w-5 h-5' />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-4" side="bottom" align="start">
                                <div className="flex flex-col items-center gap-2">
                                    <div ref={qrCodeRef}></div>
                                    <Button
                                            onClick={copyToClipboard}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            {isCopied ? (
                                                <>
                                                    <Check className="w-4 h-4 mr-2" />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4 mr-2" />
                                                    Copy Link
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            onClick={() => qrCode?.download({
                                                name: `qr-code-${resolvedParams.slug}.png`
                                            })}
                                            className="flex-1"
                                        >
                                            Download QR
                                        </Button>
                                    <div className="flex w-full gap-2">

                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        {resolvedParams.slug}
                    </span>
                </div>
                <span className='text-md font-bold flex items-center space-x-2 gap-2'>
                    {isAuthReady && <Profile />}
                </span>
            </header>
            {children}
        </div>
    );
} 