import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  description?: string;
  className?: string;
}

export function SidePanel({
  open,
  onClose,
  title,
  children,
  description,
  className,
}: SidePanelProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className={`w-full sm:w-[700px] md:w-[900px] lg:w-[1100px] ${className || ''}`}>
        <SheetHeader className="pb-4">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="h-[calc(100vh-120px)] overflow-y-auto">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
