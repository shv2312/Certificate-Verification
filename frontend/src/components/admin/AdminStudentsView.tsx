/**
 * AdminStudentsView.tsx
 * =====================
 * Student Records module for Admin Portal.
 * Displays active students from institutional ledger and provides Bulk Import Modal.
 */

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Copy, 
  Check, 
  Download 
} from 'lucide-react';
import { getStudents, importStudentData, type StudentRecordItem } from '../../api/admin';

export default function AdminStudentsView() {
  const [students, setStudents] = useState<StudentRecordItem[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bulk import modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    imported: number;
    updated: number;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const fetchStudentsList = async (searchQuery = searchTerm) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudents({ search: searchQuery, limit: 100 });
      if (res.success && res.data) {
        setStudents(res.data.students);
        setTotalStudents(res.data.total);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load students ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsList();
  }, []);

  // Filter students by searchTerm, selectedBranch, and selectedYear
  const filteredStudents = React.useMemo(() => {
    return students.filter((st) => {
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesReg = st.register_number.toLowerCase().includes(q);
        const matchesName = st.full_name.toLowerCase().includes(q);
        if (!matchesReg && !matchesName) return false;
      }
      if (selectedBranch) {
        const b = selectedBranch.toLowerCase();
        const matchesBranch = (st.branch_name || '').toLowerCase().includes(b);
        if (!matchesBranch) return false;
      }
      if (selectedYear) {
        const matchesYear = String(st.year_of_passing) === selectedYear;
        if (!matchesYear) return false;
      }
      return true;
    });
  }, [students, searchTerm, selectedBranch, selectedYear]);

  const handleCopy = (regNo: string) => {
    navigator.clipboard.writeText(regNo);
    setCopiedId(regNo);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        setImportError('File size exceeds 25MB limit.');
        return;
      }
      setSelectedFile(file);
      setImportError(null);
      setImportResult(null);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setImportError('Please select a file to import.');
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const res = await importStudentData(selectedFile);
      if (res.success && res.data) {
        setImportResult({
          success: true,
          message: res.message || 'Records imported successfully.',
          imported: res.data.imported_count,
          updated: res.data.updated_count,
        });
        // Auto refresh table
        fetchStudentsList();
      } else {
        throw new Error(res.message || 'Failed to process import.');
      }
    } catch (err: any) {
      setImportError(err?.message || 'Failed to import student data.');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      'register_number,full_name,programme,branch,year_of_passing,mode_of_education,has_arrear\n' +
      '714025104245,Shri Hari,B.E.,Computer Science and Engineering,2024,Regular (Full-time),no\n' +
      '713519104001,John Doe,B.E.,Computer Science and Engineering,2023,Regular (Full-time),no\n' +
      '713519104002,Jane Smith,B.E.,Electronics and Communication Engineering,2023,Regular (Full-time),no\n' +
      '713521205010,Kavitha Raman,B.Tech,Information Technology,2024,Regular (Full-time),no\n' +
      '713521243015,Vigneshwaran S,B.Tech,Artificial Intelligence and Data Science,2025,Regular (Full-time),no\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_student_roster.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Top Banner & Action Controls */}
      <div className="surface-card p-6 border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-5 h-5 text-[#0B6A3E]" />
            <h2 className="text-xl font-bold text-siet-navy">Institutional Student Ledger</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Authoritative student registry ({totalStudents} records indexed) against which HR candidate submissions are verified.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchStudentsList()}
            className="btn-secondary py-2.5 px-4 text-xs font-semibold flex items-center gap-2"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              setImportResult(null);
              setImportError(null);
              setImportModalOpen(true);
            }}
            className="bg-[#0B6A3E] hover:bg-[#074828] text-white font-bold py-2.5 px-5 rounded-lg shadow-sm hover:shadow transition-all text-xs flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-yellow-400" />
            <span>Bulk Import Student Data</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <input
            type="text"
            placeholder="Search by Register Number or Student Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        {/* Inline Branch Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Degree / Branch:</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          >
            <option value="">All Branches</option>
            <option value="Computer Science">B.E. CSE</option>
            <option value="Electronics and Communication">B.E. ECE</option>
            <option value="Electrical and Electronics">B.E. EEE</option>
            <option value="Mechanical">B.E. Mech</option>
            <option value="Civil">B.E. Civil</option>
            <option value="Agricultural">B.E. Agri</option>
          </select>
        </div>

        {/* Inline Year of Passing Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Passing Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          >
            <option value="">All Years</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
            <option value="2020">2020</option>
          </select>
        </div>

        {(searchTerm || selectedBranch || selectedYear) && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedBranch('');
              setSelectedYear('');
            }}
            className="text-xs text-slate-500 hover:text-slate-800 underline px-2 py-1"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Student Table */}
      <div className="surface-card border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0B6A3E] mb-2" />
            Loading student records from database...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            {error}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No matching student records found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query, degree/branch, or passing year filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Student database roster">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-3.5 whitespace-nowrap">Register No</th>
                  <th className="px-4 py-3.5">Full Name</th>
                  <th className="px-4 py-3.5">Degree / Branch</th>
                  <th className="px-4 py-3.5">Year of Passing</th>
                  <th className="px-4 py-3.5">Education Mode</th>
                  <th className="px-4 py-3.5">Standing Arrears</th>
                  <th className="px-4 py-3.5">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <span>{st.register_number}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(st.register_number)}
                          className="text-slate-400 hover:text-emerald-800 transition-colors"
                          title="Copy Register Number"
                        >
                          {copiedId === st.register_number ? (
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {st.full_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="font-semibold text-slate-900">{st.programme_name}</span>
                      <span className="text-xs text-slate-500 block">{st.branch_name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {st.year_of_passing}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {st.mode_of_education}
                    </td>
                    <td className="px-4 py-3">
                      {st.has_arrear ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          Standing Arrears
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Clear / No Arrears
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 text-green-700" />
                        Ledger Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Bulk Import Modal ── */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-yellow-400 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Bulk Import Student Data</h3>
                  <p className="text-xs text-slate-400">Accepts .xlsx, .xls, .csv, and .json files up to 25MB</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 space-y-5">
              {importError && (
                <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-700" />
                    <span>{importResult.message}</span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    {importResult.imported} record(s) inserted, {importResult.updated} record(s) updated.
                  </p>
                </div>
              )}

              {/* Upload Drop Zone */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-[#0B6A3E] transition-colors bg-slate-50/50">
                <FileSpreadsheet className="w-10 h-10 text-[#0B6A3E] mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Select or drag student file here'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                    : 'Excel (.xlsx, .xls), CSV (.csv), or JSON format up to 25MB'}
                </p>

                <label className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer transition-all">
                  <span>Browse File</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Sample Template Download */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-600">Need the standard spreadsheet format?</span>
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="font-bold text-[#0B6A3E] hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="btn-secondary py-2 px-4 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || isImporting}
                  className="bg-[#0B6A3E] hover:bg-[#074828] text-white font-bold py-2 px-5 rounded-lg shadow-sm text-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing File...</span>
                    </>
                  ) : (
                    <span>Upload &amp; Import</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
