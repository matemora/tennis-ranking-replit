import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

interface TabNavItem {
  name: string;
  href: string;
  adminOnly?: boolean;
}

const TabNavigation = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  
  const tabs: TabNavItem[] = [
    { name: "Rankings", href: "/rankings" },
    { name: "My Matches", href: "/matches" },
    { name: "Statistics", href: "/statistics" },
    { name: "Profile", href: "/profile" },
    { name: "Admin", href: "/admin", adminOnly: true },
  ];

  return (
    <div className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto space-x-4 py-2 no-scrollbar">
          {tabs.map((tab) => {
            // Skip admin tabs for non-admins
            if (tab.adminOnly && !isAdmin) return null;
            
            const isActive = 
              (tab.href === "/" && location === "/") || 
              (tab.href !== "/" && location.startsWith(tab.href));
            
            return (
              <Link key={tab.name} href={tab.href}>
                <a className={cn(
                  "px-4 py-2 font-medium whitespace-nowrap border-b-2",
                  isActive 
                    ? "text-primary border-primary" 
                    : "text-gray-500 border-transparent hover:text-primary"
                )}>
                  {tab.name}
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;
