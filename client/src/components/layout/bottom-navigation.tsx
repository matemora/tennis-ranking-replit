import { Link, useLocation } from "wouter";
import { 
  Trophy, 
  Volleyball, 
  BarChart2, 
  User, 
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const BottomNavigation = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  
  const navItems = [
    {
      name: "Rankings",
      icon: Trophy,
      href: "/rankings",
      active: location === "/" || location === "/rankings",
    },
    {
      name: "Matches",
      icon: Volleyball,
      href: "/matches",
      active: location === "/matches",
    },
    {
      name: "Stats",
      icon: BarChart2,
      href: "/statistics",
      active: location === "/statistics",
    },
    {
      name: "Profile",
      icon: User,
      href: "/profile",
      active: location === "/profile",
    },
    {
      name: "Admin",
      icon: Settings,
      href: "/admin",
      active: location.startsWith("/admin"),
      adminOnly: true,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-6 sm:px-10 z-10">
      <nav className="flex justify-between items-center max-w-screen-lg mx-auto">
        {navItems.map((item) => {
          // Skip admin items for non-admins
          if (item.adminOnly && !isAdmin) return null;
          
          return (
            <Link key={item.name} href={item.href}>
              <a className="flex flex-col items-center">
                <item.icon 
                  className={cn(
                    "h-6 w-6", 
                    item.active ? "text-primary" : "text-gray-500"
                  )} 
                />
                <span 
                  className={cn(
                    "text-xs mt-1", 
                    item.active ? "text-primary" : "text-gray-500"
                  )}>
                  {item.name}
                </span>
              </a>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNavigation;
