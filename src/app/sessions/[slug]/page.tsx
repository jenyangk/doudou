'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, X, Lock, Unlock } from 'lucide-react'
import { PersonIcon, TokensIcon } from '@radix-ui/react-icons'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { UploadButton, useUploadThing } from '@/lib/uploadthing'
import { image } from 'framer-motion/client'

interface Image {
    id: number;
    sessionId: number;
    userId: number;
    url: string;
}

interface Session {
    id: number;
    sessionName: string;
    isVotingPhase: boolean;
    isUploadPhase: boolean;
    maxUpload: number;
    maxVoteAmount: number;
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
    userId: number;
    imageId: number;
}

export default function Board({ params, searchParams }: { params: { slug: string }; searchParams: { username: string, isCreator: boolean } }) {
    const [images, setImages] = useState<Image[]>([]);
    const [selectedImage, setSelectedImage] = useState<Image | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isUploadPhase, setIsUploadPhase] = useState(false);
    const [isVotingPhase, setIsVotingPhase] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [numberOfVotes, setNumberOfVotes] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [userVoted, setUserVoted] = useState<Vote[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchSession = async () => {
            if (searchParams.username !== '' && params.slug !== '') {
                const userData = await supabase
                    .from('session_users')
                    .select('*, sessions!inner(sessionCode)')
                    .eq('username', searchParams.username)
                    .eq('sessions.sessionCode', params.slug)
                    .single();

                if (userData.error || !userData.data) {
                    toast.error('Error fetching user session. Please try again');
                    return;
                }

                setUser(userData.data as User);
                setIsLoggedIn(true);
                const { data, error } = await supabase
                    .from('sessions')
                    .select('*, session_users(username)')
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

                const sessionImages = await supabase
                    .from('session_images')
                    .select('*')
                    .eq('sessionId', sessionData.id)
                    .order('created_at', { ascending: false })

                setImages(sessionImages.data as Image[]);

                const sessionVotes = await supabase
                    .from('votes')
                    .select('*')
                    .eq('sessionId', sessionData.id)
                    .eq('userId', userData.data?.id)

                if (sessionVotes.error || !sessionVotes.data) {
                    toast.error('Error fetching session votes. Please try again');
                    return;
                }

                setUserVoted(sessionVotes.data as Vote[]);

                const imageChannel = supabase
                    .channel('session_images')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'session_images', filter: `sessionId=eq.${sessionData?.id}` }, handleImageInsert)
                    .subscribe()

                const votesChannel = supabase
                    .channel('votes')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `(sessionId=eq.${sessionData?.id} and userId=eq.${userData.data?.id})` }, handleVoteInsert)

                const votesDeleteChannel = supabase
                    .channel('votes')
                    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'votes', filter: `(sessionId=eq.${sessionData?.id} and userId=eq.${userData.data?.id})` }, handleVoteDelete)

                const sessionChannel = supabase
                    .channel('sessions')
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `sessionCode=eq.${params.slug}` }, handleSessionUpdate)
                    .subscribe()

                // return (imageChannel, sessionChannel,votesChannel);
            }
        }

        fetchSession();
    }, [])

    const handleImageInsert = (payload: any) => {
        if (payload.new) {
            const imagePayload = payload.new as Image;
            toast.info(`${imagePayload.userId}, have uploaded a new image!`);
            setImages([...images, payload.new as Image])
        }
    }

    const handleSessionUpdate = (payload: any) => {
        if (payload.new) {
            const sessionPayload = payload.new as Session;
            setIsUploadPhase(sessionPayload.isUploadPhase);
            setIsVotingPhase(sessionPayload.isVotingPhase);

            // if (sessionPayload.isUploadPhase !== isUploadPhase) {
            //     toast.warning(`Uploads are now ${sessionPayload.isUploadPhase ? 'unlocked' : 'locked'}`);
            //     setIsUploadPhase(sessionPayload.isUploadPhase);
            // }

            // if (sessionPayload.isVotingPhase !== isVotingPhase) {
            //     toast.warning(`Voting is now ${sessionPayload.isVotingPhase ? 'unlocked' : 'locked'}`);
            //     setIsVotingPhase(sessionPayload.isVotingPhase);
            // }
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
            .eq('userId', user?.id)
            .select('*')

        if (error || !data) {
            toast.error('Error deleting vote. Please try again');
            return;
        }
    }

    const handleVote = async (imageId: number) => {
        if (isVotingPhase) {
            const { data, error } = await supabase
                .from('votes')
                .insert([{ sessionId: session?.id, imageId: imageId, userId: user?.id, vote: true }])
                .select('*')

            if (error || !data) {
                toast.error('Error inserting vote. Please try again');
                return;
            }
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
            .insert([{ sessionId: session?.id, userId: user?.id, url: res[0].url }])
            .select('*')

        if (error || !data) {
            toast.error('Error inserting image. Please try again');
            return;
        }

        toast.success('Image uploaded successfully');
    }

    const renderPhaseControl = () => {
        if (user === null || !user!.isCreator) return null

        return (
            <div className="p-4 bg-gray-100 rounded-lg flex flex-col gap-4">
                <h2 className="text-lg font-semibold mb-4">Dashboard</h2>
                <p className='text-sm'>Total Images: { }</p>
                <p className='text-sm'>Total Votes: {numberOfVotes}</p>
                <div className="flex space-x-4 items-center justify-between">
                    {isUploadPhase ? <span className='text-green-500 font-mono'>Uploads Enabled</span> : <span className='text-red-500 font-mono'>Uploads Disabled</span>}
                    <Button onClick={toggleUploadLock}>
                        {isUploadPhase ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
                        {isUploadPhase ? 'Lock Uploads' : 'Unlock Uploads'}
                    </Button>
                </div>
                <div className="flex space-x-4 items-center justify-between">
                    {isVotingPhase ? <span className='text-green-500 font-mono'>Voting Enabled</span> : <span className='text-red-500 font-mono'>Voting Disabled</span>}
                    <Button onClick={toggleVoteLock}>
                        {isVotingPhase ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
                        {isVotingPhase ? 'Lock Voting' : 'Unlock Voting'}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div>
            <header className='sticky top-0 flex h-12 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between'>
                <div>
                    <span className='text-md font-bold flex items-center space-x-2 gap-2'>
                        <TokensIcon className='w-5 h-5' />
                        Session: {params.slug}
                    </span>
                    <p className='text-xs'>doudou.muniee.com/sessions/{params.slug}</p>
                </div>
                <span className='text-md font-bold flex items-center space-x-2 gap-2'>
                    <PersonIcon className='w-5 h-5' />
                    User: {searchParams.username}
                </span>
            </header>
            <div className="container mx-auto px-4 py-2">
                {renderPhaseControl()}
                {isUploadPhase && images.filter(image => image.userId === user?.id).length < (session?.maxUpload ?? 1) && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Upload a Photo</h2>
                        <div className="flex items-center space-x-4">
                            <UploadButton
                                /**
                                 * @see https://docs.uploadthing.com/api-reference/react#uploadbutton
                                 */
                                endpoint="imageUploader"
                                onClientUploadComplete={(res) => {
                                    console.log("Upload Completed.", res);
                                    handleSuccessfulUpload(res);
                                }}
                                onUploadBegin={() => {
                                    console.log("upload begin");
                                }}
                                config={{ appendOnPaste: true, mode: "manual" }}
                            />
                        </div>
                    </div>
                )}
                <h2 className="text-2xl font-semibold mt-4 mb-2">Gallery</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 justify-items-center">
                    {images !== null && images.map(image => (
                        <div key={image.id} className="border rounded-lg p-4 w-min flex flex-col justify-between">
                            <Image
                                src={image.url}
                                alt="Uploaded photo"
                                width={256}
                                height={256}
                                className="mb-4 cursor-pointer min-w-64"
                                onClick={() => setSelectedImage(image)}
                            />
                            {isVotingPhase && userVoted.filter(vote => vote.imageId === image.id).length === 0 && userVoted.length < (session?.maxVoteAmount ?? 3) && (
                                <Button className='w-full self-end' onClick={() => handleVote(image.id)}>
                                    Vote
                                </Button>
                            )}
                            {isVotingPhase && userVoted.filter(vote => vote.imageId === image.id).length === 1 && (
                                <Button className='w-full self-end' onClick={() => handleDeleteVote(image.id)}>
                                    Remove Vote
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
                {selectedImage && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg p-4 max-w-2xl w-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold">Photo Details</h3>
                                <Button variant="ghost" onClick={() => setSelectedImage(null)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <Image
                                src={selectedImage.url}
                                alt="Selected photo"
                                width={600}
                                height={600}
                                className="mb-4"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>

    )
}