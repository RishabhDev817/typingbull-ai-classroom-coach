/**
 * Standalone Production-Ready Classroom Server for TypingBull
 * Phase 1: Real-Time In-Memory Classroom Experience
 *
 * Can be run with:
 *   node --experimental-strip-types server/standaloneClassroom.ts
 */

import http from 'node:http';
import { ClassroomServer } from './classroom/ClassroomServer.ts';
import { handleClassroomDebrief } from './classroomDebrief.ts';
import { handleAdaptiveDrill } from './classroomAdaptiveDrill.ts';
import { handleStudentCoach } from './classroomStudentCoach.ts';
import type { ClassroomDebriefRequest, AdaptiveDrillRequest, ClassroomStudentCoachRequest } from './classroom/types.ts';

const PORT = Number(process.env.PORT || process.env.CLASSROOM_PORT || 3002);

const httpServer = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'typingbull-classroom-server',
        uptime: process.uptime(),
      })
    );
    return;
  }

  if (req.url === '/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        activeRooms: classroomServer.manager.getRoomCount(),
      })
    );
    return;
  }

  if (req.url === '/api/classroom/debrief' && req.method === 'POST') {
    let rawBody = '';
    req.on('data', (chunk: Buffer) => {
      rawBody += chunk.toString();
    });
    req.on('end', async () => {
      res.setHeader('Content-Type', 'application/json');
      try {
        const body: ClassroomDebriefRequest = JSON.parse(rawBody || '{}');
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Missing GEMINI_API_KEY', message: 'GEMINI_API_KEY not configured.' }));
          return;
        }
        const debrief = await handleClassroomDebrief(body, apiKey);
        res.writeHead(200);
        res.end(JSON.stringify(debrief));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: errorMsg, message: 'Failed to generate classroom debrief report.' }));
      }
    });
    return;
  }

  if (req.url === '/api/classroom/adaptive-drill' && req.method === 'POST') {
    let rawBody = '';
    req.on('data', (chunk: Buffer) => {
      rawBody += chunk.toString();
    });
    req.on('end', async () => {
      res.setHeader('Content-Type', 'application/json');
      try {
        const body: AdaptiveDrillRequest = JSON.parse(rawBody || '{}');
        const apiKey = process.env.GEMINI_API_KEY;
        const drill = await handleAdaptiveDrill(body, apiKey);
        res.writeHead(200);
        res.end(JSON.stringify(drill));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: errorMsg, message: 'Failed to synthesize adaptive drill.' }));
      }
    });
    return;
  }

  if (req.url === '/api/classroom/student-coach' && req.method === 'POST') {
    let rawBody = '';
    req.on('data', (chunk: Buffer) => {
      rawBody += chunk.toString();
    });
    req.on('end', async () => {
      res.setHeader('Content-Type', 'application/json');
      try {
        const body: ClassroomStudentCoachRequest = JSON.parse(rawBody || '{}');
        const apiKey = process.env.GEMINI_API_KEY;
        const coach = await handleStudentCoach(body, apiKey);
        res.writeHead(200);
        res.end(JSON.stringify(coach));
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: errorMsg, message: 'Failed to generate student coach feedback.' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

const classroomServer = new ClassroomServer({
  server: httpServer,
  path: '/classroom-ws',
});

httpServer.listen(PORT, () => {
  console.log(`[Classroom Standalone] HTTP & WebSocket Server listening on http://localhost:${PORT}`);
  console.log(`[Classroom Standalone] WebSocket path: ws://localhost:${PORT}/classroom-ws`);
});
