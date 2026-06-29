import { Chart } from "react-google-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig } from "@/lib/agentgraph/types";

interface ChartMessageProps {
  config: ChartConfig;
}

function ChartMessage({ config }: ChartMessageProps) {
  const options = {
    ...config.options,
    theme: "material",
  };

  return (
    <Card className="w-full overflow-hidden border-border/60">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="w-full" style={{ minHeight: config.chartType === "Table" ? "auto" : 260 }}>
          <Chart
            chartType={config.chartType}
            data={config.data}
            options={options}
            width="100%"
            height={config.chartType === "Table" ? undefined : 280}
            chartLanguage="en"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default ChartMessage;
