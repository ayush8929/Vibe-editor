"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  defaultPreferences,
  getPreferences,
  setPreferences,
  type EditorPreferences,
} from "../lib/preferences";

const EditorPreferencesForm = () => {
  const [prefs, setPrefsState] =
    useState<EditorPreferences>(defaultPreferences);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPrefsState(getPreferences());
    setMounted(true);
  }, []);

  const update = (partial: Partial<EditorPreferences>) => {
    const next = setPreferences(partial);
    if (next) setPrefsState(next);
  };

  if (!mounted) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editor &amp; AI</CardTitle>
        <CardDescription>
          These apply the next time you open a playground on this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="ai-toggle">AI inline code suggestions</Label>
            <p className="text-xs text-muted-foreground">
              Show AI-generated inline completions while you type.
            </p>
          </div>
          <Switch
            id="ai-toggle"
            checked={prefs.aiSuggestionsEnabled}
            onCheckedChange={(checked) => {
              update({ aiSuggestionsEnabled: checked });
              toast.success(
                checked ? "AI suggestions enabled" : "AI suggestions disabled",
              );
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="wordwrap-toggle">Word wrap</Label>
          <Switch
            id="wordwrap-toggle"
            checked={prefs.wordWrap}
            onCheckedChange={(checked) => update({ wordWrap: checked })}
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label>Font size</Label>
            <span className="text-sm text-muted-foreground">
              {prefs.fontSize}px
            </span>
          </div>
          <Slider
            min={10}
            max={24}
            step={1}
            value={[prefs.fontSize]}
            onValueChange={([value]) => update({ fontSize: value })}
          />
        </div>

        <div className="grid gap-2 max-w-[200px]">
          <Label>Tab size</Label>
          <Select
            value={String(prefs.tabSize)}
            onValueChange={(value) => update({ tabSize: Number(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 spaces</SelectItem>
              <SelectItem value="4">4 spaces</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default EditorPreferencesForm;
