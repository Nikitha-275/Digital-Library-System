import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../hooks/useDebounce';

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('first', 400));
    expect(result.current).toBe('first');
  });

  it('only updates after the delay has elapsed', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 400), {
      initialProps: { v: 'a' },
    });

    rerender({ v: 'b' });
    act(() => vi.advanceTimersByTime(399));
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('b');
  });

  it('restarts the timer on every change and keeps only the last value', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 400), {
      initialProps: { v: 'a' },
    });

    rerender({ v: 'ab' });
    act(() => vi.advanceTimersByTime(300));
    rerender({ v: 'abc' });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('a'); // 600ms passed but timer was restarted

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('abc');
  });

  it('uses a 400ms default delay', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebounce(v), { initialProps: { v: 1 } });
    rerender({ v: 2 });
    act(() => vi.advanceTimersByTime(399));
    expect(result.current).toBe(1);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(2);
  });

  it('cancels the pending timer on unmount', () => {
    vi.useFakeTimers();
    const { rerender, unmount } = renderHook(({ v }) => useDebounce(v, 400), {
      initialProps: { v: 'a' },
    });
    rerender({ v: 'b' });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
