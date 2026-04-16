import { RoomService } from './room.service';

describe('RoomService', () => {
  let service: RoomService;

  beforeAll(() => {
    service = new RoomService(null as any);
  });

  describe('getRoomId', () => {
    it('should return correct room ID format', () => {
      expect(service.getRoomId('rel_123')).toBe('relationship:rel_123');
    });

    it('should handle CUID format', () => {
      expect(service.getRoomId('clx123abc456')).toBe(
        'relationship:clx123abc456',
      );
    });
  });
});
