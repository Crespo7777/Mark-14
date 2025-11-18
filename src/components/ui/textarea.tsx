import * as React from "react";
import { cn, cleanPastedText } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onChange, ...props }, ref) => {
    
    const handlePaste = (
      event: React.ClipboardEvent<HTMLTextAreaElement>,
    ) => {
      const pastedText = event.clipboardData.getData("text/plain");
      const cleanedText = cleanPastedText(pastedText);

      if (onChange) {
        event.preventDefault();
        
        const target = event.target as HTMLTextAreaElement;
        const start = target.selectionStart || 0;
        const end = target.selectionEnd || 0;
        const currentValue = target.value || "";

        const newValue =
          currentValue.substring(0, start) +
          cleanedText +
          currentValue.substring(end);

        const syntheticEvent = {
          ...event,
          target: { ...target, value: newValue },
        } as React.ChangeEvent<HTMLTextAreaElement>;

        onChange(syntheticEvent);
        
        requestAnimationFrame(() => {
          target.selectionStart = start + cleanedText.length;
          target.selectionEnd = start + cleanedText.length;
        });

      }
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        onChange={onChange}
        onPaste={handlePaste}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };