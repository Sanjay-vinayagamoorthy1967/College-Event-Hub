const { parseDateTime } = require('./eventStatusHelper');

describe('parseDateTime', () => {
  it('should parse 12-hour AM time correctly', () => {
    // 2026-07-17T18:30:00Z in UTC is July 18, 00:00 IST
    const baseDate = new Date('2026-07-17T18:30:00Z');
    const result = parseDateTime(baseDate, '10:30 AM');
    
    // Expected: July 18, 10:30 IST
    // UTC offset is -5:30. 10:30 - 5:30 = 05:00 UTC. July 18, 05:00 UTC.
    expect(result.toISOString()).toBe('2026-07-18T05:00:00.000Z');
  });

  it('should parse 12-hour PM time correctly', () => {
    const baseDate = new Date('2026-07-17T18:30:00Z');
    const result = parseDateTime(baseDate, '02:30 PM');
    
    // Expected: July 18, 14:30 IST.
    // UTC = 14:30 - 5:30 = 09:00 UTC. July 18, 09:00 UTC.
    expect(result.toISOString()).toBe('2026-07-18T09:00:00.000Z');
  });

  it('should parse 24-hour time correctly', () => {
    const baseDate = new Date('2026-07-17T18:30:00Z');
    const result = parseDateTime(baseDate, '14:30');
    
    // Expected: July 18, 14:30 IST. 
    expect(result.toISOString()).toBe('2026-07-18T09:00:00.000Z');
  });

  it('should handle hour underflow (rolls back to previous UTC day)', () => {
    const baseDate = new Date('2026-07-17T18:30:00Z');
    const result = parseDateTime(baseDate, '01:00 AM');
    
    // Expected: July 18, 01:00 IST.
    // UTC = 01:00 - 5:30 = July 17, 19:30 UTC.
    expect(result.toISOString()).toBe('2026-07-17T19:30:00.000Z');
  });

  it('should handle 12:00 AM correctly (midnight)', () => {
    const baseDate = new Date('2026-07-17T18:30:00Z');
    const result = parseDateTime(baseDate, '12:00 AM');
    
    // Expected: July 18, 00:00 IST.
    // UTC = 00:00 - 5:30 = July 17, 18:30 UTC.
    expect(result.toISOString()).toBe('2026-07-17T18:30:00.000Z');
  });

  it('should handle 12:00 PM correctly (noon)', () => {
    const baseDate = new Date('2026-07-17T18:30:00Z');
    const result = parseDateTime(baseDate, '12:30 PM');
    
    // Expected: July 18, 12:30 IST.
    // UTC = 12:30 - 5:30 = 07:00 UTC. July 18, 07:00 UTC.
    expect(result.toISOString()).toBe('2026-07-18T07:00:00.000Z');
  });

  it('should return null if baseDate is missing', () => {
    expect(parseDateTime(null, '10:00 AM')).toBeNull();
  });

  it('should return null if timeStr is missing', () => {
    const baseDate = new Date('2026-07-17T18:30:00Z');
    expect(parseDateTime(baseDate, null)).toBeNull();
    expect(parseDateTime(baseDate, '')).toBeNull();
  });
});
