import { NavLink, useLocation } from "react-router-dom";
import { 
  Users, 
  FileText, 
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

const adminItems = [
  { title: "Dashboard", url: "/dashboard", icon: PieChart },
  { title: "User Management", url: "/dashboard/users", icon: Users },
  { title: "Themes", url: "/dashboard/themes", icon: Briefcase },
  { title: "Risk Buckets", url: "/dashboard/risk-buckets", icon: Shield },
  { title: "Stocks", url: "/dashboard/stocks", icon: Building },
  { title: "Content Management", url: "/dashboard/content-management", icon: FolderOpen },
  { title: "Account", url: "/dashboard/account", icon: User },
];

const analystItems = [
  { title: "Dashboard", url: "/dashboard", icon: PieChart },
  { title: "Themes", url: "/dashboard/themes", icon: Briefcase },
  { title: "Risk Buckets", url: "/dashboard/risk-buckets", icon: Shield },
  { title: "Stocks", url: "/dashboard/stocks", icon: Building },
  { title: "Content Management", url: "/dashboard/content-management", icon: FolderOpen },
  { title: "Account", url: "/dashboard/account", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { userRole, signOut } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const items = userRole === 'admin' ? adminItems : analystItems;
  const isActive = (path: string) => currentPath === path;
  
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
          <SidebarGroupLabel className="text-sidebar-primary font-semibold">
            Stock Research Platform
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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