"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteCase } from "./actions";

export function DeleteCaseButton({
  caseId,
  caseTitle,
}: {
  caseId: string;
  caseTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteCase(caseId);
    if (result.error) {
      toast.error("Could not delete case", { description: result.error });
      setDeleting(false);
      return;
    }
    toast.success("Case deleted");
    setOpen(false);
    router.push("/cases");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 data-icon="inline-start" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this case?</DialogTitle>
          <DialogDescription>
            This permanently deletes &ldquo;{caseTitle}&rdquo; along with its
            events, tasks, notes, contacts, and documents. The client record is
            kept. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={deleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting && (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            )}
            Delete Case
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
