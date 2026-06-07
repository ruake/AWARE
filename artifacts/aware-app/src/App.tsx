import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Runs from "@/pages/Runs";
import RunDetail from "@/pages/RunDetail";
import Compare from "@/pages/Compare";
import TestManager from "@/pages/TestManager";
import TestSuiteManager from "@/pages/TestSuiteManager";
import TestAnalytics from "@/pages/TestAnalytics";
import TestDoc from "@/pages/TestDoc";
import SearchDemo from "@/pages/SearchDemo";
import StartRun from "@/pages/StartRun";
import Sharing from "@/pages/Sharing";
import Status from "@/pages/Status";
import About from "@/pages/About";
import Copilot from "@/pages/Copilot";
import Desktop from "@/pages/Desktop";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/start" component={StartRun} />
      <Route path="/runs" component={Runs} />
      <Route path="/runs/:runId" component={RunDetail} />
      <Route path="/compare" component={Compare} />
      <Route path="/analytics" component={TestAnalytics} />
      <Route path="/tests" component={TestManager} />
      <Route path="/suites" component={TestSuiteManager} />
      <Route path="/copilot" component={Copilot} />
      <Route path="/desktop" component={Desktop} />
      <Route path="/ci-pipeline" component={Status} />
      <Route path="/about" component={About} />
      <Route path="/testdoc" component={TestDoc} />
      <Route path="/search" component={SearchDemo} />
      <Route path="/share" component={Sharing} />
      <Route path="/status" component={Status} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
