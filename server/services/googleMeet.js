const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/auth/google/callback'
);

// Set credentials from stored refresh token
if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
}

/**
 * Creates a Google Calendar event with an auto-generated Google Meet link.
 * Each call produces a unique Meet room — no two interviews share a link.
 */
async function createGoogleMeetLink(topic, scheduledAt, durationMinutes = 30) {
    try {
        if (!process.env.GOOGLE_REFRESH_TOKEN) {
            console.warn('Google Meet: No GOOGLE_REFRESH_TOKEN configured. Skipping Meet link generation.');
            return '';
        }

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const startTime = new Date(scheduledAt);
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

        const event = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1,
            requestBody: {
                summary: `ANITS Connect: ${topic}`,
                description: 'Auto-generated mock interview meeting via ANITS Connect platform.',
                start: { dateTime: startTime.toISOString() },
                end: { dateTime: endTime.toISOString() },
                conferenceData: {
                    createRequest: {
                        requestId: `anits-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                },
            },
        });

        const meetLink = event.data.conferenceData?.entryPoints?.find(
            e => e.entryPointType === 'video'
        )?.uri;

        if (meetLink) {
            console.log(`✓ Google Meet link created: ${meetLink}`);
        }

        return meetLink || '';
    } catch (error) {
        console.error('Failed to create Google Meet link:', error.message);
        return '';
    }
}

module.exports = { createGoogleMeetLink, oauth2Client };
