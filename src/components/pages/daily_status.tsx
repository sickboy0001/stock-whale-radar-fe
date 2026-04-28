"use client";

import React, { useState, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  getDailyImportStatus,
  getImportDetailByDate,
} from "@/service/daily-import";
import {
  DailyImportDetail,
  type ImportDetail,
} from "@/components/organisms/daily-import-detail";

type DailyImportStatus = {
  targetDate: string;
  status: string;
  totalDocsCount: number | null;
  targetDocsCount: number | null;
  successCount: number | null;
  lastRunStartAt: string | null;
  lastRunEndAt: string | null;
  errorMessage: string | null;
};

interface DailyStatusPageProps {
  initialData: DailyImportStatus[];
  initialYear: number;
}

export function DailyStatusPage({
  initialData,
  initialYear,
}: DailyStatusPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1,
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [details, setDetails] = useState<ImportDetail[]>([]);
  const [isPending, startTransition] = useTransition();

  // 月ごとの集計
  const monthlyStats = useMemo(() => {
    const stats = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      completedDays: 0,
      totalDays: new Date(selectedYear, i + 1, 0).getDate(),
    }));

    initialData.forEach((item) => {
      const date = new Date(item.targetDate);
      if (date.getFullYear() === selectedYear) {
        const monthIndex = date.getMonth();
        if (item.status === "completed") {
          stats[monthIndex].completedDays++;
        }
      }
    });

    return stats;
  }, [initialData, selectedYear]);

  // 選択された月のデータ
  const filteredData = useMemo(() => {
    return initialData.filter((item) => {
      const date = new Date(item.targetDate);
      return (
        date.getFullYear() === selectedYear &&
        date.getMonth() + 1 === selectedMonth
      );
    });
  }, [initialData, selectedYear, selectedMonth]);

  const totalProgress = useMemo(() => {
    const completed = monthlyStats.reduce(
      (acc, curr) => acc + curr.completedDays,
      0,
    );
    const total = monthlyStats.reduce((acc, curr) => acc + curr.totalDays, 0);
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [monthlyStats]);

  const handleShowDetails = (date: string) => {
    setSelectedDay(date);
    startTransition(async () => {
      const data = await getImportDetailByDate(date);
      setDetails(data);
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600">完了</Badge>;
      case "failed":
        return <Badge variant="destructive">失敗</Badge>;
      case "processing":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 animate-pulse">
            実行中
          </Badge>
        );
      case "pending":
      default:
        return <Badge variant="secondary">未処理</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            データインポート進捗管理
          </h1>
          <p className="text-muted-foreground">
            日次および月次のデータ取り込み進捗を監視します。
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">対象年:</span>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => {
                if (value) {
                  const newYear = parseInt(value);
                  setSelectedYear(newYear);
                  // URL を更新してサーバーからデータを再取得
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("year", newYear.toString());
                  router.push(`?${params.toString()}`);
                }
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="年を選択" />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="bg-muted p-3 rounded-lg flex flex-col items-end">
            <span className="text-xs text-muted-foreground">全期間進捗</span>
            <span className="text-sm font-bold">
              {totalProgress.completed} / {totalProgress.total}日 (
              {totalProgress.percentage}%)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {monthlyStats.map((stat) => {
          const percentage = Math.round(
            (stat.completedDays / stat.totalDays) * 100,
          );
          const isActive = selectedMonth === stat.month;
          return (
            <Card
              key={stat.month}
              className={`cursor-pointer transition-colors hover:border-primary ${
                isActive ? "border-primary ring-1 ring-primary" : ""
              }`}
              onClick={() => setSelectedMonth(stat.month)}
            >
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">{stat.month}月</CardTitle>
                <CardDescription>
                  {stat.completedDays} / {stat.totalDays}日済
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <Progress value={percentage} className="h-2" />
                <div className="flex justify-between items-center text-xs">
                  <span>{percentage}%</span>
                  <span
                    className={
                      percentage === 100
                        ? "text-green-600 font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {percentage === 100
                      ? "完了"
                      : percentage > 0
                        ? "進行中"
                        : "未着手"}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            日別詳細情報: {selectedYear}年 {selectedMonth}月
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>成功/対象</TableHead>
                <TableHead>進捗率</TableHead>
                <TableHead>実行時刻</TableHead>
                <TableHead>アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => {
                  const progress = item.targetDocsCount
                    ? Math.round(
                        ((item.successCount || 0) / item.targetDocsCount) * 100,
                      )
                    : 0;
                  return (
                    <TableRow
                      key={item.targetDate}
                      className={
                        selectedDay === item.targetDate ? "bg-muted/50" : ""
                      }
                    >
                      <TableCell className="font-mono">
                        {item.targetDate}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="font-medium">
                        {item.successCount ?? 0} / {item.targetDocsCount ?? 0}
                      </TableCell>
                      <TableCell>{progress}%</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.lastRunStartAt?.split("T")[1]?.substring(0, 5) ||
                          "-"}{" "}
                        ～
                        {item.lastRunEndAt?.split("T")[1]?.substring(0, 5) ||
                          "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleShowDetails(item.targetDate)}
                        >
                          <Search className="w-4 h-4 mr-1" />
                          データを閲覧
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    データがありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedDay && (
        <DailyImportDetail
          date={selectedDay}
          details={details}
          isLoading={isPending}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
