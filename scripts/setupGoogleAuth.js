/**
 * One-time setup script to get a Google OAuth2 refresh token.
 * 
 * Prerequisites:
 *   1. Go to https://console.cloud.google.com/
 *   2. Create a project (or use existing)
 *   3. Enable "Google Calendar API"
 *   4. Go to Credentials → Create OAuth 2.0 Client ID
 *      - Application type: Web application
 *      - Authorized redirect URI: http://localhost:3000/auth/google/callback
 *   5. Copy the Client ID and Client Secret
 *   6. Add to your .env file:
 *        GOOGLE_CLIENT_ID=your_client_id
 *        GOOGLE_CLIENT_SECRET=your_client_secret
 *   7. Run this script:  node scripts/setupGoogleAuth.js
 *   8. Open the URL in your browser, authorize, copy the code
 *   9. Paste the code when prompted
 *   10. Copy the GOOGLE_REFRESH_TOKEN to your .env file
 */

require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('\n❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env file.');
    console.error('   Please follow the setup steps in this file\'s header comments.\n');
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'http://localhost:3000/auth/google/callback'
);

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent'
});

console.log('\n══════════════════════════════════════════════════');
console.log('  Google Calendar API — One-Time Setup');
console.log('══════════════════════════════════════════════════\n');
console.log('1. Open this URL in your browser:\n');
console.log(`   ${authUrl}\n`);
console.log('2. Sign in with your Google account and click "Allow"');
console.log('3. You will be redirected to a page — copy the "code" parameter from the URL\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Paste the authorization code here: ', async (code) => {
    try {
        const { tokens } = await oauth2Client.getToken(decodeURIComponent(code.trim()));

        console.log('\n✅ Success! Add this line to your .env file:\n');
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
        console.log('After adding it, restart your server and Google Meet links');
        console.log('will be auto-generated for every new interview! 🎉\n');
    } catch (error) {
        console.error('\n❌ Failed to get token:', error.message);
        console.error('   Make sure you copied the full authorization code.\n');
    }
    rl.close();
});
