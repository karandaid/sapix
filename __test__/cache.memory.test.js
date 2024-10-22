// __test__/cache.memory.test.mjs
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import Cache from '../lib/utils/cache.mjs';

describe('Cache Class', () => {
  let cache;

  beforeEach(() => {
    jest.useFakeTimers();
    // Initialize a new Cache instance before each test
    cache = new Cache({ cleanupInterval: 1000, maxSize: 3 }); // 1 second cleanup for tests
  });

  afterEach(() => {
    // Clean up after each test
    cache.stop();
    // No need to run pending timers here as we've already advanced the timers in tests
    jest.useRealTimers();
  });

  test('should set and get a key without TTL', () => {
    cache.set('key1', 'value1');
    const value = cache.get('key1');
    expect(value).toBe('value1');
  });

  test('should return undefined for non-existent keys', () => {
    const value = cache.get('nonExistentKey');
    expect(value).toBeUndefined();
  });

  test('should delete a key', () => {
    cache.set('key2', 'value2');
    const deleted = cache.delete('key2');
    expect(deleted).toBe(true);
    expect(cache.get('key2')).toBeUndefined();
  });

  test('should return false when deleting a non-existent key', () => {
    const deleted = cache.delete('nonExistentKey');
    expect(deleted).toBe(false);
  });

  test('should clear all keys', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBeUndefined();
    expect(cache.size()).toBe(0);
  });

  test('should handle TTL expiration', () => {
    cache.set('key3', 'value3', 5000); // 5 seconds TTL
    expect(cache.get('key3')).toBe('value3');

    // Fast-forward time by 5 seconds
    jest.advanceTimersByTime(5000);

    // Run pending timers (for TTL)
    // No need to call jest.runOnlyPendingTimers() here

    expect(cache.get('key3')).toBeUndefined();
  });

  test('should emit "expired" event upon TTL expiration', () => {
    const expiredCallback = jest.fn();
    cache.on('expired', expiredCallback);

    cache.set('key4', 'value4', 3000); // 3 seconds TTL

    // Fast-forward time by 3 seconds
    jest.advanceTimersByTime(3000);

    // Run pending timers
    // No need to call jest.runOnlyPendingTimers() here

    expect(expiredCallback).toHaveBeenCalledWith('key4', 'value4');
  });

  test('should evict least recently used item when maxSize is reached', () => {
    const evictCallback = jest.fn();
    cache.on('evict', evictCallback);

    cache.set('A', 'Value A');
    cache.set('B', 'Value B');
    cache.set('C', 'Value C');

    // Access 'A' to make it recently used
    cache.get('A');

    // Add 'D', should evict 'B' as it's the LRU
    cache.set('D', 'Value D');

    expect(cache.get('A')).toBe('Value A');
    expect(cache.get('B')).toBeUndefined();
    expect(cache.get('C')).toBe('Value C');
    expect(cache.get('D')).toBe('Value D');

    expect(evictCallback).toHaveBeenCalledWith('B', 'Value B');
  });

  test('should emit "evict" event upon eviction', () => {
    const evictCallback = jest.fn();
    cache.on('evict', evictCallback);

    cache.set('A', 'Value A');
    cache.set('B', 'Value B');
    cache.set('C', 'Value C');

    // Add 'D', should evict 'A' (since 'A' was not recently accessed)
    cache.set('D', 'Value D');

    expect(evictCallback).toHaveBeenCalledWith('A', 'Value A');
  });

  test('should update key position on get for LRU', () => {
    cache.set('A', 'Value A');
    cache.set('B', 'Value B');
    cache.set('C', 'Value C');

    // Access 'A' to make it recently used
    cache.get('A');

    // Add 'D', should evict 'B' as it's now the LRU
    cache.set('D', 'Value D');

    expect(cache.get('A')).toBe('Value A');
    expect(cache.get('B')).toBeUndefined();
    expect(cache.get('C')).toBe('Value C');
    expect(cache.get('D')).toBe('Value D');
  });

  test('should emit "set" event upon setting a key', () => {
    const setCallback = jest.fn();
    cache.on('set', setCallback);

    cache.set('key5', 'value5');
    expect(setCallback).toHaveBeenCalledWith('key5', 'value5');
  });

  test('should emit "get" event upon retrieving a key', () => {
    const getCallback = jest.fn();
    cache.on('get', getCallback);

    cache.set('key6', 'value6');
    const value = cache.get('key6');
    expect(value).toBe('value6');
    expect(getCallback).toHaveBeenCalledWith('key6', 'value6');
  });

  test('should emit "delete" event upon deleting a key', () => {
    const deleteCallback = jest.fn();
    cache.on('delete', deleteCallback);

    cache.set('key7', 'value7');
    cache.delete('key7');

    expect(deleteCallback).toHaveBeenCalledWith('key7', 'value7');
  });

  test('should handle multiple keys with and without TTL', () => {
    const expiredCallback = jest.fn();
    cache.on('expired', expiredCallback);

    cache.set('key8', 'value8', 2000); // Expires in 2 seconds
    cache.set('key9', 'value9', null); // No expiration
    cache.set('key10', 'value10', 4000); // Expires in 4 seconds

    // Fast-forward time by 3 seconds
    jest.advanceTimersByTime(3000);
    // No need to run pending timers

    expect(cache.get('key8')).toBeUndefined();
    expect(cache.get('key9')).toBe('value9');
    expect(cache.get('key10')).toBe('value10');

    expect(expiredCallback).toHaveBeenCalledWith('key8', 'value8');
    expect(expiredCallback).not.toHaveBeenCalledWith('key10', 'value10');
  });

  test('should not exceed maxSize after multiple evictions', () => {
    const evictCallback = jest.fn();
    cache.on('evict', evictCallback);

    cache.set('A', 'Value A');
    cache.set('B', 'Value B');
    cache.set('C', 'Value C');
    cache.set('D', 'Value D'); // Evicts 'A'
    cache.set('E', 'Value E'); // Evicts 'B'
    cache.set('F', 'Value F'); // Evicts 'C'

    expect(cache.size()).toBe(3);
    expect(cache.get('A')).toBeUndefined();
    expect(cache.get('B')).toBeUndefined();
    expect(cache.get('C')).toBeUndefined();
    expect(cache.get('D')).toBe('Value D');
    expect(cache.get('E')).toBe('Value E');
    expect(cache.get('F')).toBe('Value F');

    expect(evictCallback).toHaveBeenCalledTimes(3);
    expect(evictCallback).toHaveBeenNthCalledWith(1, 'A', 'Value A');
    expect(evictCallback).toHaveBeenNthCalledWith(2, 'B', 'Value B');
    expect(evictCallback).toHaveBeenNthCalledWith(3, 'C', 'Value C');
  });

  test('should handle setting the same key multiple times', () => {
    const setCallback = jest.fn();
    cache.on('set', setCallback);

    cache.set('key11', 'value11');
    cache.set('key11', 'value12'); // Overwrite

    expect(cache.get('key11')).toBe('value12');
    expect(setCallback).toHaveBeenCalledTimes(2);
    expect(setCallback).toHaveBeenNthCalledWith(1, 'key11', 'value11');
    expect(setCallback).toHaveBeenNthCalledWith(2, 'key11', 'value12');
  });

  test('should not emit "expired" event if key is deleted before TTL', () => {
    const expiredCallback = jest.fn();
    cache.on('expired', expiredCallback);

    cache.set('key12', 'value12', 3000);
    cache.delete('key12');

    // Fast-forward time by 3 seconds
    jest.advanceTimersByTime(3000);
    // No need to run pending timers

    expect(expiredCallback).not.toHaveBeenCalled();
  });

  test('should handle multiple TTL expirations correctly', () => {
    const expiredCallback = jest.fn();
    cache.on('expired', expiredCallback);

    cache.set('key13', 'value13', 1000); // Expires in 1 second
    cache.set('key14', 'value14', 2000); // Expires in 2 seconds
    cache.set('key15', 'value15', 3000); // Expires in 3 seconds

    // Fast-forward time by 1.5 seconds
    jest.advanceTimersByTime(1500);

    expect(cache.get('key13')).toBeUndefined();
    expect(cache.get('key14')).toBe('value14'); // Should still be present
    expect(cache.get('key15')).toBe('value15');
    expect(expiredCallback).toHaveBeenCalledWith('key13', 'value13');

    // Fast-forward time by another 1 second (total 2.5 seconds)
    jest.advanceTimersByTime(1000);

    expect(cache.get('key14')).toBeUndefined();
    expect(cache.get('key15')).toBe('value15');
    expect(expiredCallback).toHaveBeenCalledWith('key14', 'value14');

    // Fast-forward time by another 1 second (total 3.5 seconds)
    jest.advanceTimersByTime(1000);

    expect(cache.get('key15')).toBeUndefined();
    expect(expiredCallback).toHaveBeenCalledWith('key15', 'value15');

    expect(expiredCallback).toHaveBeenCalledTimes(3);
  });

  test('should not evict items prematurely', () => {
    const evictCallback = jest.fn();
    cache.on('evict', evictCallback);

    cache.set('A', 'Value A');
    cache.set('B', 'Value B');
    cache.set('C', 'Value C');

    // Access 'A' to make it recently used
    cache.get('A');

    // Add 'D', should evict 'B'
    cache.set('D', 'Value D');

    // Add 'E', should evict 'C'
    cache.set('E', 'Value E');

    expect(cache.get('A')).toBe('Value A');
    expect(cache.get('B')).toBeUndefined();
    expect(cache.get('C')).toBeUndefined();
    expect(cache.get('D')).toBe('Value D');
    expect(cache.get('E')).toBe('Value E');

    expect(evictCallback).toHaveBeenCalledTimes(2);
    expect(evictCallback).toHaveBeenNthCalledWith(1, 'B', 'Value B');
    expect(evictCallback).toHaveBeenNthCalledWith(2, 'C', 'Value C');
  });
});
