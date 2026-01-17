import { useState } from "react";
import { UserPlus, MoreVertical, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InviteMemberModal } from "./InviteMemberModal";
import { useToast } from "@/hooks/use-toast";
import type { ProjectMember } from "@/data/mockData";

interface MembersTabProps {
  projectId: string;
  initialMembers: ProjectMember[];
}

const roleColors: Record<ProjectMember["role"], string> = {
  owner: "bg-primary text-primary-foreground",
  admin: "bg-info text-info-foreground",
  editor: "bg-success text-success-foreground",
  viewer: "bg-muted text-muted-foreground",
};

export function MembersTab({ projectId, initialMembers }: MembersTabProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<ProjectMember[]>(initialMembers);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState<ProjectMember | null>(null);

  const handleInvite = (data: { email: string; role: ProjectMember["role"] }) => {
    const newMember: ProjectMember = {
      id: `user-${Date.now()}`,
      name: data.email.split("@")[0],
      email: data.email,
      initials: data.email.substring(0, 2).toUpperCase(),
      role: data.role,
      joinedAt: new Date().toISOString(),
    };

    setMembers((prev) => [...prev, newMember]);
    toast({
      title: "Invitation sent",
      description: `An invitation has been sent to ${data.email}.`,
    });
  };

  const handleRemove = () => {
    if (!removingMember) return;
    setMembers((prev) => prev.filter((m) => m.id !== removingMember.id));
    toast({
      title: "Member removed",
      description: `${removingMember.name} has been removed from the project.`,
    });
    setRemovingMember(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Team Members ({members.length})
        </h3>
        <Button size="sm" onClick={() => setIsInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <div className="border border-border rounded-lg divide-y divide-border">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {member.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className={roleColors[member.role]} variant="secondary">
                {member.role === "owner" && <Shield className="h-3 w-3 mr-1" />}
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </Badge>

              {member.role !== "owner" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="cursor-pointer">
                      Change Role
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={() => setRemovingMember(member)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>

      <InviteMemberModal
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        onSubmit={handleInvite}
      />

      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removingMember?.name} from this
              project? They will lose access to all project documents and
              conversations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
