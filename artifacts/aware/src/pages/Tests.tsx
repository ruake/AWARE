import { useState } from "react";
import { useStore } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, FileCode2, User, Tag, Github } from "lucide-react";
import { TestCase } from "@/lib/types";
import { format } from "date-fns";

export default function Tests() {
  const testCases = useStore(state => state.testCases);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);

  const filteredTests = testCases
    .filter(tc => typeFilter === "ALL" || tc.testType === typeFilter)
    .filter(tc => search === "" || tc.name.toLowerCase().includes(search.toLowerCase()) || tc.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileCode2 className="w-6 h-6"/> Test Case Browser</h1>
      </div>

      <div className="flex gap-4 items-center bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search test name or ID..." 
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["ALL", "playwright", "pytest", "http"] as const).map(t => (
            <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(t)}>
              {t.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Test ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTests.map(tc => (
              <TableRow key={tc.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedTest(tc)}>
                <TableCell className="font-medium text-xs font-mono text-muted-foreground">{tc.id}</TableCell>
                <TableCell className="font-medium">{tc.name}</TableCell>
                <TableCell>{tc.category}</TableCell>
                <TableCell><Badge variant="secondary">{tc.testType}</Badge></TableCell>
                <TableCell>
                  <Badge variant="outline" className={
                    tc.priority === 'P0' ? "border-destructive text-destructive" :
                    tc.priority === 'P1' ? "border-orange-500 text-orange-500" : ""
                  }>{tc.priority}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground flex items-center gap-2"><User className="w-3 h-3"/> {tc.owner}</TableCell>
              </TableRow>
            ))}
            {filteredTests.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center p-8 text-muted-foreground">No tests found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedTest} onOpenChange={(open) => !open && setSelectedTest(null)}>
        <DialogContent className="max-w-2xl bg-card border-border text-foreground">
          {selectedTest && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-3">
                  <span className="font-mono text-sm px-2 py-1 bg-muted rounded text-muted-foreground">{selectedTest.id}</span>
                  {selectedTest.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <p className="text-sm text-muted-foreground">{selectedTest.description}</p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Type</span>
                    <p className="font-medium"><Badge variant="secondary">{selectedTest.testType}</Badge></p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Priority</span>
                    <p className="font-medium"><Badge variant="outline">{selectedTest.priority}</Badge></p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Owner</span>
                    <p className="font-medium flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground"/> {selectedTest.owner}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2"><FileCode2 className="w-4 h-4"/> Script Path</span>
                  <div className="bg-muted p-2 rounded-md font-mono text-sm flex items-center justify-between border border-border">
                    {selectedTest.scriptPath}
                    <Button variant="ghost" size="icon" className="h-6 w-6"><Github className="w-4 h-4" /></Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2"><Tag className="w-4 h-4"/> Tags</span>
                  <div className="flex gap-2">
                    {selectedTest.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <span className="text-xs text-muted-foreground">Last updated: {format(new Date(selectedTest.updatedAt), "MMM dd, yyyy")}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
