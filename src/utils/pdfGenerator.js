
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateStatementPDF = async ({
    title,
    subtitle,
    dateRange,
    stats,
    transactions,
    filename = 'Statement'
}) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- 1. Load Logo ---
    const logoUrl = '/bra-logo.png';
    const logoData = await new Promise((resolve) => {
        const img = new Image();
        img.src = logoUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null); // Continue without logo if fail
    });

    // --- 2. Header Design ---
    // Background Header
    doc.setFillColor(15, 23, 42); // Mint Dark (Slate-900)
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Logo & Title
    if (logoData) {
        doc.addImage(logoData, 'PNG', 14, 10, 12, 12); // Adjust size as needed
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text("BeingReal Accounts", 32, 19);
    } else {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text("BeingReal Accounts", 14, 19);
    }

    // Subtitle / Account Name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(title || 'Account Statement', 14, 35);

    // Date Range (Right Aligned)
    doc.setFontSize(10);
    doc.text(dateRange, pageWidth - 14, 35, { align: 'right' });

    // --- 3. Digital Asset Summary (Cards) ---
    // Draw stats boxes if stats provided
    let startY = 60;
    if (stats) {
        // Box 1: Credit
        doc.setDrawColor(16, 185, 129); // Green
        doc.setFillColor(240, 253, 244); // Light Green bg
        doc.roundedRect(14, 60, 55, 24, 2, 2, 'FD');
        doc.setFontSize(10);
        doc.setTextColor(21, 128, 61);
        doc.text("Total Credit", 20, 68);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`+ ${stats.credit.toLocaleString()}`, 20, 78);

        // Box 2: Debit
        doc.setDrawColor(244, 63, 94); // Red
        doc.setFillColor(255, 241, 242); // Light Red bg
        doc.roundedRect(79, 60, 55, 24, 2, 2, 'FD');
        doc.setFontSize(10);
        doc.setTextColor(190, 18, 60);
        doc.text("Total Debit", 85, 68);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`- ${stats.debit.toLocaleString()}`, 85, 78);

        // Box 3: Net Balance
        const isPositive = stats.balance >= 0;
        doc.setDrawColor(99, 102, 241); // Indigo
        doc.setFillColor(243, 244, 246); // Gray bg
        doc.roundedRect(144, 60, 55, 24, 2, 2, 'FD');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text("Net Balance", 150, 68);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        if (isPositive) {
            doc.setTextColor(22, 163, 74);
        } else {
            doc.setTextColor(220, 38, 38);
        }
        doc.text(`${Math.abs(stats.balance).toLocaleString()} ${isPositive ? 'Dr' : 'Cr'}`, 150, 78);

        startY = 95;
    }

    // --- 4. Transaction Table ---
    // Columns: Date | Category | Description | Amount (Cr/Dr)

    const tableBody = transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.category,
        t.description,
        t.type === 'CREDIT' ? t.amount.toLocaleString() : '-',
        t.type === 'DEBIT' ? t.amount.toLocaleString() : '-'
    ]);

    autoTable(doc, {
        startY: startY,
        head: [['Date', 'Category', 'Description', 'Credit', 'Debit']],
        body: tableBody,
        theme: 'striped',
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left'
        },
        styles: {
            fontSize: 10,
            cellPadding: 4,
            width: 'auto'
        },
        columnStyles: {
            0: { cellWidth: 30 }, // Date
            1: { cellWidth: 35 }, // Category
            2: { cellWidth: 'auto' }, // Desc
            3: { cellWidth: 30, halign: 'right', textColor: [22, 163, 74] }, // Credit Green
            4: { cellWidth: 30, halign: 'right', textColor: [220, 38, 38] }  // Debit Red
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        margin: { top: 20 }
    });

    // --- 5. Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated by Mint Accounts - ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, doc.internal.pageSize.height - 10, { align: 'right' });
    }

    return doc;
};
