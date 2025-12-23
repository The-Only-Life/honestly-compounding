import { NavLink } from "react-router-dom";
import {
  Users,
  Briefcase,
  PieChart,
  LogOut,
  Shield,
  Building,
  User,
  FolderOpen
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types/roles";

type MenuItem = {
  title: string;
  url: string;
  icon: any;
  allowedRoles: UserRole[];
};

const menuItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: PieChart, allowedRoles: ['admin', 'sponsor', 'subscriber'] },
  { title: "User Management", url: "/dashboard/users", icon: Users, allowedRoles: ['admin'] },
  { title: "Themes", url: "/dashboard/themes", icon: Briefcase, allowedRoles: ['admin', 'sponsor', 'subscriber'] },
  { title: "Buckets", url: "/dashboard/buckets", icon: Shield, allowedRoles: ['admin', 'sponsor', 'subscriber'] },
  { title: "Stocks", url: "/dashboard/stocks", icon: Building, allowedRoles: ['admin', 'sponsor', 'subscriber'] },
  { title: "Content Management", url: "/dashboard/content-management", icon: FolderOpen, allowedRoles: ['admin', 'sponsor', 'subscriber'] },
  { title: "Account", url: "/dashboard/account", icon: User, allowedRoles: ['admin', 'sponsor', 'subscriber'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { userRole, signOut } = useAuth();

  // Filter menu items based on user role
  const visibleItems = menuItems.filter(item =>
    userRole && item.allowedRoles.includes(userRole as UserRole)
  );

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50";

  const handleSignOut = async () => {
    await signOut();
  };

  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className="px-3 py-4">
            {isCollapsed ? (
              <img src="/android-chrome-512x512.png" alt="HC" className="h-8 w-8 mx-auto" />
            ) : (
              <img src="/Logo.png" alt="Honestly Compounding" className="h-10 w-auto" />
            )}
          </div>

          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item: MenuItem) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}