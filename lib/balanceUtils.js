
import { Account } from "./models/Account";

/**
 * Calculates the balance impact for a transaction.
 * @param {Object} transaction - The transaction object
 * @returns {number} The amount to be added to the account balance (in cents/paise)
 */
export function calculateBalanceImpact(transaction) {
    const { type, amount } = transaction;
    // CRITICAL: Ensure we are dealing with integers (cents)
    const amountInCents = Math.round(parseFloat(amount));
    return (type === 'Money In') ? amountInCents : -amountInCents;
}

/**
 * Updates account balances based on a transaction's impact.
 * Handles primary account and optional linked account (transfers/ledger payments).
 * @param {Object} transaction - The transaction (post-save or payload)
 * @param {number} multiplier - 1 for new/add, -1 for delete/revert
 * @param {Object} session - Mongoose session for atomicity
 * @param {string} userId - The owner of the accounts (Security Fix)
 */
export async function updateAccountBalances(transaction, multiplier, session, userId) {
    const { accountId, linkedAccountId, balanceImpact } = transaction;

    if (!accountId) return;

    // 1. Update Primary Account (with Security Check)
    const primaryResult = await Account.findOneAndUpdate(
        { _id: accountId, userId: userId },
        { $inc: { balance: balanceImpact * multiplier } },
        { session, new: true }
    );

    if (!primaryResult) {
        throw new Error("Primary account not found or unauthorized access.");
    }

    // 2. Update Linked Account (if applicable)
    if (linkedAccountId) {
        const linkedAcc = await Account.findOne({ _id: linkedAccountId, userId }).session(session);

        if (!linkedAcc) {
            throw new Error("Linked account not found or unauthorized access.");
        }

        const internalTypes = ['Bank', 'Cash', 'Credit Card'];
        const isInternalTransfer = internalTypes.includes(primaryResult.type) &&
            internalTypes.includes(linkedAcc.type);

        let linkedMultiplier = multiplier;
        if (isInternalTransfer) {
            // Internal transfers move in opposite directions
            linkedMultiplier = -multiplier;
        } else {
            // Ledger payments move in the same direction (Receivable/Payable)
            linkedMultiplier = multiplier;
        }

        await Account.findOneAndUpdate(
            { _id: linkedAccountId, userId },
            { $inc: { balance: balanceImpact * linkedMultiplier } },
            { session }
        );
    }
}

