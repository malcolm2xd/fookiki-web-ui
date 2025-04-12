"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMatchmaking = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Initialize admin with project credentials
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: 'https://fookiki-d89b5-default-rtdb.firebaseio.com',
        projectId: 'fookiki-d89b5'
    });
}
exports.handleMatchmaking = functions.database.ref('/matchmaking/{requestId}')
    .onCreate(async (snapshot, context) => {
    console.log('\n\n🚀 NEW MATCHMAKING REQUEST 🚀');
    console.log('Request ID:', context.params.requestId);
    const request = snapshot.val();
    // Validate request
    if (!request) {
        console.error('❌ Invalid or empty matchmaking request');
        return null;
    }
    console.log('Full Request Details:', JSON.stringify(request, null, 2));
    const { uid, phoneNumber, preferences } = request;
    // Validate required fields
    if (!uid) {
        console.error('❌ Missing user ID in matchmaking request');
        return null;
    }
    if (!preferences || !preferences.mode) {
        console.error('❌ Missing or invalid preferences in matchmaking request');
        return null;
    }
    try {
        console.log('📑 Request details:', request);
        const db = admin.database();
        const matchmakingRef = db.ref('matchmaking');
        console.log('🔍 Searching for matching requests...');
        // Get recent requests and log them
        console.log('📅 Fetching last 10 requests...');
        const snapshot = await matchmakingRef
            .orderByChild('timestamp')
            .limitToLast(10)
            .once('value');
        // Convert snapshot to array for easier processing
        const requests = [];
        console.log('📊 Detailed Queue Analysis:');
        console.log('Total requests in snapshot:', snapshot.numChildren());
        let totalRequests = 0;
        let matchedRequests = 0;
        let sameUserRequests = 0;
        snapshot.forEach((childSnapshot) => {
            const otherRequest = childSnapshot.val();
            const snapshotKey = childSnapshot.key;
            totalRequests++;
            if (snapshotKey === context.params.requestId) {
                console.log(`❌ Skipping ${snapshotKey}: This is the current request`);
                return false;
            }
            if (otherRequest.matched) {
                matchedRequests++;
                console.log(`❌ Skipping ${snapshotKey}: Already matched`);
                return false;
            }
            if (otherRequest.uid === uid) {
                sameUserRequests++;
                console.log(`❌ Skipping ${snapshotKey}: Same user (${otherRequest.uid})`);
                return false;
            }
            if (snapshotKey) {
                requests.push([snapshotKey, otherRequest]);
                console.log(`✅ Added ${snapshotKey} to potential matches`);
            }
            return false;
        });
        console.log('📊 Matchmaking Queue Summary:');
        console.log('- Total requests:', totalRequests);
        console.log('- Matched requests:', matchedRequests);
        console.log('- Same user requests:', sameUserRequests);
        console.log('- Potential matches:', requests.length);
        let matchedRequest;
        // Sort by timestamp to get the oldest unmatched request first (FIFO)
        requests.sort((a, b) => a[1].timestamp - b[1].timestamp);
        console.log('🕰 Requests sorted by timestamp (oldest first)');
        console.log('📝 Current requests in queue:');
        for (const [snapshotKey, otherRequest] of requests) {
            console.log(`Request ${snapshotKey}:`, {
                uid: otherRequest.uid,
                timestamp: new Date(otherRequest.timestamp).toISOString(),
                matched: otherRequest.matched,
                preferences: otherRequest.preferences
            });
        }
        console.log('📃 Found', requests.length, 'potential matches to check');
        // Find the first matching request
        for (const [snapshotKey, otherRequest] of requests) {
            // Check age and same user constraints
            const requestAge = Date.now() - otherRequest.timestamp;
            if (otherRequest.uid === uid) {
                console.log(`❌ Skipping ${snapshotKey}: Same user (${otherRequest.uid})`);
                continue;
            }
            if (requestAge > 30000) {
                console.log(`❌ Skipping ${snapshotKey}: Too old (${requestAge}ms > 30000ms)`);
                continue;
            }
            console.log(`
🔍 Checking match potential for ${snapshotKey}:`);
            console.log('Current request preferences:', request.preferences);
            console.log('Other request preferences:', otherRequest.preferences);
            // Detailed preference matching
            console.log('\n🧩 Detailed Preference Matching:');
            console.log('Current Request Preferences:', JSON.stringify(request.preferences, null, 2));
            console.log('Other Request Preferences:', JSON.stringify(otherRequest.preferences, null, 2));
            const modeMatch = otherRequest.preferences.mode === request.preferences.mode;
            const durationMatch = !request.preferences.duration ||
                otherRequest.preferences.duration === request.preferences.duration;
            const goalMatch = !request.preferences.goalTarget ||
                otherRequest.preferences.goalTarget === request.preferences.goalTarget;
            console.log('Preference Match Breakdown:');
            console.log('- Mode Match:', modeMatch);
            console.log('- Duration Match:', durationMatch);
            console.log('- Goal Match:', goalMatch);
            const prefsMatch = modeMatch && durationMatch && goalMatch;
            console.log(prefsMatch ? '✅ FULL MATCH FOUND!' : '❌ Preferences do not fully match');
            if (prefsMatch) {
                console.log('✅ All preferences match!');
                console.log('🎯 Found matching request:', snapshotKey);
                matchedRequest = {
                    request: otherRequest,
                    id: snapshotKey
                };
                break;
            }
            else {
                console.log('❌ Preferences do not match, continuing search...');
            }
        }
        if (matchedRequest) {
            console.log('✅ Found matching request:', matchedRequest);
            console.log('🎮 Creating new game room...');
            // Create a game room
            const gameRoomRef = admin.firestore().collection('gameRooms').doc();
            // Clean up settings object
            const settings = {
                mode: preferences.mode
            };
            if (preferences.duration !== undefined) {
                settings.duration = preferences.duration;
            }
            if (preferences.goalTarget !== undefined) {
                settings.goalTarget = preferences.goalTarget;
            }
            // Remove any undefined values from settings
            Object.keys(settings).forEach(key => {
                if (settings[key] === undefined) {
                    delete settings[key];
                }
            });
            console.log('📝 Creating game room with ID:', gameRoomRef.id);
            await gameRoomRef.set({
                id: gameRoomRef.id,
                status: 'waiting',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                settings,
                players: {
                    [uid]: {
                        phoneNumber,
                        ready: false,
                        score: 0
                    },
                    [matchedRequest.request.uid]: {
                        phoneNumber: matchedRequest.request.phoneNumber,
                        ready: false,
                        score: 0
                    }
                },
                gameState: {
                    currentTurn: uid,
                    board: JSON.stringify(Array(8).fill(null).map(() => Array(8).fill(null))),
                    lastMove: null,
                    timestamp: Date.now()
                }
            });
            // Mark both requests as matched first
            const matchingUpdates = {
                [`matchmaking/${context.params.requestId}/matched`]: true,
                [`matchmaking/${matchedRequest.id}/matched`]: true
            };
            console.log('🔄 Marking requests as matched...');
            await db.ref().update(matchingUpdates);
            // Update both players' match status and clean up matchmaking entries
            const updates = {
                [`matches/${uid}`]: { roomId: gameRoomRef.id, timestamp: Date.now() },
                [`matches/${matchedRequest.request.uid}`]: { roomId: gameRoomRef.id, timestamp: Date.now() }
            };
            console.log('💬 Notifying players and cleaning up matchmaking entries...');
            await db.ref().update(updates);
            console.log('✨ Matchmaking complete! Room', gameRoomRef.id, 'is ready');
            // Clean up matchmaking entries after a delay to ensure clients have received the match
            setTimeout(async () => {
                try {
                    // Clean up both requests
                    await Promise.all([
                        db.ref(`matchmaking/${context.params.requestId}`).set(null),
                        db.ref(`matchmaking/${matchedRequest.id}`).set(null)
                    ]);
                    console.log('🧹 Cleaned up matchmaking entries');
                }
                catch (error) {
                    console.error('❌ Error cleaning up matchmaking entries:', error);
                }
            }, 5000);
            return gameRoomRef.id;
        }
        else {
            console.log('❌ No matching request found');
            return null;
        }
    }
    catch (error) {
        console.error('❌ Matchmaking error:', error);
        console.error('Full error details:', JSON.stringify(error));
        return null;
    }
});
//# sourceMappingURL=matchmaking.js.map