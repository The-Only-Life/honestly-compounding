import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateTheme, useUpdateTheme } from "@/hooks/use-themes-api";
import { RichTextEditor } from "@/components/RichTextEditor";
import type { Theme } from "@/lib/api-client";

interface CreateThemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme?: Theme | null;
}

export function CreateThemeDialog({
  open,
  onOpenChange,
  theme,
}: Readonly<CreateThemeDialogProps>) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createTheme = useCreateTheme();
  const updateTheme = useUpdateTheme();

  const isEditMode = !!theme;

  // Populate form when editing
  useEffect(() => {
    if (theme) {
      setName(theme.name);
      setDescription(theme.description);
    } else {
      setName("");
      setDescription("");
    }
  }, [theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim()) {
      return;
    }

    if (isEditMode && theme) {
      await updateTheme.mutateAsync({
        id: theme.id,
        data: {
          name: name.trim(),
          description: description.trim(),
        },
      });
    } else {
      await createTheme.mutateAsync({
        name: name.trim(),
        description: description.trim(),
      });
    }

    // Reset form
    setName("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Theme" : "Create New Theme"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the theme details"
              : "Add a new investment theme with markdown description"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter theme name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Write your description..."
              minHeight="300px"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTheme.isPending || updateTheme.isPending}
            >
              {isEditMode
                ? updateTheme.isPending
                  ? "Updating..."
                  : "Update Theme"
                : createTheme.isPending
                ? "Creating..."
                : "Create Theme"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
