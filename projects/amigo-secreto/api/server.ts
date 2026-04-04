import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ParticipantRepository } from '../src/repositories/participant';
import { DrawShuffler } from '../src/services/draw-shuffler';

const fastify = Fastify({ logger: true });
const repo = new ParticipantRepository();
const restrictions = new Map<string, string[]>();

fastify.register(cors);

fastify.get('/api/participants', async () => repo.getAll());
fastify.post('/api/participants', async (request: any) => {
    const { name, email } = request.body;
    const p = { id: Math.random().toString(36).substr(2, 9), name, email };
    repo.add(p);
    return p;
});
fastify.delete('/api/participants/:id', async (request: any) => {
    const { id } = request.params;
    const all = repo.getAll().filter(p => p.id !== id);
    repo.clear();
    all.forEach(p => repo.add(p));
    return { ok: true };
});
fastify.post('/api/draw', async () => {
    try {
        const results = DrawShuffler.performDraw(repo.getAll(), restrictions);
        return results;
    } catch (err: any) {
        return { error: err.message };
    }
});

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3333);

fastify.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) process.exit(1);
  console.log(`API running on http://localhost:${port}`);
});
