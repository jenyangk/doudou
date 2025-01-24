'use client'

import { useState, useEffect, useRef, use } from 'react';
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, X, Lock, Unlock, QrCodeIcon, Trophy, TrophyIcon, ArrowRight, CheckCircle2 } from 'lucide-react'
import { PersonIcon, TokensIcon } from '@radix-ui/react-icons'
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import QRCodeStyling, { Options } from "qr-code-styling";
import Link from 'next/link';

import Uploader from '@/components/Uploader';
import Profile from '@/components/Profile';

interface SessionImage {
    id: number;
    sessionId: number;
    userId: string;
    url: string;
    votedByCurrentUser?: boolean;
}

interface Session {
    id: number;
    sessionName: string;
    isVotingPhase: boolean;
    isUploadPhase: boolean;
    maxUpload: number;
    maxVoteAmount: number;
    createdBy: string;
}

interface User {
    id: number;
    username: string;
    sessionId: number;
    isCreator: boolean;
}

interface Vote {
    id: number;
    sessionId: number;
    userId: string;
    imageId: number;
}

export default function Board(
    props: { params: Promise<{ slug: string }> }
) {
    const params = use(props.params);
    const [images, setImages] = useState<SessionImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<SessionImage | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isUploadPhase, setIsUploadPhase] = useState(false);
    const [isVotingPhase, setIsVotingPhase] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [numberOfVotes, setNumberOfVotes] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [userVoted, setUserVoted] = useState<Vote[]>([]);
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [maxVotes, setMaxVotes] = useState(0);
    const [remainingVotes, setRemainingVotes] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [qrCode] = useState<QRCodeStyling>(() => new QRCodeStyling({
        width: 256,
        height: 256,
        data: `https://doudou.muniee.com/sessions/${params.slug}`,
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

    const qrCodeRef = useRef<HTMLDivElement>(null);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    useEffect(() => {
        if (isPopoverOpen) {
            setTimeout(() => {
                if (qrCodeRef.current) {
                    qrCode?.append(qrCodeRef.current);
                }
            }, 100);
        }
    }, [isPopoverOpen, qrCodeRef]);

    useEffect(() => {
        const fetchSession = async () => {
            if (params.slug !== '') {
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user) {
                    return; // Exit if no user - layout will handle auth
                }

                setCurrentUserId(user.id);
                setIsLoggedIn(true);

                const { data, error } = await supabase
                    .from('sessions')
                    .select('*')
                    .eq('sessionCode', params.slug)
                    .single();

                if (error || !data) {
                    toast.error('Error fetching session. Please try again');
                    return;
                }

                const sessionData = data as Session;
                setSession(sessionData);
                setIsVotingPhase(sessionData.isVotingPhase);
                setIsUploadPhase(sessionData.isUploadPhase);
                setMaxVotes(sessionData.maxVoteAmount);

                if (sessionData.createdBy === user.id) {
                    setIsOwner(true);
                } else {
                    setIsOwner(false);
                }

                try {
                    const sessionImages = await supabase
                        .from('session_images')
                        .select('*')
                        .eq('sessionId', sessionData.id)
                        .order('created_at', { ascending: false })

                    if (sessionImages.error || !sessionImages.data) {
                        toast.error('Error fetching session images. Please try again');
                    } else {
                        setImages(sessionImages.data as SessionImage[]);
                    }
                } catch (error) {
                    toast.error('Error fetching session images. Please try again');
                }

                try {
                    const sessionVotes = await supabase
                        .from('votes')
                        .select('*')
                        .eq('sessionId', sessionData.id)
                        .eq('userId', user.id)

                    if (sessionVotes.error || !sessionVotes.data) {
                        toast.error('Error fetching session votes. Please try again');
                    }
                } catch (error) {
                    toast.error('Error fetching session votes. Please try again');
                }

                const imageChannel = supabase
                    .channel('session_images')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'session_images', filter: `sessionId=eq.${sessionData?.id}` }, handleImageInsert)
                    .subscribe()

                const votesChannel = supabase
                    .channel('votes')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `(sessionId=eq.${sessionData?.id} and userId=eq.${currentUserId})` }, handleVoteInsert)

                const votesDeleteChannel = supabase
                    .channel('votes')
                    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'votes', filter: `(sessionId=eq.${sessionData?.id} and userId=eq.${currentUserId})` }, handleVoteDelete)

                const sessionChannel = supabase
                    .channel('sessions')
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `sessionCode=eq.${params.slug}` }, handleSessionUpdate)
                    .subscribe()

                setIsLoading(false);

                if (sessionData) {
                    setSession(sessionData);
                    setIsVotingPhase(sessionData.isVotingPhase);
                    setIsUploadPhase(sessionData.isUploadPhase);
                    setMaxVotes(sessionData.maxVoteAmount);

                    // Get current user's votes
                    const { data: votes } = await supabase
                        .from('votes')
                        .select('*')
                        .eq('sessionId', sessionData.id)
                        .eq('userId', user.id);

                    setUserVoted(votes || []);
                    setRemainingVotes(sessionData.maxVoteAmount - (votes?.length || 0));
                }
            }
        }

        fetchSession();
    }, [params.slug])

    useEffect(() => {
        if (session) {
            setRemainingVotes(session.maxVoteAmount - userVoted.length);
        }
    }, [userVoted, session]);

    const handleImageInsert = (payload: any) => {
        if (payload.new) {
            setImages([...images, payload.new as SessionImage])
        }
    }

    const handleSessionUpdate = (payload: any) => {
        if (payload.new) {
            const sessionPayload = payload.new as Session;
            setIsUploadPhase(sessionPayload.isUploadPhase);
            setIsVotingPhase(sessionPayload.isVotingPhase);
        }
    }

    const handleVoteInsert = (payload: any) => {
        if (payload.new) {
            const votePayload = payload.new as Vote;
            setUserVoted([...userVoted, votePayload])
        }
    }

    const handleVoteDelete = (payload: any) => {
        if (payload.old) {
            const votePayload = payload.old as Vote;
            setUserVoted(userVoted.filter(vote => vote.id !== votePayload.id))
        }
    }

    const handleDeleteVote = async (imageId: number) => {
        const { data, error } = await supabase
            .from('votes')
            .delete()
            .eq('sessionId', session?.id)
            .eq('imageId', imageId)
            .eq('userId', currentUserId)
            .select('*')

        if (error || !data) {
            toast.error('Error deleting vote. Please try again');
            return;
        }

        setUserVoted(userVoted.filter(vote => vote.imageId !== imageId))
    }

    const handleVote = async (imageId: number) => {
        if (isVotingPhase && session?.id && currentUserId != null) {
            const { data, error } = await supabase
                .from('votes')
                .insert([{ sessionId: session?.id, imageId: imageId, userId: currentUserId, vote: true }])
                .select('*')
                .single()

            if (error || !data) {
                toast.error('Error inserting vote. Please try again');
                return;
            }

            setUserVoted([...userVoted, { sessionId: session?.id, imageId: imageId, userId: currentUserId, id: data.id }])
        }
    }

    const toggleUploadLock = async () => {
        const { data, error } = await supabase
            .from('sessions')
            .update({ isUploadPhase: !isUploadPhase })
            .eq('id', session?.id)
            .select('*')

        if (error || !data) {
            toast.error('Error updating session. Please try again');
            return;
        }

        setIsUploadPhase(!isUploadPhase)
    }

    const toggleVoteLock = async () => {
        const { data, error } = await supabase
            .from('sessions')
            .update({ isVotingPhase: !isVotingPhase })
            .eq('id', session?.id)
            .select('*')

        if (error || !data) {
            toast.error('Error updating session. Please try again');
            return;
        }

        setIsVotingPhase(!isVotingPhase)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
        }
    }

    const handleSuccessfulUpload = async (res: any) => {
        const { data, error } = await supabase
            .from('session_images')
            .insert([{ sessionId: session?.id, userId: currentUserId, url: res[0].url }])
            .select('*')

        if (error || !data) {
            toast.error('Error inserting image. Please try again');
            return;
        }

        toast.success('Image uploaded successfully');
    }

    const downloadQRCode = () => {
        // if (qrCode) {
        //     qrCode.download({ name: `qr-code-${params.slug}.png` });
        // }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Loading session...</div>
            </div>
        );
    }

    return (
        <div>
            {!isVotingPhase ? (
                <div className="bg-yellow-100 border-b border-yellow-200">
                    <div className="container mx-auto flex items-center justify-center gap-4">
                        <p className="text-yellow-800 font-bold text-xs flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            Voting Disabled
                        </p>
                        <Link href={`/sessions/${params.slug}/results`}>
                            <Button variant="ghost" size="sm" className="text-yellow-800 font-bold text-xs flex items-center gap-2">
                                View Results
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-green-100 border-b border-green-200 p-2">
                    <div className="container mx-auto flex items-center justify-between">
                        <p className="text-green-800 font-bold text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Voting Open
                        </p>
                        <p className="text-green-800 font-bold text-xs flex items-center gap-2">
                            <span>{remainingVotes}</span>
                            <span>votes remaining</span>
                        </p>
                    </div>
                </div>
            )}
            <div className="container mx-auto px-4 py-2">
                {isOwner ? (
                    <>
                        <div className="p-4 bg-gray-100 rounded-lg flex flex-col gap-2 text-black">
                            <h2 className="text-lg font-semibold">Dashboard</h2>
                            <div className="grid grid-cols-2 gap-2 items-center">
                                <p className='text-sm'>Total Images:</p>
                                <p className='text-sm justify-self-end'>{images.length}</p>
                                <p className='text-sm'>Total Votes:</p>
                                <p className='text-sm justify-self-end'>{numberOfVotes}</p>
                                {isUploadPhase ? <span className='text-green-500 text-sm'>Uploads Enabled</span> : <span className='text-red-500 text-sm'>Uploads Disabled</span>}
                                <Button onClick={toggleUploadLock} size="icon" className='justify-self-end'>
                                    {isUploadPhase ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                </Button>
                                {isVotingPhase ? <span className='text-green-500 text-sm'>Voting Enabled</span> : <span className='text-red-500 text-sm'>Voting Disabled</span>}
                                <Button onClick={toggleVoteLock} size="icon" className='justify-self-end'>
                                    {isVotingPhase ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className='my-2'>
                            <Uploader sessionId={session?.id} />
                        </div>
                    </>
                ) : null}
                <h2 className="text-2xl font-semibold mt-4">Gallery</h2>
                <p className='text-sm text-gray-400 mb-2'>Max Votes: {session?.maxVoteAmount}</p>
                <div className="mx-auto grid grid-cols-4 gap-2 items-center">
                    {images !== null && images.filter(image => image.url !== null).map(image => (
                        <div key={image.id} className='relative rounded-md group'>
                            <div className={`
                                relative 
                                ${userVoted.some(vote => vote.imageId === image.id) ? 'after:absolute after:inset-0 after:bg-yellow-500/20 after:rounded-md' : ''}
                            `} onClick={() => setSelectedImage(image)}>
                                <Image
                                    src={image?.url!}
                                    alt="Uploaded photo"
                                    width={128}
                                    height={128}
                                    className="rounded-md"
                                />
                                {userVoted.some(vote => vote.imageId === image.id) && (
                                    <div className="absolute top-1 right-1">
                                        <Trophy className="w-4 h-4 text-yellow-500 drop-shadow-md" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {selectedImage && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg p-4 max-w-2xl w-full">
                            <div className="flex justify-end mb-4">
                                <Button variant="ghost" onClick={() => setSelectedImage(null)} className="text-black">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            {userVoted.some(vote => vote.imageId === selectedImage.id) && (
                                <div className='flex justify-center items-center gap-2 mb-4'>
                                    <span className='text-sm text-black'>Voted</span>
                                    <Trophy className="w-4 h-4 text-yellow-500 drop-shadow-md" />
                                </div>
                            )}
                            <Image
                                src={selectedImage.url}
                                alt="Selected photo"
                                width={600}
                                height={600}
                                className="mb-4"
                            />
                            {isVotingPhase && userVoted.filter(vote => vote.imageId === selectedImage.id).length === 0 && userVoted.length < (session?.maxVoteAmount ?? 3) && (
                                <Button className='w-full self-end bg-green-400' onClick={() => handleVote(selectedImage.id)}>
                                    Vote
                                </Button>
                            )}
                            {isVotingPhase && userVoted.filter(vote => vote.imageId === selectedImage.id).length >= 1 && (
                                <Button className='w-full self-end bg-red-400' onClick={() => handleDeleteVote(selectedImage.id)}>
                                    Remove Vote
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

    )
}