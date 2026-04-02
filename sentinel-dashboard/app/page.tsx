"use client";

import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  Search, Landmark, X, ShieldCheck, 
  Globe, Upload, Trash2, Plus, Download, Clock, AlertCircle
} from 'lucide-react';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRisk, setSelectedRisk] = useState("All");
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newRecord, setNewRecord] = useState({
    id: "", user: "", amount: "", status: "Pending", risk: "Medium", method: "Manual Entry", date: "", location: "Internal Server"
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    const savedData = localStorage.getItem('sentinel_data');
    const defaultData = [
      { id: "TX1002", user: "Alice Smith", amount: "$12,400", status: "Flagged", risk: "High", date: "2026-02-08 14:22", location: "New York, USA", method: "Wire Transfer" },
      { id: "TX1003", user: "Bob Jones", amount: "$45.00", status: "Verified", risk: "Low", date: "2026-02-08 15:10", location: "London, UK", method: "Debit Card" },
    ];

    if (savedData && JSON.parse(savedData).length > 0) {
      setTransactions(JSON.parse(savedData));
    } else {
      setTransactions(defaultData);
    }
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('sentinel_data', JSON.stringify(transactions));
    }
  }, [transactions]);

  // --- CALCULATIONS ---
const getRiskScore = (risk: string) => {
  switch (risk) {
    case "High": return 99;
    case "Medium": return 65;
    case "Low": return 18;
    default: return 0;
  }
};

  const stats = {
    high: transactions.filter(t => t.risk === 'High').length,
    medium: transactions.filter(t => t.risk === 'Medium').length,
    low: transactions.filter(t => t.risk === 'Low').length
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = (tx.user?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
                         (tx.id?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesRisk = selectedRisk === "All" || tx.risk === selectedRisk;
    return matchesSearch && matchesRisk;
  });

  // --- NEW EXPORT HANDLER ---
  const handleExport = (dataToExport: any[]) => {
    if (dataToExport.length === 0) return alert("No data to export");
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sentinel_export_${new Date().getTime()}.csv`);
    link.click();
  };

  // --- HANDLERS ---
  const handleDeleteTx = (id: string) => {
    if (confirm("Permanently delete this record?")) {
      const updated = transactions.filter(t => t.id !== id);
      setTransactions(updated);
      localStorage.setItem('sentinel_data', JSON.stringify(updated));
      setSelectedTx(null);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} selected records?`)) {
      const updated = transactions.filter(t => !selectedIds.includes(t.id));
      setTransactions(updated);
      localStorage.setItem('sentinel_data', JSON.stringify(updated));
      setSelectedIds([]);
      setSelectedTx(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (results) => {
          const importedData = results.data.map((row: any) => ({
            id: row.id || `TX${Math.floor(1000 + Math.random() * 9000)}`,
            user: row.user || "Imported Entity",
            amount: row.amount || "$0.00",
            status: row.status || "Pending",
            risk: row.risk || "Medium",
            method: row.method || "CSV Import",
            date: row.date || new Date().toLocaleString(),
            location: row.location || "Remote Server"
          }));
          setTransactions([...importedData, ...transactions]);
        },
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recordToAdd = { ...newRecord, id: `TX${Math.floor(1000 + Math.random() * 9000)}`, date: new Date().toLocaleString() };
    setTransactions([recordToAdd, ...transactions]);
    setIsModalOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-slate-900 flex overflow-hidden font-sans">
      
      <div className={`flex-1 p-8 transition-all duration-500 ${selectedTx ? 'mr-96' : ''}`}>
        <header className="mb-8 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 p-2 rounded-lg text-white"><Landmark className="w-6 h-6" /></div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Sentinel Risk Engine</h1>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Live Security Feed</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-md">
                <Plus className="w-4 h-4" /> New Entry
              </button>

              {/* ADDED EXPORT BUTTON */}
              <button onClick={() => handleExport(transactions)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:border-slate-400 shadow-sm transition-all">
                <Download className="w-4 h-4 text-slate-500" /> Export CSV
              </button>

              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:border-slate-400 shadow-sm transition-all">
                <Upload className="w-4 h-4 text-slate-500" /> Import
              </button>

              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none text-sm shadow-sm transition-all" onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </div>

          {/* RISK SUMMARY BAR */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
              <p className="text-2xl font-black">{transactions.length}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm text-red-600">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1">High</p>
              <p className="text-2xl font-black">{stats.high}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-sm text-amber-600">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1">Medium</p>
              <p className="text-2xl font-black">{stats.medium}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm text-emerald-600">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1">Low</p>
              <p className="text-2xl font-black">{stats.low}</p>
            </div>
          </div>

          <div className="flex gap-2 items-center text-sm bg-white p-1.5 rounded-xl border border-slate-200 w-fit">
            {["All", "High", "Medium", "Low"].map((level) => (
              <button key={level} onClick={() => setSelectedRisk(level)} className={`px-4 py-1.5 rounded-lg font-bold transition-all ${selectedRisk === level ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>{level}</button>
            ))}
          </div>
        </header>

        {/* TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="p-5 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length > 0 && selectedIds.length === filteredTransactions.length} 
                    onChange={() => setSelectedIds(selectedIds.length === filteredTransactions.length ? [] : filteredTransactions.map(t => t.id))} 
                  />
                </th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entity Name</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} onClick={() => { setSelectedTx(tx); setIsEditing(false); }}
                  className={`cursor-pointer transition-all ${selectedTx?.id === tx.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}>
                  <td className="p-5" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.includes(tx.id)} onChange={() => setSelectedIds(prev => prev.includes(tx.id) ? prev.filter(i => i !== tx.id) : [...prev, tx.id])} />
                  </td>
                  <td className={`p-5 text-sm font-mono ${selectedTx?.id === tx.id ? 'text-slate-300' : 'text-slate-400'}`}>{tx.id}</td>
                  <td className="p-5">
                    <div className="text-sm font-bold">{tx.user}</div>
                    <div className="text-[10px] font-medium uppercase opacity-60">{tx.method}</div>
                  </td>
                  <td className="p-5 text-right">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                      tx.risk === 'High' ? 'bg-red-600 text-white' : 
                      tx.risk === 'Medium' ? 'bg-amber-400 text-slate-900' : 
                      'bg-emerald-500 text-white'
                    }`}>
                      {tx.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FLOATING BULK BAR (Updated with Export Selection) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-4">
          <span className="text-sm font-bold">{selectedIds.length} Selected</span>
          <div className="flex items-center gap-3">
            <button onClick={() => handleExport(transactions.filter(t => selectedIds.includes(t.id)))} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-700">
              <Download className="w-4 h-4 text-slate-400" /> Export Selection
            </button>
            <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold transition-all">
              <Trash2 className="w-4 h-4" /> Delete Records
            </button>
          </div>
          <button onClick={() => setSelectedIds([])} className="text-xs text-slate-400 hover:text-white">Cancel</button>
        </div>
      )}

      {/* INSPECTION SIDEBAR */}
      <div className={`fixed right-0 top-0 h-full w-96 bg-white border-l border-slate-200 shadow-2xl transition-transform duration-500 transform ${selectedTx ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedTx && (
          <div className="p-8 h-full flex flex-col justify-between">
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="font-black text-xs uppercase text-slate-400">Deep Inspection</h2>
                <button onClick={() => setSelectedTx(null)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Transaction Value</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedTx.amount}</h3>
              </div>
                {/* RISK OVERVIEW */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Risk Score
                    </p>
                    <p className="text-3xl font-black">
                      {getRiskScore(selectedTx.risk)}
                      <span className="text-sm font-medium text-slate-400"> / 100</span>
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Risk Level
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                      selectedTx.risk === "High"
                        ? "bg-red-600 text-white"
                        : selectedTx.risk === "Medium"
                        ? "bg-amber-400 text-slate-900"
                        : "bg-emerald-500 text-white"
                    }`}>
                      {selectedTx.risk}
                    </span>
                  </div>
                </div>

                {/* TRANSACTION METADATA */}
                <div className="space-y-4">
                  <DetailRow icon={<ShieldCheck className="w-4 h-4" />} label="Reference ID" value={selectedTx.id} />
                  <DetailRow icon={<Clock className="w-4 h-4" />} label="Timestamp" value={selectedTx.date} />
                  <DetailRow icon={<Globe className="w-4 h-4" />} label="Region" value={selectedTx.location} />
                  <DetailRow icon={<Landmark className="w-4 h-4" />} label="Payment Channel" value={selectedTx.method} />
                </div>

                {/* AUTOMATED RISK NARRATIVE */}
                <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-3 shadow-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Automated Risk Narrative
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This transaction was classified as{" "}
                    <span className="text-white font-bold">{selectedTx.risk}</span> risk based on
                    behavioral heuristics, transaction velocity, and deviation from the
                    account’s historical activity profile.
                  </p>
                  <p className="text-[10px] font-bold text-slate-500">
                    Last evaluated: {new Date().toLocaleString()}
                  </p>
                </div>
            </div>

              <div className="space-y-2 mt-auto">
                <button className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition-all">
                  Freeze Account
                </button>
                <button
                  onClick={() => handleDeleteTx(selectedTx.id)}
                  className="w-full py-4 bg-red-50 hover:bg-red-100 rounded-2xl text-red-600 font-bold text-sm transition-all"
                >
                  Delete Record
                </button>
              </div>

          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Manual Entry</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input required placeholder="Entity Name" className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-slate-900" onChange={e => setNewRecord({...newRecord, user: e.target.value})} />
              <input required placeholder="Amount" className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-slate-900" onChange={e => setNewRecord({...newRecord, amount: e.target.value})} />
              <select className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-slate-900 bg-white" onChange={e => setNewRecord({...newRecord, risk: e.target.value})}>
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
              </select>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">Create Record</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">{icon}</div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-700">{value || "N/A"}</p>
      </div>
    </div>
  );
}