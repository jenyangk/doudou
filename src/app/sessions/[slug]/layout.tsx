'use client'

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { QrCodeIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import QRCodeStyling from "qr-code-styling";
import { useState, useRef, useEffect } from 'react';
import Profile from '@/components/Profile';

export default function SessionLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const resolvedParams = use(params);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const qrCodeRef = useRef<HTMLDivElement>(null);

    const [qrCode] = useState<QRCodeStyling>(() => new QRCodeStyling({
        width: 256,
        height: 256,
        data: `https://doudou.muniee.com/sessions/${resolvedParams.slug}`,
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

    useEffect(() => {
        if (isPopoverOpen) {
            setTimeout(() => {
                if (qrCodeRef.current) {
                    qrCode?.append(qrCodeRef.current);
                }
            }, 100);
        }
    }, [isPopoverOpen, qrCode]);

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
                                <div className="flex flex-col items-center gap-4">
                                    <div ref={qrCodeRef}></div>
                                    <Button
                                        onClick={() => qrCode?.download({
                                            name: `qr-code-${resolvedParams.slug}.png`
                                        })}
                                        className="w-full"
                                    >
                                        Download QR Code
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                        {resolvedParams.slug}
                    </span>
                </div>
                <span className='text-md font-bold flex items-center space-x-2 gap-2'>
                    <Profile />
                </span>
            </header>
            {children}
        </div>
    );
} 