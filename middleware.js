import middleware from "next-auth/middleware";
export default middleware;

export const config = {
    matcher: [
        "/",
        "/daily",
        "/reports",
        // Add other protected routes here
    ]
};
