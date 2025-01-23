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

const Profile = () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        })

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        })

        return () => subscription.unsubscribe();
    }, [])

    const handleSignIn = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    }

    const getInitials = () => {
        if (!user?.user_metadata?.full_name) return null;

        const nameParts = user.user_metadata.full_name.split(' ');
        const firstInitial = nameParts[0]?.[0] || '';
        const lastInitial = nameParts[nameParts.length - 1]?.[0] || '';
        return (firstInitial + lastInitial).toUpperCase();
    }

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
                        <Button
                            className="w-full"
                            variant="default"
                            onClick={handleSignOut}
                        >
                            Sign Out
                        </Button>
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
    )
}

export default Profile;
