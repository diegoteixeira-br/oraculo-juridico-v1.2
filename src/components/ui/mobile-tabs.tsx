import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const MobileTabs = TabsPrimitive.Root;

const MobileTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        isMobile && [
          "w-full",
          "h-12", // Increased height for mobile
          "sticky top-0 z-10", // Sticky on mobile
          "bg-slate-800/95 backdrop-blur-sm border-b border-slate-600",
        ],
        className
      )}
      {...props}
    />
  );
});
MobileTabsList.displayName = TabsPrimitive.List.displayName;

const MobileTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        isMobile && [
          "flex-1", // Full width distribution on mobile
          "min-h-[44px]", // Touch target size
          "text-xs font-medium", // Adjust text size
          "data-[state=active]:bg-primary/10 data-[state=active]:text-primary",
          "active:scale-95 transition-transform duration-150", // Touch feedback
        ],
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 text-center">
        {children}
      </div>
    </TabsPrimitive.Trigger>
  );
});
MobileTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const MobileTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isMobile && [
          "px-2", // Reduce padding on mobile
          "pb-20", // Extra bottom padding for mobile navigation
        ],
        className
      )}
      {...props}
    />
  );
});
MobileTabsContent.displayName = TabsPrimitive.Content.displayName;

export { MobileTabs, MobileTabsList, MobileTabsTrigger, MobileTabsContent };