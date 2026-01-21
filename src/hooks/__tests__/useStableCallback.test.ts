/**
 * useStableCallback Hook 测试
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStableCallback } from '../useStableCallback';

describe('useStableCallback', () => {
  it('应保持函数引用稳定', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useStableCallback(() => value),
      { initialProps: { value: 1 } }
    );

    const first = result.current;
    expect(first()).toBe(1);

    rerender({ value: 2 });
    const second = result.current;

    expect(second).toBe(first);
    expect(second()).toBe(2);
  });

  it('应正确传递参数', () => {
    const { result } = renderHook(() => useStableCallback((a: number, b: number) => a + b));
    expect(result.current(2, 3)).toBe(5);
  });

  it('应执行最新回调逻辑', () => {
    const { result, rerender } = renderHook(
      ({ multiplier }) =>
        useStableCallback((value: number) => {
          return value * multiplier;
        }),
      { initialProps: { multiplier: 2 } }
    );

    const handler = result.current;
    expect(handler(3)).toBe(6);

    act(() => {
      rerender({ multiplier: 4 });
    });

    expect(handler(3)).toBe(12);
  });
});
