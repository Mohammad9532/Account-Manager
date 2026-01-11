const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const authConfig = `
# Google Auth
GOOGLE_CLIENT_ID="place_your_google_client_id_here"
GOOGLE_CLIENT_SECRET="place_your_google_client_secret_here"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change_me_to_a_random_string"
`;

try {
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf8');
        console.log('Current .env content length:', content.length);
    } else {
        console.log('.env does not exist, creating it.');
    }

    if (!content.includes('GOOGLE_CLIENT_ID')) {
        fs.appendFileSync(envPath, authConfig);
        console.log('✅ Appended Auth Config to .env');
    } else {
        console.log('⚠️ Auth Config already exists in .env');
    }

    // Verify
    const newContent = fs.readFileSync(envPath, 'utf8');
    console.log('New .env content preview:');
    console.log(newContent);

} catch (err) {
    console.error('Error updating .env:', err);
}
