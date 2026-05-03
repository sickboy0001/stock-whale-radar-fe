
このチャートは、**「誰が、いつ、どれくらい持っていたか」の時系列の変化**を可視化するもので、投資判断において非常に強力なツールになります。

---

### 実装のポイント
1.  **データ整形**: 提出日（義務発生日）がバラバラな複数の投資家のデータを、共通の時間軸（X軸）に並べ直し、報告がない日の値は「前回の値を引き継ぐ」処理が必要です。
2.  **ライブラリ**: `shadcn/ui` や他のコンポーネントとの親和性が高く、レスポンシブに強い **Recharts** を使用します。
3.  **色の管理**: 投資家ごとに色を自動割り当てします。

---

### 1. 新しいコンポーネントの作成
`src/components/charts/OwnershipStackedChart.tsx` として作成します。

```tsx
"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { HistoryItem } from "@/type/stock";

interface Props {
  history: HistoryItem[];
}

// 投資家ごとのカラーパレット
const COLORS = [
  "#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1"
];

export function OwnershipStackedChart({ history }: Props) {
  const chartData = useMemo(() => {
    if (!history.length) return [];

    // 1. 全てのユニークな日付と投資家を抽出
    const dates = Array.from(new Set(history.map(h => h.obligationDate))).sort();
    const submitters = Array.from(new Set(history.map(h => h.submitterName)));

    // 2. 日付ごとのデータ構造を作成
    // 各日付時点で、各投資家が何％持っているかを算出
    let lastKnownRatios: Record<string, number> = {};
    
    return dates.map(date => {
      const dayData: any = { date };
      
      // その日の報告を反映
      history.filter(h => h.obligationDate === date).forEach(h => {
        if (h.submitterName) {
          lastKnownRatios[h.submitterName] = h.holdingRatio || 0;
        }
      });

      // 全投資家のその時点での値をセット
      submitters.forEach(s => {
        if (s) dayData[s] = lastKnownRatios[s] || 0;
      });

      return dayData;
    });
  }, [history]);

  const uniqueSubmitters = useMemo(() => {
    return Array.from(new Set(history.map(h => h.submitterName))).filter(Boolean);
  }, [history]);

  return (
    <div className="w-full h-[400px] mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            fontSize={11} 
            tickMargin={10}
          />
          <YAxis 
            fontSize={11} 
            unit="%" 
            domain={[0, 'auto']}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
          {uniqueSubmitters.map((name, index) => (
            <Bar
              key={name}
              dataKey={name!}
              stackId="a"
              fill={COLORS[index % COLORS.length]}
              radius={[0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

### 2. 既存の `StockHolder.tsx` への組み込み指示

お手元の `StockHolder` コンポーネントに以下の修正を加えてください。

#### ① インポートの追加
```tsx
import { OwnershipStackedChart } from "@/components/charts/OwnershipStackedChart";
```

#### ② JSXの配置（報告履歴一覧のCard内、Tableの直上または直下）
「報告履歴一覧」のカードの中に、チャートを表示するセクションを追加します。

```tsx
{/* 報告履歴一覧（時系列） */}
<Card className="lg:col-span-2">
  <CardHeader>
    <CardTitle>報告履歴一覧（時系列）</CardTitle>
    <CardDescription>大量保有報告書に基づく保有比率の推移</CardDescription>
  </CardHeader>
  <CardContent>
    {/* ★ ここに追加：チャートコンポーネント */}
    {!loading && history.length > 0 && (
      <div className="mb-8 border-b pb-6">
        <OwnershipStackedChart history={history} />
      </div>
    )}

    {/* 既存のテーブル */}
    <div className="p-0">
      <Table>
        {/* ...（既存のTableHeader, TableBody）... */}
      </Table>
    </div>
  </CardContent>
</Card>
```

---

### 3. この機能で期待できる効果（プロの視点）

1.  **「クジラの入れ替わり」が可視化される**: 
    特定の投資家が減らし、別の投資家が増やしている様子が色の面積で一目でわかります。
2.  **浮動株のタイトさがわかる**: 
    棒グラフ全体の高さ（合計保有比率）が上がっていれば、市場に出回る株が減っており、株価が飛びやすい状態であることを示唆します。
3.  **UIの整合性**: 
    2枚目の参考画像にある「凡例のクリックで表示/非表示」などの機能も Recharts の標準機能で拡張可能です。

まずはこの構成でプッシュし、表示を確認してみてください。もし投資家の名前が長すぎてグラフが崩れる場合は、凡例のカスタマイズ（`Legend` の `formatter`）で名称を短縮するロジックを追加しましょう。