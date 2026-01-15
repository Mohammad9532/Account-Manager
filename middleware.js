import middleware from "next-auth/middleware";
export default middleware;

export const config = {
    matcher: [
        "/dashboard",
        "/daily",
        "/reports",
        "/ledgers",
        "/income",
        // Add other protected routes here
    ]
};
