import { getServerSession } from "next-auth";
// authOptions removed as it is not used in checkLedgerAccess
import { LedgerAccess } from "./models/LedgerAccess";
import { Account } from "./models/Account";
import dbConnect from "@/lib/db";

/**
 * Checks if the current user has access to the specified ledger with the required role.
 * @param {string} ledgerId - The ID of the ledger (Account).
 * @param {string|object} userIdentifier - The ID or Email of the user, or object { id, email }.
 * @param {string} requiredRole - Minimum role required ('viewer', 'editor', 'owner').
 * @returns {Promise<{ hasAccess: boolean, role: string, error?: string }>}
 */
export async function checkLedgerAccess(ledgerId, userIdentifier, requiredRole = 'viewer') {
    try {
        await dbConnect(); // Ensure DB connection

        if (!userIdentifier || !ledgerId) {
            return { hasAccess: false, error: "Missing user identifier or ledgerId" };
        }

        let userId = null;
        let userEmail = null;

        if (typeof userIdentifier === 'object') {
            userId = userIdentifier.id;
            userEmail = userIdentifier.email;
        } else {
            // Fallback assumption: if string contains '@', it's email, else ID.
            if (String(userIdentifier).includes('@')) {
                userEmail = userIdentifier;
            } else {
                userId = userIdentifier;
            }
        }

        // 1. Check if user is the Owner (stored in Account model by ID)
        const account = await Account.findById(ledgerId);
        if (!account) {
            return { hasAccess: false, error: "Ledger not found" };
        }

        if (userId && account.userId === userId) {
            return { hasAccess: true, role: 'owner' };
        }

        // 2. Check LedgerAccess table (stored by Email usually, or ID if changed)
        // We check BOTH matches if we have them.
        const query = { ledgerId };
        const OR = [];
        if (userId) OR.push({ userId: userId });
        if (userEmail) OR.push({ userId: userEmail });

        if (OR.length > 0) {
            query.$or = OR;
        } else {
            return { hasAccess: false, error: "Invalid user identifier" };
        }

        const access = await LedgerAccess.findOne(query);

        if (!access) {
            return { hasAccess: false, error: "Access denied" };
        }

        // 3. specific role checks
        const roleHierarchy = {
            'viewer': 1,
            'editor': 2,
            'owner': 3
        };

        const userLevel = roleHierarchy[access.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        if (userLevel >= requiredLevel) {
            return { hasAccess: true, role: access.role };
        } else {
            return { hasAccess: false, error: "Insufficient permissions" };
        }

    } catch (error) {
        console.error("Error checking ledger access:", error);
        return { hasAccess: false, error: "Internal server error" };
    }
}
