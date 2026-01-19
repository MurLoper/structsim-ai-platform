import { useRef, useLayoutEffect, useCallback } from 'react';

/**
 * 创建一个引用稳定但总是执行最新逻辑的回调函数
 *
 * ⚠️ 注意：React 19.2 已经提供了官方的 useEffectEvent Hook
 * 如果你的项目使用 React 19.2+，建议使用官方的 useEffectEvent
 *
 * 官方 useEffectEvent 的限制：
 * - 只能在 useEffect/useLayoutEffect/useInsertionEffect 内部调用
 * - 不能传递给其他组件或 Hook
 * - 主要用于 Effect 中的事件处理
 *
 * useStableCallback 的优势：
 * - 可以在任何地方调用（不限于 Effect）
 * - 可以传递给子组件作为 props
 * - 适用于表单提交、事件处理等场景
 *
 * @example
 * ```typescript
 * // ✅ useStableCallback - 适用于任何场景
 * const handleSubmit = useStableCallback(() => {
 *   console.log(formData); // 总是最新值
 * });
 *
 * // ✅ useEffectEvent - 仅用于 Effect 内部
 * const onConnected = useEffectEvent(() => {
 *   showNotification('Connected!', theme);
 * });
 * useEffect(() => {
 *   connection.on('connected', onConnected);
 * }, [roomId]);
 * ```
 *
 * @param callback - 要稳定化的回调函数
 * @returns 引用稳定的回调函数
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  // 使用 ref 保存最新的回调函数
  const callbackRef = useRef(callback);

  // 使用 useLayoutEffect 而不是 useEffect
  // 确保在浏览器绘制前同步更新 ref，避免竞态条件
  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  // 返回一个稳定的函数引用
  // 这个函数内部总是调用最新的 callback
  return useCallback(
    ((...args) => {
      // 调用最新的回调函数
      return callbackRef.current(...args);
    }) as T,
    [] // 空依赖数组，函数引用永远不变
  );
}

/**
 * 使用示例集合（注释形式）
 *
 * 示例 1：表单提交
 * ```typescript
 * function FormExample() {
 *   const [formData, setFormData] = useState({ name: '', email: '' });
 *
 *   const handleSubmit = useStableCallback(async () => {
 *     // ✅ 总是访问最新的 formData
 *     console.log('提交数据:', formData);
 *     await api.submit(formData);
 *   });
 *
 *   return <button onClick={handleSubmit}>提交</button>;
 * }
 * ```
 *
 * 示例 2：事件处理
 * ```typescript
 * function CounterExample() {
 *   const [count, setCount] = useState(0);
 *
 *   const handleClick = useStableCallback(() => {
 *     // ✅ 总是访问最新的 count
 *     console.log('当前计数:', count);
 *     setCount(count + 1);
 *   });
 *
 *   return <button onClick={handleClick}>点击 {count}</button>;
 * }
 * ```
 *
 * 示例 3：传递给子组件
 * ```typescript
 * function ParentExample() {
 *   const [data, setData] = useState([]);
 *
 *   const handleItemClick = useStableCallback((item: any) => {
 *     // ✅ 总是访问最新的 data
 *     console.log('当前数据:', data);
 *     console.log('点击项:', item);
 *   });
 *
 *   // ✅ handleItemClick 引用稳定，子组件不会因此重渲染
 *   return <ChildList items={data} onItemClick={handleItemClick} />;
 * }
 * ```
 */

/**
 * 迁移到 React 19.2 useEffectEvent 的指南
 *
 * 如果你的场景是在 Effect 内部使用，可以迁移到官方 Hook：
 *
 * ```typescript
 * import { useEffectEvent } from 'react';
 *
 * // Before: useStableCallback
 * const onConnected = useStableCallback(() => {
 *   showNotification('Connected!', theme);
 * });
 * useEffect(() => {
 *   connection.on('connected', onConnected);
 * }, [roomId]);
 *
 * // After: useEffectEvent
 * const onConnected = useEffectEvent(() => {
 *   showNotification('Connected!', theme);
 * });
 * useEffect(() => {
 *   connection.on('connected', onConnected);
 * }, [roomId]);
 * ```
 *
 * 但对于表单提交、按钮点击等场景，继续使用 useStableCallback
 */
