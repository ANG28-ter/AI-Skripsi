import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const VisualisasiData = () => {
  const [chartData, setChartData] = useState([]);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Ambil dua kolom pertama: kolom label & value
      const parsedData = jsonData.map((row) => {
        const keys = Object.keys(row);
        return {
          label: String(row[keys[0]]),
          value: Number(row[keys[1]]),
        };
      });

      setChartData(parsedData);
    };

    reader.readAsArrayBuffer(file); // Future-safe
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-semibold">Visualisasi Data Mahasiswa</h2>

      <input
        type="file"
        accept=".csv,.xlsx"
        onChange={handleFileUpload}
        className="block"
      />

      {fileName && <p className="text-sm text-gray-500">File: {fileName}</p>}

      {chartData.length > 0 && (
        <div className="h-96 w-full bg-white rounded-lg shadow p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default VisualisasiData;
