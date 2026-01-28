
import { Account } from "./models/Account";

/**
 * Calculates the balance impact for a transaction.
 * @param {Object} transaction - The transaction object
 * @returns {number} The amount to be added to the account balance
 */
export function calculateBalanceImpact(transaction) {
    const { type, amount } = transaction;
    // TRANSACTION_TYPES.CREDIT = 'Money In'
    // TRANSACTION_TYPES.DEBIT = 'Money Out'
    return (type === 'Money In') ? amount : -amount;
}

/**
 * Updates account balances based on a transaction's impact.
 * Handles primary account and optional linked account (transfers/ledger payments).
 * @param {Object} transaction - The transaction (post-save or payload)
 * @param {number} multiplier - 1 for new/add, -1 for delete/revert
 * @param {Object} session - Mongoose session for atomicity
 */
export async function updateAccountBalances(transaction, multiplier, session) {
    const { accountId, linkedAccountId, balanceImpact, type } = transaction;

    if (!accountId) return;

    // 1. Update Primary Account
    await Account.findByIdAndUpdate(
        accountId,
        { $inc: { balance: balanceImpact * multiplier } },
        { session }
    );

    // 2. Update Linked Account (if applicable)
    if (linkedAccountId) {
        const primaryAcc = await Account.findById(accountId).session(session);
        const linkedAcc = await Account.findById(linkedAccountId).session(session);

        if (primaryAcc && linkedAcc) {
            const internalTypes = ['Bank', 'Cash', 'Credit Card'];
            const isInternalTransfer = internalTypes.includes(primaryAcc.type) &&
                internalTypes.includes(linkedAcc.type);

            let linkedMultiplier = multiplier;
            if (isInternalTransfer) {
                // Internal transfers move in opposite directions
                linkedMultiplier = -multiplier;
            } else {
                // Ledger payments move in the same direction (Receivable/Payable)
                linkedMultiplier = multiplier;
            }

            await Account.findByIdAndUpdate(
                linkedAccountId,
                { $inc: { balance: balanceImpact * linkedMultiplier } },
                { session }
            );
        }
    }
}
