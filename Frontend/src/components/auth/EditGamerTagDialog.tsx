
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Edit3 } from 'lucide-react';

interface EditGamerTagDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function EditGamerTagDialog({ isOpen, onOpenChange }: EditGamerTagDialogProps) {
  const { gamerTag, updateGamerTag } = useAuth();
  const [newGamerTag, setNewGamerTag] = useState(gamerTag || '');

  useEffect(() => {
    if (isOpen && gamerTag) {
      setNewGamerTag(gamerTag);
    }
  }, [isOpen, gamerTag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGamerTag.trim()) {
      updateGamerTag(newGamerTag.trim());
      onOpenChange(false); // Close dialog on successful update
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-glow-primary p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center space-x-2 mb-1 sm:mb-2">
            <Edit3 className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            <DialogTitle className="text-primary text-xl sm:text-2xl">Edit Gamer Tag</DialogTitle>
          </div>
          <DialogDescription className="text-foreground/80 pt-1 sm:pt-2 text-xs sm:text-sm">
            Enter your new Gamer Tag below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="py-2 sm:py-4">
            <Label htmlFor="newGamerTag" className="text-foreground/90 text-xs sm:text-sm">
              New Gamer Tag
            </Label>
            <Input
              id="newGamerTag"
              type="text"
              value={newGamerTag}
              onChange={(e) => setNewGamerTag(e.target.value)}
              placeholder="e.g., EliteGamer42"
              className="mt-1 bg-card border-primary focus:ring-primary text-base"
              required
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <DialogClose asChild>
              <Button variant="outline" className="border-muted hover:border-primary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 h-auto">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="btn-gradient-primary-accent text-primary-foreground btn-glow-primary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 h-auto">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
