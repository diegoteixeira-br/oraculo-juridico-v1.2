import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileTouchButtonProps extends ButtonProps {
  touchOptimized?: boolean;
}

const MobileTouchButton = React.forwardRef<
  HTMLButtonElement,
  MobileTouchButtonProps
>(({ className, touchOptimized = true, children, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <Button
      className={cn(
        isMobile && touchOptimized && [
          "min-h-[44px]", // iOS/Android touch target minimum
          "min-w-[44px]",
          "text-base", // Larger text on mobile
          "px-6 py-3", // Better padding for touch
          "active:scale-95 transition-transform duration-150", // Touch feedback
        ],
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </Button>
  );
});

MobileTouchButton.displayName = "MobileTouchButton";

export { MobileTouchButton };