import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

const Header = () => {
  const { user } = useAuth();
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/rankings">
          <a className="flex items-center cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
            </svg>
            <h1 className="text-xl font-bold">TennisRank</h1>
          </a>
        </Link>
        
        <div className="flex items-center">
          <div className="mr-4 relative">
            <button className="relative">
              <Bell className="h-6 w-6" />
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                3
              </Badge>
            </button>
          </div>
          
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={user?.photoUrl} alt={user?.fullName} />
              <AvatarFallback>{user?.fullName ? getInitials(user.fullName) : '?'}</AvatarFallback>
            </Avatar>
            <span className="font-medium hidden sm:inline">{user?.fullName}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
