"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, LogOut, LayoutDashboard } from "lucide-react";
import { storage } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

export const UserAvatar = ({ user }: { user?: any }) => {
  const router = useRouter();
  const { toast } = useToast();
  const currentUser = user || storage.getUser();

  if (!currentUser) return null;

  const handleLogout = () => {
    storage.clearUser();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push("/");
  };

  const getInitials = () => {
    return currentUser.username?.substring(0, 2).toUpperCase() || "U";
  };

  const getDashboardPath = () => {
    return `/dashboard/${currentUser.role}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-9 w-9 cursor-pointer border-2 border-accent/20 hover:border-accent transition-colors">
          <AvatarFallback className="bg-accent/10 text-accent font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{currentUser.username}</p>
            <p className="text-xs text-muted-foreground">{currentUser.email}</p>
            <p className="text-xs text-accent capitalize">{currentUser.role}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={getDashboardPath()} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
