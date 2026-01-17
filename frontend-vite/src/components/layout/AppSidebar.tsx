import { FileText, FolderOpen, Library, MessageSquare, Plus, LogOut, Database } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: FolderOpen,
  },
  {
    title: "Prompts Library",
    url: "/prompts",
    icon: Library,
  },
  {
    title: "Recent Chats",
    url: "/chats",
    icon: MessageSquare,
  },
  {
    title: "Knowledge Base",
    url: "/knowledge-base",
    icon: Database,
  },
];

interface AppSidebarProps {
  onNewProject?: () => void;
}

export function AppSidebar({ onNewProject }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNewChat = () => {
    navigate("/chat");
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <NavLink to="/" className="flex items-center gap-2 px-2">
          <FileText className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg text-foreground">DocInsight</span>
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <div className="px-2 mb-3">
            <Button 
              className="w-full justify-start gap-2" 
              size="sm"
              onClick={handleNewChat}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-4" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full transition-colors">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
