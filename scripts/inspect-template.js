
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const filePath = path.join(process.cwd(), 'Ledger_Import_Template (2).xlsx');

console.log('Reading file from:', filePath);

if (!fs.existsSync(filePath)) {
    console.error('File not found!');
    process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Read headers (first row)
const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];

console.log('Sheet Name:', sheetName);
console.log('Headers:', headers);

// Read first few rows to see data format
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }).slice(1, 4);
console.log('Sample Data:', data);
