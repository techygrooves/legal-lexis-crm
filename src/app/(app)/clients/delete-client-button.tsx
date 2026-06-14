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
import { deleteClient } from "./actions";

export function DeleteClientButton({
  clientId,
  clientName,
  variant = "icon",
  redirectTo,
}: {
  clientId: string;
  clientName: string;
  variant?: "icon" | "labeled";
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteClient(clientId);
    if (result.error) {
      toast.error("Could not delete client", { description: result.error });
      setDeleting(false);
      return;
    }
    toast.success("Client deleted");
    setOpen(false);
    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "labeled" ? (
          <Button variant="destructive" size="sm">
            <Trash2 data-icon="inline-start" />
            Delete
          </Button>
        ) : (
          <Button variant="ghost" size="icon-sm">
            <Trash2 />
            <span className="sr-only">Delete client</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this client?</DialogTitle>
          <DialogDescription>
            This permanently deletes &ldquo;{clientName}&rdquo;. Any cases for
            this client are kept but become unassigned (no client). This cannot
            be undone.
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
            Delete Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
