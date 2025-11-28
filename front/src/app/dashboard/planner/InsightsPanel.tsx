"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { toast } from "sonner";

interface InsightsPanelProps {
  insights: string;
  onSave: (text: string) => Promise<{ success: boolean; error?: string }>;
  isSaving: boolean;
}

export function InsightsPanel({ insights, onSave, isSaving }: InsightsPanelProps) {
  const [localInsights, setLocalInsights] = useState(insights);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state when remote insights change
  useEffect(() => {
    setLocalInsights(insights);
    setHasChanges(false);
  }, [insights]);

  const handleChange = (value: string) => {
    setLocalInsights(value);
    setHasChanges(value !== insights);
  };

  const handleSave = async () => {
    const result = await onSave(localInsights);
    if (result.success) {
      toast.success(t("weeklyPlanner.insights.saved"));
      setHasChanges(false);
    } else {
      toast.error(result.error || t("weeklyPlanner.insights.error"));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {t("weeklyPlanner.insights.title")}
          </CardTitle>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {t("common.save")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={localInsights}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={t("weeklyPlanner.insights.placeholder")}
          rows={4}
          className="resize-none"
        />
      </CardContent>
    </Card>
  );
}
