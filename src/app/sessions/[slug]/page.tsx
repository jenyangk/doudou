'use client'

import { useState, useEffect, useRef, use } from 'react';
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, X, Lock, Unlock, QrCodeIcon, Trophy, TrophyIcon, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { PersonIcon, TokensIcon } from '@radix-ui/react-icons'
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import QRCodeStyling, { Options } from "qr-code-styling";
import Link from 'next/link';
import { motion, AnimatePresence } from "framer-motion";

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

    const [selectedId, setSelectedId] = useState<number | null>(null);

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
            setImages(currentImages => {
                // Check if image already exists to avoid duplicates
                const exists = currentImages.some(img => img.id === payload.new.id);
                if (exists) {
                    return currentImages;
                }
                // Add new image to the beginning of the array
                return [payload.new as SessionImage, ...currentImages];
            });
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
                <div className="mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
                    {images !== null && images.filter(image => image.url !== null).length > 0 ? (
                        images.filter(image => image.url !== null).map(image => (
                            <div key={image.id} className="relative aspect-square rounded-md group cursor-pointer">
                                <motion.div 
                                    layoutId={`container-${image.id}`}
                                    className="relative w-full h-full"
                                    onClick={() => setSelectedId(image.id)}
                                >
                                    <motion.div 
                                        layoutId={`image-${image.id}`} 
                                        className={`w-full h-full relative ${
                                            userVoted.some(vote => vote.imageId === image.id) 
                                                ? 'after:absolute after:inset-0 after:bg-yellow-500/20 after:rounded-md' 
                                                : ''
                                        }`}
                                    >
                                        <Image
                                            src={image?.url!}
                                            alt="Photo"
                                            fill
                                            className="rounded-md object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                            priority={true}
                                        />
                                    </motion.div>
                                    {userVoted.some(vote => vote.imageId === image.id) && (
                                        <motion.div layoutId={`trophy-${image.id}`} className="absolute top-2 right-2">
                                            <Trophy className="w-4 h-4 text-yellow-500 drop-shadow-md" />
                                        </motion.div>
                                    )}
                                </motion.div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-gray-100 p-8 mb-4">
                                <Camera className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No photos yet</h3>
                            <p className="text-sm text-gray-500 max-w-sm">
                                {isUploadPhase 
                                    ? "Be the first to share a photo! Click the upload button to get started."
                                    : "Uploads are currently disabled. Please wait for the host to enable uploads."}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {selectedId && images.find(img => img.id === selectedId) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={() => setSelectedId(null)}
                    >
                        <motion.div 
                            layoutId={`container-${selectedId}`}
                            className="absolute inset-4 md:inset-8 flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative w-full h-full max-w-5xl mx-auto">
                                <motion.div layoutId={`image-${selectedId}`} className="w-full h-full">
                                    <Image
                                        src={images.find(img => img.id === selectedId)?.url!}
                                        alt="Selected photo"
                                        fill
                                        className="rounded-lg object-contain"
                                        sizes="100vw"
                                        priority={true}
                                    />
                                </motion.div>

                                {/* Top controls bar */}
                                <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                                    {userVoted.some(vote => vote.imageId === selectedId) && (
                                        <motion.div layoutId={`trophy-${selectedId}`} className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                                            <span className="text-sm text-white">Voted</span>
                                            <Trophy className="w-4 h-4 text-yellow-500" />
                                        </motion.div>
                                    )}
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="ml-auto"
                                    >
                                        <Button 
                                            variant="outline" 
                                            size="icon"
                                            className="rounded-full bg-black/20 border-white/20 backdrop-blur-sm hover:bg-black/40"
                                            onClick={() => setSelectedId(null)}
                                        >
                                            <X className="w-4 h-4 text-white" />
                                        </Button>
                                    </motion.div>
                                </div>

                                {/* Bottom controls bar */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/50 to-transparent flex justify-center items-center"
                                >
                                    {isVotingPhase && !userVoted.some(vote => vote.imageId === selectedId) && 
                                     userVoted.length < (session?.maxVoteAmount ?? 3) && (
                                        <Button 
                                            size="lg"
                                            className="bg-green-500/90 hover:bg-green-500 backdrop-blur-sm border-2 border-white/20 
                                                       px-8 text-lg font-semibold shadow-lg hover:scale-105 transition-all duration-200
                                                       flex items-center gap-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleVote(selectedId);
                                            }}
                                        >
                                            <span>Vote for this</span>
                                            <Trophy className="w-5 h-5" />
                                        </Button>
                                    )}
                                    {isVotingPhase && userVoted.some(vote => vote.imageId === selectedId) && (
                                        <Button 
                                            size="lg"
                                            className="bg-red-500/90 hover:bg-red-500 backdrop-blur-sm border-2 border-white/20 
                                                       px-8 text-lg font-semibold shadow-lg hover:scale-105 transition-all duration-200
                                                       flex items-center gap-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteVote(selectedId);
                                            }}
                                        >
                                            <span>Remove Vote</span>
                                            <X className="w-5 h-5" />
                                        </Button>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}