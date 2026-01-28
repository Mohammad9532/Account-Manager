import middleware from "next-auth/middleware";
export default middleware;

export const config = {
    matcher: [
        "/dashboard",
        "/dailyexpense",
        "/reports",
        "/ledgers",
        "/income",
        "/currency-dealers",
        // Add other protected routes here
    ]
};
