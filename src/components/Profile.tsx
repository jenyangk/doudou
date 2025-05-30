import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from '@/components/ui/button';
import { PersonIcon } from '@radix-ui/react-icons';

const Profile = () => {
    const { isSignedIn } = useUser();

    return (
        <div>
            {isSignedIn ? (
                <UserButton afterSignOutUrl="/" />
            ) : (
                <SignInButton mode="modal">
                    <Button
                        variant="ghost"
                        className="h-10 w-10 rounded-full p-0"
                    >
                        <PersonIcon className="w-5 h-5" />
                    </Button>
                </SignInButton>
            )}
        </div>
    );
};

export default Profile;
