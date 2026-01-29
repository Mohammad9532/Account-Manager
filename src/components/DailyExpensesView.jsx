"use client";

import React, { useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
    Coffee,
    TrendingDown,
    Plus,
    X,
    Calendar,
    Search,
    Filter,
    ArrowUpDown,
    Clock,
    Download,
    Upload,
    FileJson,
    Check,
    AlertCircle,
} from "lucide-react";
import StatsCard from "./StatsCard";
import TransactionList from "./TransactionList";
import TransactionForm from "./TransactionForm";
import CalendarView from "./CalendarView";
import ReportCard from "./ReportCard";
import { useFinance } from "../context/FinanceContext";
import { SCOPES, TRANSACTION_TYPES } from "../utils/constants";
import {
    exportToExcel,
    parseExcelFile,
    normalizeExcelDate,
} from "../utils/excelHelper";
import LedgerTable from "./LedgerTable";

const DailyExpensesView = () => {
    const { stats, transactions, bulkAddTransactions, formatCurrency } =
        useFinance();
    const [showAddModal, setShowAddModal] = useState(false);
    const [importPreviewData, setImportPreviewData] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [viewMode, setViewMode] = useState("items"); // 'items' or 'summary'

    // Filter & Sort States
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [sortBy, setSortBy] = useState("newest");

    // Time Range State
    const [timeRange, setTimeRange] = useState("today");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const dailyStats = stats(SCOPES.DAILY);

    // 1. Filter: Scope = DAILY, Type = DEBIT (Expense)
    const expenseTransactions = useMemo(() => {
        return transactions.filter(
            (t) =>
                (t.scope === SCOPES.DAILY || t.scope === SCOPES.INCOME) &&
                t.type === TRANSACTION_TYPES.DEBIT,
        );
    }, [transactions]);

    // Dynamic Categories from Data
    const availableCategories = useMemo(() => {
        const cats = new Set(
            expenseTransactions.map((t) => t.category).filter(Boolean),
        );
        return Array.from(cats).sort();
    }, [expenseTransactions]);

    // Calculate Spend based on Time Range
    const timeRangeSpend = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];

        // Helper to reset time to midnight
        const stripTime = (d) =>
            new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const todayDate = stripTime(now);

        return expenseTransactions.reduce((sum, t) => {
            const tDate = stripTime(new Date(t.date));
            const diffTime = todayDate - tDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let include = false;
            // ... (rest of time logic is same, uses switch case)
            switch (timeRange) {
                case "today":
                    include = diffDays === 0;
                    break;
                case "yesterday":
                    include = diffDays === 1;
                    break;
                case "week": // This Week (Sunday to Today)
                    const dayOfWeek = now.getDay(); // 0 is Sunday
                    include = diffDays <= dayOfWeek;
                    break;
                case "month": // This Month
                    include =
                        tDate.getMonth() === now.getMonth() &&
                        tDate.getFullYear() === now.getFullYear();
                    break;
                case "year": // This Year
                    include = tDate.getFullYear() === now.getFullYear();
                    break;
                case "last10":
                    include = diffDays >= 0 && diffDays < 10;
                    break;
                case "last20":
                    include = diffDays >= 0 && diffDays < 20;
                    break;
                case "custom":
                    if (startDate && endDate) {
                        const s = new Date(startDate);
                        const e = new Date(endDate);
                        include = tDate >= s && tDate <= e;
                    } else if (startDate) {
                        const s = new Date(startDate);
                        include = tDate >= s;
                    }
                    break;
                default:
                    include = false;
            }
            return include ? sum + (t.amount || 0) : sum;
        }, 0);
    }, [expenseTransactions, timeRange, startDate, endDate]);

    // Filter & Sort Logic for List
    const processedTransactions = useMemo(() => {
        let result = expenseTransactions.filter((t) => {
            const matchesSearch = t.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter
                ? t.category === categoryFilter
                : true;
            return matchesSearch && matchesCategory;
        });

        // Sort
        result.sort((a, b) => {
            if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
            if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
            if (sortBy === "highest") return b.amount - a.amount;
            if (sortBy === "lowest") return a.amount - b.amount;
            return 0;
        });

        return result;
    }, [transactions, searchTerm, categoryFilter, sortBy]);

    const rangeLabels = {
        today: "Spent Today",
        yesterday: "Spent Yesterday",
        week: "Spent This Week",
        month: "Spent This Month",
        year: "Spent This Year",
        last10: "Spent Last 10 Days",
        last20: "Spent Last 20 Days",
    };

    // Helper to filter daily txns based on time range (duplicated logic, ideally refactor)
    const getFilteredDailyTransactions = () => {
        const now = new Date();
        const stripTime = (d) =>
            new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const todayDate = stripTime(now);

        return transactions.filter((t) => {
            if ((t.scope || "manager") !== SCOPES.DAILY) return false;

            const tDate = stripTime(new Date(t.date));
            const diffTime = todayDate - tDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            switch (timeRange) {
                case "today":
                    return diffDays === 0;
                case "yesterday":
                    return diffDays === 1;
                case "week":
                    return diffDays <= now.getDay();
                case "month":
                    return (
                        tDate.getMonth() === now.getMonth() &&
                        tDate.getFullYear() === now.getFullYear()
                    );
                case "year":
                    return tDate.getFullYear() === now.getFullYear();
                case "last10":
                    return diffDays >= 0 && diffDays < 10;
                case "last20":
                    return diffDays >= 0 && diffDays < 20;
                case "custom":
                    if (startDate && endDate) {
                        return (
                            tDate >= new Date(startDate) &&
                            tDate <= new Date(endDate)
                        );
                    }
                    if (startDate) {
                        return tDate >= new Date(startDate);
                    }
                    return true;
                default:
                    return false;
            }
        });
    };

    // Image Share Logic
    const reportRef = React.useRef(null);
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async () => {
        setIsSharing(true);
        try {
            const { jsPDF } = await import("jspdf");
            const autoTable = (await import("jspdf-autotable")).default;

            const doc = new jsPDF();

            // Header
            doc.setFillColor(11, 17, 33); // Slate 900
            doc.rect(0, 0, doc.internal.pageSize.width, 40, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text("Daily Expenses", 14, 20);

            doc.setFontSize(12);
            doc.setTextColor(148, 163, 184); // Slate 400
            const dateStr =
                timeRange === "custom"
                    ? `${startDate ? new Date(startDate).toLocaleDateString() : "Start"} - ${endDate ? new Date(endDate).toLocaleDateString() : "Present"}`
                    : rangeLabels[timeRange] || timeRange;
            doc.text(`Period: ${dateStr}`, 14, 30);

            // Summary Stats
            doc.setTextColor(244, 63, 94); // Rose 500
            doc.setFontSize(14);
            // Calculate total based on current view logic
            const currentTotal = getFilteredDailyTransactions().reduce(
                (sum, t) => sum + (t.amount || 0),
                0,
            );
            doc.text(`Total Spent: ${currentTotal.toLocaleString()}`, 140, 25);

            // Table
            const tableData = getFilteredDailyTransactions().map((t) => [
                new Date(t.date).toLocaleDateString(),
                t.category,
                t.description,
                t.amount.toLocaleString(),
            ]);

            autoTable(doc, {
                startY: 50,
                head: [["Date", "Category", "Description", "Amount"]],
                body: tableData,
                theme: "grid",
                headStyles: {
                    fillColor: [15, 23, 42],
                    textColor: [255, 255, 255],
                },
                styles: { fontSize: 10, cellPadding: 3 },
                columnStyles: {
                    3: { halign: "right", textColor: [244, 63, 94] }, // Amount (Debit)
                },
            });

            const filename = `Daily_Expenses_${new Date().toISOString().split("T")[0]}.pdf`;
            const pdfBlob = doc.output("blob");
            const file = new File([pdfBlob], filename, {
                type: "application/pdf",
            });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: "Daily Expenses Report",
                        text: "Daily Expenses Report",
                    });
                } catch (err) {
                    console.log("Share failed/cancelled", err);
                }
            } else {
                doc.save(filename);
            }
        } catch (err) {
            console.error("Error generating PDF:", err);
            toast.error("Error generating report. Please try again.");
        } finally {
            setIsSharing(false);
        }
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            {
                Date: new Date().toLocaleDateString(),
                Category: "Food",
                Description: "Lunch at Cafe",
                Amount: 450,
            },
        ];
        exportToExcel(templateData, "Daily_Expenses_Template", "Template", [
            { wch: 15 },
            { wch: 15 },
            { wch: 30 },
            { wch: 12 },
        ]);
    };

    const handleExportExcel = () => {
        const data = processedTransactions.map((t) => ({
            Date: new Date(t.date).toLocaleDateString(),
            Category: t.category,
            Description: t.description,
            Amount: t.amount,
            Type: t.type,
        }));

        exportToExcel(
            data,
            `Daily_Expenses_${new Date().toISOString().split("T")[0]}`,
            "Expenses",
            [{ wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 12 }],
        );
    };

    const handleImportExcel = async (e) => {
        try {
            const data = await parseExcelFile(e);
            const newTxns = data.flatMap((row, index) => {
                const amount = parseFloat(
                    row.Amount || row.Debit || row.Credit || 0,
                );
                if (amount <= 0) return [];

                const baseDate = normalizeExcelDate(row.Date);
                const parsedDate = new Date(baseDate.getTime() + index * 1000);

                return [
                    {
                        description: row.Description || "Imported Expense",
                        amount: amount,
                        type: row.Type || TRANSACTION_TYPES.DEBIT,
                        category: row.Category || "Miscellaneous",
                        date: parsedDate,
                        scope: SCOPES.DAILY,
                    },
                ];
            });

            if (newTxns.length > 0) {
                setImportPreviewData(newTxns);
            } else {
                toast.error("No valid transactions found in the file.");
            }
        } catch (err) {
            console.error("Import error:", err);
            toast.error("Error parsing Excel file.");
        }
        e.target.value = ""; // Reset
    };

    const confirmImport = async () => {
        if (importPreviewData) {
            setIsImporting(true);
            try {
                await bulkAddTransactions(importPreviewData);
                setImportPreviewData(null);
            } finally {
                setIsImporting(false);
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
            {/* Hidden Report Card for Generation - Fixed Position technique */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    zIndex: -50,
                    opacity: 0,
                    pointerEvents: "none",
                }}
            >
                <ReportCard
                    ref={reportRef}
                    title="Daily Expenses"
                    subtitle="Expenditure Summary"
                    dateRange={
                        timeRange === "custom"
                            ? `${startDate ? new Date(startDate).toLocaleDateString() : "Start"} - ${endDate ? new Date(endDate).toLocaleDateString() : "Present"}`
                            : rangeLabels[timeRange] || timeRange
                    }
                    type="expense"
                    transactions={getFilteredDailyTransactions()}
                    stats={{
                        total: getFilteredDailyTransactions().reduce(
                            (sum, t) => sum + (t.amount || 0),
                            0,
                        ),
                        count: getFilteredDailyTransactions().length,
                    }}
                />
            </div>

            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                <div>
                    <div>
                        <h2 className="text-2xl font-bold text-finance-text">
                            Daily Expenses
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Track day-to-day spending
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* Share Report (PDF) */}
                    <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 px-3 py-2.5 rounded-xl font-medium transition-all active:scale-95 flex-1 md:flex-none"
                        title="Share PDF Report"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-5 h-5"
                        >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        <span className="hidden lg:inline">
                            {isSharing ? "Generating..." : "Report"}
                        </span>
                    </button>

                    {/* Import/Export Excel */}
                    <div className="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-100/50 dark:bg-slate-900/50">
                        <button
                            onClick={handleDownloadTemplate}
                            className="flex items-center justify-center p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 transition-colors"
                            title="Download Template"
                        >
                            <FileJson className="w-5 h-5" />
                        </button>
                        <label
                            className="flex items-center justify-center p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer border-r border-slate-200 dark:border-slate-700 transition-colors"
                            title="Import from Excel"
                        >
                            <Upload className="w-5 h-5" />
                            <input
                                type="file"
                                className="hidden"
                                accept=".xlsx, .xls"
                                onChange={handleImportExcel}
                            />
                        </label>
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center justify-center p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                            title="Export to Excel"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-rose-500/20 active:scale-95 flex-1 md:flex-none"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden lg:inline">Add Expense</span>
                        <span className="lg:hidden">Add</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatsCard
                    title="Total Spend (All Time)"
                    amount={dailyStats.totalExpense}
                    icon={Coffee}
                    type="expense"
                />

                {/* Time Range Stats Card */}
                <StatsCard
                    title={
                        <div className="flex items-center gap-2">
                            <span>Spent</span>
                            <div className="relative group/select">
                                <select
                                    value={timeRange}
                                    onChange={(e) =>
                                        setTimeRange(e.target.value)
                                    }
                                    className="bg-transparent border-none text-sm font-bold text-sky-500 focus:ring-0 focus:outline-none cursor-pointer py-0 pr-6 hover:text-sky-400 transition-colors appearance-none"
                                >
                                    <option
                                        className="bg-finance-bg text-finance-text"
                                        value="today"
                                    >
                                        Today
                                    </option>
                                    <option
                                        className="bg-finance-bg text-finance-text"
                                        value="yesterday"
                                    >
                                        Yesterday
                                    </option>
                                    <option
                                        className="bg-finance-bg text-finance-text"
                                        value="week"
                                    >
                                        This Week
                                    </option>
                                    <option
                                        className="bg-finance-bg text-finance-text"
                                        value="month"
                                    >
                                        This Month
                                    </option>
                                    <option
                                        className="bg-finance-bg text-finance-text"
                                        value="year"
                                    >
                                        This Year
                                    </option>
                                    <option
                                        className="bg-finance-bg text-finance-text"
                                        value="last10"
                                    >
                                        Last 10 Days
                                    </option>
                                    <option
                                        className="bg-finance-bg text-finance-text"
                                        value="last20"
                                    >
                                        Last 20 Days
                                    </option>
                                    <option
                                        className="bg-finance-bg text-finance-text font-bold text-orange-400"
                                        value="custom"
                                    >
                                        Custom Range
                                    </option>
                                </select>
                                <ArrowUpDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-sky-500 pointer-events-none opacity-50 group-hover/select:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    }
                    amount={
                        timeRange.startsWith("custom")
                            ? // Recalculate if custom because timeRangeSpend memo might not trigger on startDate change if logic isn't updated there
                            // Simpler to just use memo if we update it. Let's update useMemo below.
                            timeRangeSpend
                            : timeRangeSpend
                    }
                    icon={TrendingDown}
                    type="expense"
                />
                {/* Custom Date Inputs (Only show if Custom is selected) */}
                {timeRange === "custom" && (
                    <div className="md:col-span-2 p-4 bg-finance-card/50 rounded-2xl border border-finance-border flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-4">
                        <div className="flex-1 w-full">
                            <label className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1 block">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-finance-text focus:outline-none focus:border-orange-500"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1 block">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-finance-text focus:outline-none focus:border-orange-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Filter & Sort Bar */}
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search expenses..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-finance-text focus:outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>

                            {/* Category Filter */}
                            <div className="relative w-full sm:w-48">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <select
                                    value={categoryFilter}
                                    onChange={(e) =>
                                        setCategoryFilter(e.target.value)
                                    }
                                    className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-finance-text focus:outline-none focus:border-orange-500 appearance-none cursor-pointer"
                                >
                                    <option value="">All Categories</option>
                                    {availableCategories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort By */}
                            <div className="relative w-full sm:w-48">
                                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-finance-text focus:outline-none focus:border-orange-500 appearance-none cursor-pointer"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="highest">
                                        Highest Amount
                                    </option>
                                    <option value="lowest">
                                        Lowest Amount
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                            <button
                                onClick={() => setViewMode("items")}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === "items"
                                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                    }`}
                            >
                                Items
                            </button>
                            <button
                                onClick={() => setViewMode("summary")}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === "summary"
                                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                    }`}
                            >
                                Summary
                            </button>
                        </div>
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-sm text-sky-500 hover:text-sky-400"
                        >
                            {viewMode === "summary"
                                ? ""
                                : searchTerm || categoryFilter
                                    ? `Found ${processedTransactions.length} items`
                                    : showAll
                                        ? "Show Less"
                                        : "View All"}
                        </button>
                    </div>

                    {viewMode === "items" ? (
                        <TransactionList
                            customData={
                                showAll || searchTerm || categoryFilter
                                    ? processedTransactions
                                    : processedTransactions.slice(0, 10)
                            }
                            scope={SCOPES.DAILY}
                        />
                    ) : (
                        <LedgerTable
                            scope={SCOPES.DAILY}
                            includeLegacy={true}
                        />
                    )}
                </div>

                <div className="h-fit">
                    <CalendarView />
                </div>
            </div>

            {/* Add Transaction Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white bg-white/10 rounded-full backdrop-blur-md transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <TransactionForm
                            onClose={() => setShowAddModal(false)}
                            scope={SCOPES.DAILY}
                        />
                    </div>
                </div>
            )}
            {/* Import Preview Modal */}
            {importPreviewData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                                    <FileJson className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white">
                                    Import Expenses ({importPreviewData.length})
                                </h3>
                            </div>
                            <button
                                onClick={() => setImportPreviewData(null)}
                                className="p-2 text-slate-500 hover:text-white rounded-full"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-4">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-slate-900 text-slate-400 text-xs uppercase z-10">
                                    <tr>
                                        <th className="p-3 border-b border-slate-800 font-bold">
                                            Date
                                        </th>
                                        <th className="p-3 border-b border-slate-800 font-bold">
                                            Category
                                        </th>
                                        <th className="p-3 border-b border-slate-800 font-bold">
                                            Description
                                        </th>
                                        <th className="p-3 border-b border-slate-800 text-right font-bold">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {importPreviewData.map((t, idx) => (
                                        <tr
                                            key={idx}
                                            className="hover:bg-white/5 font-mono text-sm"
                                        >
                                            <td className="p-3 text-slate-400">
                                                {new Date(
                                                    t.date,
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="p-3 text-slate-300">
                                                {t.category}
                                            </td>
                                            <td className="p-3 text-slate-500 text-xs italic">
                                                {t.description}
                                            </td>
                                            <td className="p-3 text-right text-rose-400 font-bold">
                                                ₹{t.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-amber-400 text-xs">
                                <AlertCircle className="w-4 h-4" />
                                <span>
                                    Verify dates and amounts before saving
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setImportPreviewData(null)}
                                    className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmImport}
                                    disabled={isImporting}
                                    className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                                >
                                    {isImporting ? (
                                        <Clock className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Check className="w-5 h-5" />
                                    )}
                                    Confirm Import
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyExpensesView;
