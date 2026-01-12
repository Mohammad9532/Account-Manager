
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env');
    process.exit(1);
}

const TransactionSchema = new mongoose.Schema({
    type: { type: String, required: true, enum: ['Money In', 'Money Out'] },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, default: Date.now },
    scope: { type: String, default: 'manager' },
    userId: { type: String, index: true }
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

// Excel Date to JS Date conversion (Excel starts Dec 30 1899)
function excelDateToJSDate(serial) {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info;
}

async function importRafeyLedger() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const filePath = path.join(process.cwd(), 'Ledger_Import_Template (2).xlsx');
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            process.exit(1);
        }

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Read as JSON with headers
        const rawData = XLSX.utils.sheet_to_json(worksheet);

        console.log(`Found ${rawData.length} rows in Excel.`);

        const transactions = [];

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];

            // Expected headers: 'Date', 'Category', 'Credit', 'Debit'
            // 'Date' might be a serial number


            // Date handling
            let baseDate;
            if (row.Date) {
                if (typeof row.Date === 'number') {
                    baseDate = excelDateToJSDate(row.Date);
                } else {
                    // Try parsing string
                    baseDate = new Date(row.Date);
                }
            } else {
                // Default to now if missing
                baseDate = new Date();
            }

            if (isNaN(baseDate.getTime())) {
                console.warn(`Skipping row ${i}: Invalid Date value: ${row.Date}`);
                continue;
            }

            // Add slight millisecond offset to preserve order
            const finalDate = new Date(baseDate.getTime() + i);

            const category = row.Category || 'Uncategorized';
            const description = `Rafey - ${category}`;

            // Handle Credit (Money In)
            if (row.Credit !== undefined && row.Credit !== null) {
                const amount = parseFloat(row.Credit);
                if (!isNaN(amount) && amount > 0) {
                    transactions.push({
                        type: 'Money In',
                        amount: amount,
                        category: category,
                        description: description,
                        date: finalDate,
                        scope: 'manager'
                    });
                }
            }

            // Handle Debit (Money Out)
            if (row.Debit !== undefined && row.Debit !== null) {
                const amount = parseFloat(row.Debit);
                if (!isNaN(amount) && amount > 0) {
                    transactions.push({
                        type: 'Money Out',
                        amount: amount, // Money Out is usually positive number in DB but type distinguishes it
                        category: category,
                        description: description,
                        date: finalDate,
                        scope: 'manager'
                    });
                }
            }
        }

        if (transactions.length > 0) {
            console.log(`Prepared ${transactions.length} transactions.`);
            try {
                const result = await Transaction.insertMany(transactions, { ordered: true });
                console.log(`Successfully imported ${result.length} transactions.`);
            } catch (err) {
                console.error('Insert Error Detail:', JSON.stringify(err, null, 2));
                // If it's a validation error on a specific item, log it
                if (err.writeErrors) {
                    err.writeErrors.forEach(e => console.error(`Write Error at index ${e.index}:`, e.errmsg));
                }
            }
        } else {

            console.log('No valid transactions found to import.');
        }

    } catch (error) {
        console.error('Import Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

importRafeyLedger();
