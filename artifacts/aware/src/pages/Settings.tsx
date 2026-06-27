import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/use-theme";
import {
  Save, Github, Moon, Sun, AlertCircle, CheckCircle2,
  RotateCcw, Link2, RefreshCw, Loader2,
} from "lucide-react";

const DEFAULTS = {
  githubUrl:     "",
  gateThreshold: 95,
};

function parseSettings() {
  try {
    const raw = localStorage.getItem("aware-settings-v1");
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const loadData = useStore(state => state.loadData);

  const initial = parseSettings();
  const [githubUrl,     setGithubUrl]     = useState(initial.githubUrl || localStorage.getItem("aware-github-repo") || "");
  const [gateThreshold, setGateThreshold] = useState([initial.gateThreshold]);
  const [saved,         setSaved]         = useState(false);
  const [urlError,      setUrlError]      = useState("");
  const [testing,       setTesting]       = useState(false);
  const [testResult,    setTestResult]    = useState<"ok" | "fail" | null>(null);
  const [reloading,     setReloading]     = useState(false);

  // Persist threshold live so PropertyStatusBar stays in sync
  useEffect(() => {
    localStorage.setItem(
      "aware-settings-v1",
      JSON.stringify({ gateThreshold: gateThreshold[0], githubUrl }),
    );
  }, [gateThreshold, githubUrl]);

  function validateUrl(url: string): string {
    if (!url) return "";
    try {
      const u = new URL(url);
      if (!["https:", "http:"].includes(u.protocol)) return "URL must use https:// or http://";
      if (!url.includes("github.com") && !url.includes("raw.githubusercontent.com"))
        return "URL should point to a GitHub repository or raw content";
      return "";
    } catch {
      return "Invalid URL format";
    }
  }

  function handleUrlChange(v: string) {
    setGithubUrl(v);
    setUrlError(validateUrl(v));
    setTestResult(null);
  }

  async function testConnection() {
    const err = validateUrl(githubUrl);
    if (err) { setUrlError(err); return; }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(githubUrl, { method: "HEAD", signal: AbortSignal.timeout(5000) });
      setTestResult(res.ok ? "ok" : "fail");
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
    }
  }

  function saveSettings() {
    const err = validateUrl(githubUrl);
    if (err) { setUrlError(err); return; }
    localStorage.setItem("aware-settings-v1", JSON.stringify({ gateThreshold: gateThreshold[0], githubUrl }));
    localStorage.setItem("aware-github-repo", githubUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function resetDefaults() {
    setGithubUrl("");
    setGateThreshold([95]);
    setUrlError("");
    setTestResult(null);
  }

  async function handleReload() {
    setReloading(true);
    await loadData();
    setReloading(false);
  }

  return (
    <div className="max-w-3xl space-y-8 pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure data sources, promotion gates, and appearance.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={resetDefaults}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
        </Button>
      </div>

      {/* GitHub Data Source */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Github className="w-4 h-4" /> GitHub Data Source
          </CardTitle>
          <CardDescription>
            Point to a GitHub repository or raw JSON URL containing test result artifacts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="github-url">Repository URL</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="github-url"
                  value={githubUrl}
                  onChange={e => handleUrlChange(e.target.value)}
                  placeholder="https://github.com/org/repo or https://raw.githubusercontent.com/..."
                  className={urlError ? "border-destructive" : ""}
                />
                {urlError && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {urlError}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                disabled={!githubUrl || !!urlError || testing}
                className="gap-2 shrink-0"
              >
                {testing
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Link2 className="w-4 h-4" />
                }
                {testing ? "Testing…" : "Test"}
              </Button>
            </div>
            {testResult === "ok" && (
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Connection successful
              </p>
            )}
            {testResult === "fail" && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Connection failed — check URL and permissions
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleReload}
              disabled={reloading}
            >
              {reloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {reloading ? "Reloading…" : "Reload Data"}
            </Button>
            <p className="text-xs text-muted-foreground">Reload test results from the current source</p>
          </div>
        </CardContent>
      </Card>

      {/* Promotion Gate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="w-4 h-4" /> Promotion Gate
          </CardTitle>
          <CardDescription>
            Controls when the PROD promotion gate is BLOCKED based on UAT pass rate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>UAT Pass Rate Threshold</Label>
            <span className="font-mono bg-muted px-2 py-1 rounded text-sm font-semibold">
              {gateThreshold[0]}%
            </span>
          </div>
          <Slider
            min={50} max={100} step={1}
            value={gateThreshold}
            onValueChange={setGateThreshold}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>50% (lenient)</span>
            <span>100% (strict)</span>
          </div>
          <div className={`flex items-center gap-2 p-3 rounded-md border text-sm
            ${gateThreshold[0] >= 95 ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400" : "border-amber-500/30 bg-amber-500/5 text-amber-600"}`}>
            {gateThreshold[0] >= 95 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {gateThreshold[0] >= 95
              ? `Gate OPEN when UAT ≥ ${gateThreshold[0]}%`
              : `Gate threshold is below recommended 95% — consider increasing`}
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Choose the dashboard colour scheme.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {(["light", "dark"] as const).map(t => (
              <Button
                key={t}
                variant={theme === t ? "default" : "outline"}
                className={`flex-1 gap-2 ${theme === t ? "" : ""}`}
                onClick={() => setTheme(t)}
              >
                {t === "light" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {theme === t && (
                  <Badge variant="secondary" className="ml-1 text-[10px] py-0">active</Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save / feedback */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm text-emerald-500 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" /> Settings saved
          </span>
        )}
        <Button onClick={saveSettings} className="gap-2 px-8" disabled={!!urlError}>
          <Save className="w-4 h-4" /> Save Configuration
        </Button>
      </div>
    </div>
  );
}
