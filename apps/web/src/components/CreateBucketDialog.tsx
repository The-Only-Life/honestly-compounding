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
import { useCreateBucket } from "@/hooks/use-buckets-api";
import { RichTextEditor } from "@/components/RichTextEditor";

interface CreateBucketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBucketDialog({
  open,
  onOpenChange,
}: CreateBucketDialogProps) {
  const [name, setName] = useState("");
  const [riskMeasure, setRiskMeasure] = useState("");
  const [description, setDescription] = useState("");
  const createBucket = useCreateBucket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim() || !riskMeasure.trim()) {
      return;
    }

    await createBucket.mutateAsync({
      name: name.trim(),
      description: description.trim(),
      riskMeasure: riskMeasure.trim(),
    });

    // Reset form
    setName("");
    setDescription("");
    setRiskMeasure("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Bucket</DialogTitle>
          <DialogDescription>
            Add a new bucket with markdown description
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter bucket name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="riskMeasure">Risk Measure</Label>
            <Input
              id="riskMeasure"
              value={riskMeasure}
              onChange={(e) => setRiskMeasure(e.target.value)}
              placeholder="e.g., Low, Medium, High"
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
            <Button type="submit" disabled={createBucket.isPending}>
              {createBucket.isPending ? "Creating..." : "Create Bucket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
