import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  FileText,
  Users,
  DollarSign,
} from "lucide-react";

// サマリー指標のダミーデータ
const summaryStats = [
  {
    title: "本日の提出件数",
    value: "24 件",
    change: "+12%",
    icon: FileText,
    trend: "up",
  },
  {
    title: "新規クジラ数",
    value: "5 名",
    change: "+2",
    icon: Users,
    trend: "up",
  },
  {
    title: "平均保有割合",
    value: "6.8%",
    change: "-0.3%",
    icon: DollarSign,
    trend: "down",
  },
];

// タイムラインデータのダミーデータ
const timelineItems = [
  {
    id: 1,
    fundName: "アクティビスト・ファンド A",
    stockName: "ABC 株式会社",
    previousHoldings: "5.2%",
    currentHoldings: "6.8%",
    change: "+1.6%",
    purpose: "経営参加の意図あり",
    timestamp: "2026-04-27 14:30",
    action: "buy",
  },
  {
    id: 2,
    fundName: "グローバル・インベスト B",
    stockName: "XYZ  Corp",
    previousHoldings: "7.1%",
    currentHoldings: "5.4%",
    change: "-1.7%",
    purpose: "財務改善目的",
    timestamp: "2026-04-27 13:15",
    action: "sell",
  },
  {
    id: 3,
    fundName: "ベンチャーキャピタル C",
    stockName: "DEF テクノロジーズ",
    previousHoldings: "新規",
    currentHoldings: "5.1%",
    change: "新規取得",
    purpose: "長期的な成長期待",
    timestamp: "2026-04-27 11:00",
    action: "new",
  },
];

// 急上昇ランキングのダミーデータ
const hotStocks = [
  {
    rank: 1,
    name: "ABC 株式会社",
    ticker: "ABC",
    change: "+12.5%",
    volume: "1,234,567",
  },
  {
    rank: 2,
    name: "GHI エナジー",
    ticker: "GHI",
    change: "+8.3%",
    volume: "987,654",
  },
  {
    rank: 3,
    name: "JKL ファーマ",
    ticker: "JKL",
    change: "+6.7%",
    volume: "765,432",
  },
  {
    rank: 4,
    name: "MNO 物流",
    ticker: "MNO",
    change: "+5.2%",
    volume: "654,321",
  },
  {
    rank: 5,
    name: "PQR 通信",
    ticker: "PQR",
    change: "+4.1%",
    volume: "543,210",
  },
];

function getActionBadge(action: string) {
  switch (action) {
    case "buy":
      return <Badge className="bg-red-500 hover:bg-red-600">買い増し</Badge>;
    case "sell":
      return (
        <Badge className="bg-green-500 hover:bg-green-600">一部処分</Badge>
      );
    case "new":
      return <Badge className="bg-teal-500 hover:bg-teal-600">新規取得</Badge>;
    default:
      return <Badge>その他</Badge>;
  }
}

export default function Home() {
  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Top Cards (サマリー指標) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summaryStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs">
                {stat.trend === "up" ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-red-500" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
                )}
                <span
                  className={
                    stat.trend === "up" ? "text-red-500" : "text-green-500"
                  }
                >
                  {stat.change}
                </span>
                <span className="ml-1 text-muted-foreground">前日比</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Timeline View (タイムライン) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>最新の報告書</CardTitle>
            <CardDescription>直近の大株主報告書のタイムライン</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timelineItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border bg-card"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {getActionBadge(item.action)}
                      <span className="text-sm font-medium">
                        {item.fundName}
                      </span>
                      <span className="text-sm text-muted-foreground">➔</span>
                      <span className="text-sm font-semibold">
                        {item.stockName}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      保有割合：{item.previousHoldings} → {item.currentHoldings}{" "}
                      (
                      <span
                        className={
                          item.change.includes("+")
                            ? "text-red-500 font-medium"
                            : item.change === "新規取得"
                              ? "text-teal-500 font-medium"
                              : "text-green-500 font-medium"
                        }
                      >
                        {item.change}
                      </span>
                      )
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.purpose}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {item.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hot Stocks (急上昇ランキング) */}
        <Card>
          <CardHeader>
            <CardTitle>急上昇銘柄</CardTitle>
            <CardDescription>大口買いが集中している銘柄</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hotStocks.map((stock) => (
                <div
                  key={stock.ticker}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      #{stock.rank}
                    </span>
                    <div>
                      <div className="text-sm font-medium">{stock.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {stock.ticker}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-500">
                      {stock.change}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stock.volume}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
