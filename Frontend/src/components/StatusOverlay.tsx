"use client";

import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Ban, RefreshCw, AlertCircle, XCircle, ShieldAlert } from "lucide-react";

interface StatusOverlayProps {
  title: string;
  message: string;
  type?: 'deactivated' | 'pending' | 'rejected';
  details?: string;
  onAction?: () => void;
  actionText?: string;
  icon?: React.ReactNode;
}

export function StatusOverlay({
  title,
  message,
  type = 'deactivated',
  details,
  onAction,
  actionText = "Check Status",
  icon
}: StatusOverlayProps) {
  const isDestructive = type === 'deactivated' || type === 'rejected';

  return (
    <div className="fixed inset-0 top-16 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
      <Card className="relative w-full max-w-md shadow-2xl animate-scale-in border-accent/20">
        <CardHeader className="text-center">
          <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 ${type === 'rejected' ? 'bg-red-500/10 border-2 border-red-500/20' :
              type === 'deactivated' ? 'bg-destructive/10' : 'bg-accent/10'
            }`}>
            {icon || (
              type === 'rejected' ? (
                <ShieldAlert className="h-8 w-8 text-red-500" />
              ) : type === 'deactivated' ? (
                <Ban className="h-8 w-8 text-destructive animate-pulse" />
              ) : (
                <AlertCircle className="h-8 w-8 text-accent" />
              )
            )}
          </div>
          <CardTitle className={`text-2xl uppercase tracking-tighter font-bold ${type === 'rejected' ? 'text-red-600' : ''}`}>
            {title}
          </CardTitle>
          <p className="text-muted-foreground mt-2">{message}</p>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {details && (
            <div className={`p-4 rounded-lg text-sm flex items-start gap-3 text-left ${type === 'rejected' ? 'bg-red-500/5 border border-red-500/10' : isDestructive ? 'bg-destructive/5 border border-destructive/10' : 'bg-muted'}`}>
              {type === 'rejected' ? <XCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" /> : <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${isDestructive ? 'text-destructive' : 'text-accent'}`} />}
              <div>
                <p className={`font-bold ${type === 'rejected' ? 'text-red-600' : isDestructive ? 'text-destructive' : 'text-primary'}`}>
                  {type === 'rejected' ? "Rejection Reason" : type === 'deactivated' ? "Access Suspended" : "Status Detail"}
                </p>
                <p className={`leading-snug ${type === 'rejected' ? 'text-red-700/80' : 'text-muted-foreground'}`}>{details}</p>
                <p className="text-[10px] mt-2 font-bold uppercase tracking-widest opacity-70">Administrative Action Profile</p>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            className="w-full hover:bg-accent/10 transition-all font-semibold"
            onClick={onAction || (() => window.location.reload())}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {actionText}
          </Button>
          {type === 'deactivated' && (
            <Button
              variant="ghost"
              className="h-full w-full text-xs text-muted-foreground hover:text-destructive"
              onClick={() => {
                sessionStorage.clear();
                localStorage.clear();
                window.location.href = "/";
              }}
            >
              Logout and back to Homepage
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
