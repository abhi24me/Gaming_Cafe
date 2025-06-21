
'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Megaphone, Mail, Send, Loader2, AlertTriangle } from 'lucide-react';
import apiClient, { ApiError } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

export default function PromotionsPage() {
  useAdminAuth(); // Ensures auth context is available and redirects if not authenticated
  const router = useRouter();
  const { toast } = useToast();
  
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast({
        title: "Incomplete Form",
        description: "Please provide both a subject and a body for the email.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await apiClient<{ message: string }>('/admin/send-promo-email', {
        method: 'POST',
        body: JSON.stringify({ subject, htmlBody: body }),
      });
      toast({
        title: "Email Sent Successfully!",
        description: response.message,
        className: 'bg-green-600 text-white border-green-700',
      });
      setSubject('');
      setBody('');
    } catch (error) {
      console.error("Failed to send promotional email:", error);
      const apiErrorMsg = error instanceof ApiError ? error.message : "Could not send promotional email.";
      toast({
        title: "Sending Failed",
        description: apiErrorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center pt-2">
        <h1 className="text-3xl font-bold text-primary mb-1">
          Send Promotional Email
        </h1>
        <p className="text-muted-foreground">
          Craft and send a promotional offer to all registered users.
        </p>
      </div>

      <Card className="w-full max-w-3xl mx-auto shadow-lg border-border bg-card">
        <CardHeader className="p-5 border-b">
          <div className="flex items-center">
            <Megaphone className="h-7 w-7 text-primary mr-3" />
            <CardTitle className="text-xl text-primary-foreground">Email Composer</CardTitle>
          </div>
          <CardDescription className="pt-1">
            The email will be sent to all users with a registered email address. Use basic HTML for formatting.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-foreground font-medium">Email Subject</Label>
              <Input
                id="subject"
                type="text"
                placeholder="e.g., Weekend Gaming Bonanza! 50% Off!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="bg-background/70"
                disabled={isSending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body" className="text-foreground font-medium">Email Body (HTML supported)</Label>
              <Textarea
                id="body"
                placeholder="e.g., <p>Hi Gamers!</p><p>This weekend, enjoy <b>50% off</b> on all bookings.</p>"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                className="bg-background/70 min-h-[250px] font-mono text-sm"
                disabled={isSending}
              />
            </div>
          </CardContent>
          <CardContent className="p-5 pt-0">
             <div className="flex items-start p-3 rounded-md bg-accent/10 border border-accent/20">
                <Mail className="h-5 w-5 text-accent mr-3 mt-1"/>
                <div className="text-xs text-accent-foreground/80 w-full">
                    <p className="font-semibold text-foreground">Live Preview:</p>
                    <div className="mt-2 p-4 rounded-md bg-background/50 border max-h-60 overflow-y-auto w-full">
                        {body ? (
                            <div dangerouslySetInnerHTML={{ __html: body }} />
                        ) : (
                            <p className="text-muted-foreground italic">Your email body will be previewed here...</p>
                        )}
                    </div>
                </div>
             </div>
          </CardContent>
          <CardFooter className="p-5 border-t">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3" disabled={isSending || !subject || !body}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending to All Users...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Send Promotional Email
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
