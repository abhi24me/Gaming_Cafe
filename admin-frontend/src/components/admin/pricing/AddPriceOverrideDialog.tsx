
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox'; 
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiClient, { ApiError } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSignIcon, Clock } from 'lucide-react';

const DAYS_OF_WEEK_OPTIONS = [
  { id: 0, label: 'Sunday' },
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
];

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // Validates HH:MM format

// Schema for form input (IST times)
const priceOverrideFormSchema = z.object({
  daysOfWeek: z.array(z.number()).min(1, { message: 'At least one day must be selected.' }),
  startTimeIST: z.string().regex(timeRegex, { message: 'Start time must be in HH:MM IST format (e.g., 09:30).' }),
  endTimeIST: z.string().regex(timeRegex, { message: 'End time must be in HH:MM IST format (e.g., 17:00).' }),
  price: z.coerce.number().min(0, { message: 'Price must be a non-negative number.' }),
}).refine(data => {
    // Validate that end time is after start time (for the same day logic)
    const start = parseInt(data.startTimeIST.replace(':', ''), 10);
    const end = parseInt(data.endTimeIST.replace(':', ''), 10);
    return end > start;
}, {
    message: "End time (IST) must be after start time (IST).",
    path: ["endTimeIST"],
});

type PriceOverrideFormData = z.infer<typeof priceOverrideFormSchema>;

// Helper function to convert IST "HH:MM" to UTC "HH:MM"
function convertIstHHMMtoUtcHHMM(istHHMM: string): string {
  if (!istHHMM.match(timeRegex)) {
    console.error("Invalid IST time format for conversion:", istHHMM);
    throw new Error("Invalid IST time format provided for conversion.");
  }
  
  const [hours, minutes] = istHHMM.split(':').map(Number);

  // Create a reference date (e.g., today) and set the time as IST.
  // Then get the UTC equivalent.
  // For simplicity, we'll use a known date.
  const referenceDate = new Date(); // Use current date, but only for date parts
  
  // Construct a string that JavaScript's Date parser will interpret in 'Asia/Kolkata'
  // This requires knowing the current year, month, day from a reliable source,
  // or using a library for robust timezone conversions.
  // A common trick: create a date string in ISO format with the IST offset +05:30
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(referenceDate.getDate()).padStart(2, '0');
  
  const dateStringInIST = `${year}-${month}-${day}T${istHHMM}:00.000+05:30`;
  
  try {
    const dateObj = new Date(dateStringInIST);
    if (isNaN(dateObj.getTime())) {
        throw new Error("Could not parse IST date string reliably.");
    }
    const utcHours = String(dateObj.getUTCHours()).padStart(2, '0');
    const utcMinutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
    return `${utcHours}:${utcMinutes}`;
  } catch (e) {
      console.error("Error converting IST to UTC:", e, { istHHMM, dateStringInIST });
      // Fallback or re-throw, depending on desired strictness
      throw new Error("Failed to convert IST time to UTC. Ensure valid time and system date settings.");
  }
}


interface AddPriceOverrideDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  screenId: string | null;
  screenName?: string;
  onOverrideAdded: () => void;
}

export default function AddPriceOverrideDialog({
  isOpen,
  onOpenChange,
  screenId,
  screenName,
  onOverrideAdded,
}: AddPriceOverrideDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<PriceOverrideFormData>({
    resolver: zodResolver(priceOverrideFormSchema),
    defaultValues: {
      daysOfWeek: [],
      startTimeIST: '',
      endTimeIST: '',
      price: 0,
    },
  });

  const onSubmit = async (data: PriceOverrideFormData) => {
    if (!screenId) {
      toast({ title: 'Error', description: 'Screen ID is missing.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        daysOfWeek: data.daysOfWeek,
        startTimeUTC: convertIstHHMMtoUtcHHMM(data.startTimeIST),
        endTimeUTC: convertIstHHMMtoUtcHHMM(data.endTimeIST),
        price: data.price,
      };

      await apiClient(`/admin/screens/${screenId}/overrides`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast({
        title: 'Success!',
        description: `Price override added for ${screenName || 'screen'}. Times stored as UTC.`,
        className: 'bg-green-600 text-white border-green-700',
      });
      reset();
      onOpenChange(false);
      onOverrideAdded();
    } catch (error) {
      console.error("Error during override submission:", error);
      toast({
        title: 'Failed to Add Override',
        description: error instanceof ApiError ? error.message : (error as Error).message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => {
      if (!isSubmitting) {
        onOpenChange(openState);
        if (!openState) reset();
      }
    }}>
      <DialogContent className="sm:max-w-md bg-card p-4 md:p-6">
        <DialogHeader className="pb-2 md:pb-3">
          <DialogTitle className="text-lg md:text-xl text-primary flex items-center">
            <DollarSignIcon className="mr-2 h-5 w-5"/> Add Price Override
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            For screen: <span className="font-semibold text-primary-foreground">{screenName || 'N/A'}</span>.
            Enter times in IST (Asia/Kolkata).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:space-y-4 py-2">
          <div>
            <Label className="text-xs md:text-sm font-medium text-foreground">Days of the Week</Label>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5 p-2 md:p-3 border rounded-md bg-background/50">
              {DAYS_OF_WEEK_OPTIONS.map((day) => (
                <Controller
                  key={day.id}
                  name="daysOfWeek"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-1.5">
                      <Checkbox
                        id={`day-${day.id}`}
                        checked={field.value?.includes(day.id)}
                        onCheckedChange={(checked) => {
                          const newValue = checked
                            ? [...(field.value || []), day.id]
                            : (field.value || []).filter((id) => id !== day.id);
                          field.onChange(newValue.sort((a,b) => a-b));
                        }}
                        className="h-3.5 w-3.5 md:h-4 md:w-4"
                      />
                      <Label htmlFor={`day-${day.id}`} className="text-xs md:text-sm font-normal text-muted-foreground cursor-pointer">
                        {day.label}
                      </Label>
                    </div>
                  )}
                />
              ))}
            </div>
            {errors.daysOfWeek && <p className="text-xs text-destructive mt-1">{errors.daysOfWeek.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <Label htmlFor="startTimeIST" className="text-xs md:text-sm font-medium text-foreground">Start Time (IST)</Label>
              <div className="relative mt-1">
                <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground"/>
                <Input
                  id="startTimeIST"
                  type="time"
                  {...register('startTimeIST')}
                  className={`pl-7 md:pl-8 text-xs md:text-sm h-9 md:h-10 bg-background/70 ${errors.startTimeIST ? 'border-destructive' : 'border-input'}`}
                  placeholder="HH:MM"
                />
              </div>
              {errors.startTimeIST && <p className="text-xs text-destructive mt-1">{errors.startTimeIST.message}</p>}
            </div>
            <div>
              <Label htmlFor="endTimeIST" className="text-xs md:text-sm font-medium text-foreground">End Time (IST)</Label>
               <div className="relative mt-1">
                <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground"/>
                <Input
                  id="endTimeIST"
                  type="time"
                  {...register('endTimeIST')}
                  className={`pl-7 md:pl-8 text-xs md:text-sm h-9 md:h-10 bg-background/70 ${errors.endTimeIST ? 'border-destructive' : 'border-input'}`}
                  placeholder="HH:MM"
                />
              </div>
              {errors.endTimeIST && <p className="text-xs text-destructive mt-1">{errors.endTimeIST.message}</p>}
            </div>
          </div>
          
          <div>
            <Label htmlFor="price" className="text-xs md:text-sm font-medium text-foreground">Price (₹)</Label>
             <div className="relative mt-1">
                <DollarSignIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground"/>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register('price')}
                  className={`pl-7 md:pl-8 text-xs md:text-sm h-9 md:h-10 bg-background/70 ${errors.price ? 'border-destructive' : 'border-input'}`}
                  placeholder="e.g., 120.50"
                />
            </div>
            {errors.price && <p className="text-xs text-destructive mt-1">{errors.price.message}</p>}
          </div>

          <DialogFooter className="pt-3 md:pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting} size="sm" className="text-xs md:text-sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90" size="sm">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add Override
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
