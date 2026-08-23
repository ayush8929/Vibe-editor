"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowDown, Loader2 } from "lucide-react";
import Image from "next/image";
import { createPlaygroundFromRepo } from "@/modules/dashboard/actions";

const AddRepo = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImport = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repo URL");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const importRes = await fetch("/api/github-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });
      const importData = await importRes.json();

      if (!importRes.ok) {
        setError(importData.error || "Failed to fetch repo");
        setLoading(false);
        return;
      }

      const result = await createPlaygroundFromRepo({
        title: importData.repoName,
        templateJson: importData.templateJson,
      });

      setLoading(false);

      if (result.success && result.playground) {
        setOpen(false);
        router.push(`/playground/${result.playground.id}`);
      } else {
        setError(result.error || "Something went wrong");
      }
    } catch {
      setLoading(false);
      setError("Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div
          className="group px-6 py-6 flex flex-row justify-between items-center border rounded-lg bg-muted cursor-pointer 
          transition-all duration-300 ease-in-out
          hover:bg-background hover:border-[#E93F3F] hover:scale-[1.02]
          shadow-[0_2px_10px_rgba(0,0,0,0.08)]
          hover:shadow-[0_10px_30px_rgba(233,63,63,0.15)]"
        >
          <div className="flex flex-row justify-center items-start gap-4">
            <Button
              variant={"outline"}
              className="flex justify-center items-center bg-white group-hover:bg-[#fff8f8] group-hover:border-[#E93F3F] group-hover:text-[#E93F3F] transition-colors duration-300"
              size={"icon"}
            >
              <ArrowDown
                size={30}
                className="transition-transform duration-300 group-hover:translate-y-1"
              />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-[#e93f3f]">
                Open Github Repository
              </h1>
              <p className="text-sm text-muted-foreground max-w-[220px]">
                Work with your repositories in our editor
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden">
            <Image
              src={"/github.svg"}
              alt="Open GitHub repository"
              width={150}
              height={150}
              className="transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        </div>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from GitHub</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <Input
            placeholder="https://github.com/owner/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={loading}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <p className="text-xs text-muted-foreground">
            Public repositories only for now.
          </p>
          <Button onClick={handleImport} disabled={loading} className="mt-2">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
              </>
            ) : (
              "Import Repository"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddRepo;
