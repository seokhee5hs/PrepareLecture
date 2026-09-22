import type { IncomingMessage, ServerResponse } from 'http';
import { generateQuizQuestionsAI, generateQaAnswerDraftAI } from './geminiService.ts';

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

export function registerApiRoutes(server: any) {
  server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/')) {
      return next();
    }

    res.setHeader('Content-Type', 'application/json');

    try {
      if (req.url === '/api/gemini/quiz' && req.method === 'POST') {
        const body = await readBody(req);
        const questions = await generateQuizQuestionsAI({
          courseName: body.courseName || '전공 강좌',
          department: body.department || '소프트웨어융합학부',
          topic: body.topic || '기본 개념',
          weekNumber: Number(body.weekNumber) || 1,
          count: Number(body.count) || 3,
        });
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, questions }));
        return;
      }

      if (req.url === '/api/gemini/qa-draft' && req.method === 'POST') {
        const body = await readBody(req);
        const draft = await generateQaAnswerDraftAI({
          courseName: body.courseName || '전공 강좌',
          studentQuestionTitle: body.studentQuestionTitle || '',
          studentQuestionContent: body.studentQuestionContent || '',
          studentName: body.studentName || '학생',
          weekNumber: body.weekNumber,
        });
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, draft }));
        return;
      }

      if (req.url === '/api/health') {
        res.statusCode = 200;
        res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
        return;
      }

      next();
    } catch (err: any) {
      console.error('API Error:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
    }
  });
}
