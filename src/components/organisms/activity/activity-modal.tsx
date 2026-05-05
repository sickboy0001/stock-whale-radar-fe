"use client";

import { History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ActivityPage } from "@/components/pages/activity/ActivityPage";
import { ScrollArea } from "@/components/ui/scroll-area";

export const ActivityModal = () => {
  return (
    <Dialog>
      <DialogTrigger
        className="text-zinc-400 hover:text-blue-500 transition-colors inline-flex items-center justify-center"
        title="アクティビティを表示"
      >
        <History className="w-5 h-5" />
      </DialogTrigger>

      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-6 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <History size={20} />
            アクティビティ
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="pb-10">
            <ActivityPage />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
