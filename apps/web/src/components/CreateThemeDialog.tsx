import { useState } from "react";
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
import { useCreateTheme } from "@/hooks/use-themes-api";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";

interface CreateThemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateThemeDialog({
  open,
  onOpenChange,
}: CreateThemeDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createTheme = useCreateTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim()) {
      return;
    }

    await createTheme.mutateAsync({
      name: name.trim(),
      description: description.trim(),
    });

    // Reset form
    setName("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Theme</DialogTitle>
          <DialogDescription>
            Add a new investment theme with markdown description
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
            <Label htmlFor="description">Description (Markdown)</Label>
            <SimpleMDE
              value={description}
              onChange={setDescription}
              options={{
                spellChecker: false,
                placeholder: "Write your description in markdown...",
                minHeight: "300px",
                maxHeight: "400px",
                toolbar: [
                  "bold",
                  "italic",
                  "heading",
                  "|",
                  "quote",
                  "unordered-list",
                  "ordered-list",
                  "|",
                  "link",
                  "image",
                  "|",
                  "preview",
                  "side-by-side",
                  "fullscreen",
                  "|",
                  "guide",
                ],
              }}
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
            <Button type="submit" disabled={createTheme.isPending}>
              {createTheme.isPending ? "Creating..." : "Create Theme"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
