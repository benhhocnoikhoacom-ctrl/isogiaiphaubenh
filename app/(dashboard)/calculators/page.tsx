"use client";

import { useState } from "react";
import { Calculator, Activity, Droplets, Scale, Thermometer } from "lucide-react";

export default function MedicalCalculatorsPage() {
  const [activeTab, setActiveTab] = useState<"bmi" | "glucose" | "map">("bmi");

  // BMI State
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  // Glucose State
  const [glucoseVal, setGlucoseVal] = useState("");
  const [glucoseUnit, setGlucoseUnit] = useState<"mgdl" | "mmol">("mgdl");

  // MAP State
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");

  // Calculators
  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // convert cm to m
    if (w > 0 && h > 0) {
      const bmi = w / (h * h);
      let status = "Thiếu cân";
      let color = "text-amber-500";
      if (bmi >= 18.5 && bmi < 24.9) {
        status = "Bình thường";
        color = "text-emerald-500";
      } else if (bmi >= 25 && bmi < 29.9) {
        status = "Tiền béo phì (Thừa cân)";
        color = "text-orange-500";
      } else if (bmi >= 30) {
        status = "Béo phì";
        color = "text-rose-600";
      }
      return { value: bmi.toFixed(2), status, color };
    }
    return null;
  };

  const calculateGlucose = () => {
    const val = parseFloat(glucoseVal);
    if (!val || val <= 0) return null;

    if (glucoseUnit === "mgdl") {
      // mg/dL to mmol/L (Divide by 18)
      return {
        result: (val / 18).toFixed(2),
        unit: "mmol/L",
        label: "Chuyển thành mmol/L"
      };
    } else {
      // mmol/L to mg/dL (Multiply by 18)
      return {
        result: (val * 18).toFixed(0),
        unit: "mg/dL",
        label: "Chuyển thành mg/dL"
      };
    }
  };

  const calculateMAP = () => {
    const sbp = parseFloat(systolic);
    const dbp = parseFloat(diastolic);
    if (sbp > 0 && dbp > 0) {
      const map = (sbp + 2 * dbp) / 3;
      return map.toFixed(1);
    }
    return null;
  };

  const bmiResult = calculateBMI();
  const glucoseResult = calculateGlucose();
  const mapResult = calculateMAP();

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto animation-fade-in pb-16">
      <div className="flex items-center gap-3 border-b border-border/50 pb-6 mb-2">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
          <Calculator className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Máy tính Y Khoa</h1>
          <p className="text-muted-foreground mt-1 text-zinc-500">
            Các công cụ chuyển đổi nhanh và tính toán chỉ số thường dùng
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sidebar Nav */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("bmi")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === "bmi"
                ? "bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 font-medium text-blue-600 dark:text-blue-400"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
            }`}
          >
            <Scale className="h-5 w-5" />
            Chỉ số khối cơ thể (BMI)
          </button>
          <button
            onClick={() => setActiveTab("glucose")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === "glucose"
                ? "bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 font-medium text-rose-600 dark:text-rose-400"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
            }`}
          >
            <Droplets className="h-5 w-5" />
            Đường huyết (Glucose)
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === "map"
                ? "bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 font-medium text-emerald-600 dark:text-emerald-400"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
            }`}
          >
            <Activity className="h-5 w-5" />
            Áp lực động mạch (MAP)
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 shadow-sm">
            {activeTab === "bmi" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-blue-500" /> Tính chỉ số BMI
                </h2>
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Cân nặng (kg)</label>
                    <input
                      type="number"
                      placeholder="VD: 65"
                      className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Chiều cao (cm)</label>
                    <input
                      type="number"
                      placeholder="VD: 170"
                      className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>

                  {bmiResult && (
                    <div className="mt-4 p-5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 flex flex-col items-center justify-center gap-2 text-center">
                      <div className="text-sm text-zinc-500 font-medium uppercase tracking-wider">Chỉ số BMI của bạn</div>
                      <div className="text-5xl font-bold font-mono">{bmiResult.value}</div>
                      <div className={`text-lg font-medium ${bmiResult.color} mt-1`}>{bmiResult.status}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "glucose" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-rose-500" /> Chuyển đổi Đường huyết
                </h2>
                <div className="grid gap-6">
                  <div className="flex items-end gap-3">
                    <div className="grid gap-2 flex-1">
                      <label className="text-sm font-medium">Nồng độ Glucose</label>
                      <input
                        type="number"
                        placeholder="VD: 100"
                        className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={glucoseVal}
                        onChange={(e) => setGlucoseVal(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2 w-32">
                      <label className="text-sm font-medium">Đơn vị</label>
                      <select
                        className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={glucoseUnit}
                        onChange={(e) => setGlucoseUnit(e.target.value as "mgdl" | "mmol")}
                      >
                        <option value="mgdl">mg/dL</option>
                        <option value="mmol">mmol/L</option>
                      </select>
                    </div>
                  </div>

                  {glucoseResult && (
                    <div className="mt-4 p-5 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 flex flex-col items-center justify-center gap-2 text-center text-rose-900 dark:text-rose-100">
                      <div className="text-sm opacity-80 font-medium">{glucoseResult.label}</div>
                      <div className="text-4xl font-bold flex items-baseline gap-2">
                        {glucoseResult.result} <span className="text-lg opacity-70 font-medium">{glucoseResult.unit}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "map" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-500" /> TÍnh Huyết áp trung bình (MAP)
                </h2>
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Huyết áp tâm thu (Systolic mmHg)</label>
                    <input
                      type="number"
                      placeholder="VD: 120"
                      className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Huyết áp tâm trương (Diastolic mmHg)</label>
                    <input
                      type="number"
                      placeholder="VD: 80"
                      className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                    />
                  </div>

                  {mapResult && (
                    <div className="mt-4 p-5 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 flex flex-col items-center justify-center gap-2 text-center text-emerald-900 dark:text-emerald-100">
                      <div className="text-sm opacity-80 font-medium">Mean Arterial Pressure (MAP)</div>
                      <div className="text-4xl font-bold flex items-baseline gap-2">
                        {mapResult} <span className="text-lg opacity-70 font-medium">mmHg</span>
                      </div>
                      <div className="text-xs mt-2 opacity-70">
                        * Bình thường duy trì ở mức 70 - 100 mmHg
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
