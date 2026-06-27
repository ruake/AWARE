import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "@/hooks/use-theme";
import { Save, Github, Moon, Sun, Monitor, AlertCircle } from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [gateThreshold, setGateThreshold] = useState([95]);
  const [githubUrl, setGithubUrl] = useState("https://github.com/akamai/aware-mock-data");

  const saveSettings = () => {
    localStorage.setItem("aware-settings-v1", JSON.stringify({ gateThreshold: gateThreshold[0] }));
    localStorage.setItem("aware-github-repo", githubUrl);
    // show toast
  };

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage configuration for A.W.A.R.E. dashboard and data sources.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Github className="w-5 h-5"/> GitHub Data Source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Repository URL</Label>
            <Input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} />
            <p className="text-xs text-muted-foreground">URL containing the JSON test results artifacts.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><AlertCircle className="w-5 h-5"/> Promotion Gate Config</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>UAT Pass Rate Threshold</Label>
              <span className="font-mono bg-muted px-2 py-1 rounded text-sm">{gateThreshold[0]}%</span>
            </div>
            <Slider 
              min={50} max={100} step={1} 
              value={gateThreshold} onValueChange={setGateThreshold} 
            />
            <p className="text-xs text-muted-foreground">If the UAT pass rate falls below this threshold, the PROD promotion gate will be BLOCKED.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Monitor className="w-5 h-5"/> Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant={theme === "light" ? "default" : "outline"} className="flex-1 gap-2" onClick={() => setTheme("light")}>
              <Sun className="w-4 h-4"/> Light
            </Button>
            <Button variant={theme === "dark" ? "default" : "outline"} className="flex-1 gap-2" onClick={() => setTheme("dark")}>
              <Moon className="w-4 h-4"/> Dark
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} className="gap-2 px-8">
          <Save className="w-4 h-4" /> Save Configuration
        </Button>
      </div>
    </div>
  );
}
