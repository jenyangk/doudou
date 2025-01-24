import { useState, useEffect } from 'react';
import { type User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { PersonIcon } from '@radix-ui/react-icons';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

const Profile = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAnonymous, setIsAnonymous] = useState(false);

    // Get the current path for redirect
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    const isSessionPage = currentPath.startsWith('/sessions/');

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const isAnonUser = session.user.is_anonymous ?? false;
                setIsAnonymous(isAnonUser);

                // Generate and set random name for anonymous users if they don't have one
                if (isAnonUser && !session.user.user_metadata.full_name) {
                    const randomName = uniqueNamesGenerator({
                        dictionaries: [adjectives, colors, animals],
                        style: 'capital',
                        separator: ' '
                    });

                    await supabase.auth.updateUser({
                        data: { full_name: randomName }
                    });
                }
            }
            setUser(session?.user ?? null);
        });

        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user) {
                const isAnonUser = session.user.is_anonymous ?? false;
                setIsAnonymous(isAnonUser);

                // Generate and set random name for anonymous users if they don't have one
                if (isAnonUser && !session.user.user_metadata.full_name) {
                    const randomName = uniqueNamesGenerator({
                        dictionaries: [adjectives, colors, animals],
                        style: 'capital',
                        separator: ' '
                    });

                    await supabase.auth.updateUser({
                        data: { full_name: randomName }
                    });
                }
            }
            setUser(session?.user ?? null);
            console.log("User: ", session?.user);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignIn = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
                redirectTo: `${window.location.origin}/auth/callback?next=${isSessionPage ? currentPath : '/'}`,
            },
        });
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const getInitials = () => {
        if (!user?.user_metadata?.full_name) return null;

        const nameParts = user.user_metadata.full_name.split(' ');
        const firstInitial = nameParts[0]?.[0] || '';
        const lastInitial = nameParts[nameParts.length - 1]?.[0] || '';
        return (firstInitial + lastInitial).toUpperCase();
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-10 w-10 rounded-full p-0"
                >
                    <Avatar>
                        <AvatarFallback>{getInitials() ? getInitials() : <PersonIcon className='w-4 h-4' />}</AvatarFallback>
                    </Avatar>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60" align="end">
                {user ? (
                    <div className="space-y-4">
                        {isAnonymous ? (
                            <>
                                <div className="px-2 py-1 text-sm text-gray-500">
                                    Signed in anonymously as
                                    <div className="font-medium text-gray-500">{user.user_metadata.full_name}</div>
                                </div>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={handleSignIn}
                                >
                                    Sign in with Google
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="px-2 py-1 text-sm text-gray-500">
                                    Signed in as
                                    <div className="font-medium text-black">{user.user_metadata.full_name}</div>
                                </div>
                                <Button
                                    className="w-full"
                                    variant="default"
                                    onClick={handleSignOut}
                                >
                                    Sign Out
                                </Button>
                            </>
                        )}
                    </div>
                ) : (
                    <Button
                        className="w-full"
                        variant="default"
                        onClick={handleSignIn}
                    >
                        Sign in with Google
                    </Button>
                )}
            </PopoverContent>
        </Popover>
    );
};

export default Profile;
