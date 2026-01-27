
import * as XLSX from 'xlsx';

/**
 * Normalizes dates from Excel (can be Date object, serial number, or string)
 */
export const normalizeExcelDate = (val) => {
    if (val instanceof Date && !isNaN(val)) return val;
    if (typeof val === 'number') {
        // Excel serial date to JS Date
        return new Date(Math.round((val - 25569) * 86400 * 1000));
    }
    if (typeof val === 'string') {
        const parsed = new Date(val);
        return !isNaN(parsed) ? parsed : new Date();
    }
    return new Date();
};

/**
 * Exports data to Excel
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file
 * @param {String} sheetName - Name of the worksheet
 * @param {Array} columnWidths - Optional array of {wch: number}
 */
export const exportToExcel = (data, filename, sheetName = 'Sheet1', columnWidths = []) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    if (columnWidths.length > 0) {
        worksheet['!cols'] = columnWidths;
    }

    XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};

/**
 * Parses an Excel file from an input event
 * @param {Event} e - Input change event
 * @returns {Promise<Array>} - Resolves to the parsed data array
 */
export const parseExcelFile = (e) => {
    return new Promise((resolve, reject) => {
        const file = e.target.files[0];
        if (!file) {
            resolve([]);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const bstr = event.target.result;
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                resolve(data);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
    });
};
