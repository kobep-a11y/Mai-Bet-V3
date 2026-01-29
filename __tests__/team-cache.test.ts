import { cacheTeamNames, getTeamNames, getCachedTeamNames } from '@/lib/team-cache';

describe('Team Cache Service', () => {
    describe('cacheTeamNames', () => {
        it('should cache team names for an event', () => {
            const eventId = 'test-event-123';
            cacheTeamNames(eventId, 'Lakers', 'Celtics', 'lal', 'bos');


            const cached = getCachedTeamNames(eventId);
            expect(cached).toMatchObject({
                homeTeam: 'Lakers',
                awayTeam: 'Celtics',
                homeTeamId: 'lal',
                awayTeamId: 'bos',
            });
            expect(cached?.lastSeen).toBeDefined();
        });
    });

    it('should return null for non-existent events', () => {
        const cached = getCachedTeamNames('non-existent-event');
        expect(cached).toBeNull();
    });
});
