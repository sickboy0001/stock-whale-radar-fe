"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChartDataPoint } from "@/type/stock";

export const StockChart = ({ data }: { data: ChartDataPoint[] }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !chartContainerRef.current || data.length === 0) return;

    const init = async () => {
      try {
        const module = await import("lightweight-charts");
        const LWCharts = (module as any).default || module;
        const createChart = LWCharts.createChart;
        const ColorType = LWCharts.ColorType;

        if (typeof createChart !== "function") return;
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: "transparent" },
            textColor: "#a1a1aa",
          },
          width: chartContainerRef.current.clientWidth || 600,
          height: 500,
          grid: {
            vertLines: { color: "#27272a" },
            horzLines: { color: "#27272a" },
          },
          timeScale: { borderColor: "#3f3f46" },
        }) as any;

        // Defensive helper for adding series
        const addSeries = (type: string, options: any) => {
          const methodName = `add${type}Series`;
          if (typeof chart[methodName] === "function") {
            return chart[methodName](options);
          }
          if (typeof chart.addSeries === "function") {
            // Fallback for some v4/v5 builds
            return chart.addSeries(LWCharts[type + "Series"] || type, options);
          }
          throw new Error(
            `Method ${methodName} or addSeries not found on chart`,
          );
        };

        // 1. ローソク足
        const candlestickSeries = addSeries("Candlestick", {
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderVisible: false,
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
        });
        candlestickSeries.setData(data);

        // 2. 移動平均線 (SMA)
        const calculateSMA = (count: number) => {
          const smaData = [];
          for (let i = 0; i < data.length; i++) {
            if (i < count - 1) continue;
            let sum = 0;
            for (let j = 0; j < count; j++) {
              sum += data[i - j].close;
            }
            smaData.push({ time: data[i].time, value: sum / count });
          }
          return smaData;
        };

        const sma5Series = addSeries("Line", {
          color: "#3b82f6",
          lineWidth: 2,
          title: "SMA 5",
        });
        sma5Series.setData(calculateSMA(5));

        const sma25Series = addSeries("Line", {
          color: "#eab308",
          lineWidth: 2,
          title: "SMA 25",
        });
        sma25Series.setData(calculateSMA(25));

        // 3. 出来高 (Histogram)
        const volumeSeries = addSeries("Histogram", {
          color: "#26a69a",
          priceFormat: {
            type: "volume",
          },
          priceScaleId: "", // Overlay
        });

        volumeSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });

        const volumeData = data.map((d) => ({
          time: d.time,
          value: d.volume,
          color:
            d.close >= d.open
              ? "rgba(34, 197, 94, 0.5)"
              : "rgba(239, 68, 68, 0.5)",
        }));
        volumeSeries.setData(volumeData);

        const last30Days = data.slice(-30);
        if (last30Days.length > 0) {
          chart.timeScale().setVisibleRange({
            from: last30Days[0].time,
            to: last30Days[last30Days.length - 1].time,
          });
        }

        const handleResize = () => {
          if (chartContainerRef.current) {
            chart.applyOptions({
              width: chartContainerRef.current.clientWidth,
            });
          }
        };

        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
          chart.remove();
        };
      } catch (error) {
        console.error("Error initializing chart:", error);
      }
    };

    let cleanup: (() => void) | undefined;
    init().then((cb) => {
      if (typeof cb === "function") cleanup = cb;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [mounted, data]);

  return <div ref={chartContainerRef} className="w-full h-[500px]" />;
};
