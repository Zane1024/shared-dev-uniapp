# React Hooks 最佳实践

本文档整理 React Hooks 的常用最佳实践，便于在 React 项目或混合技术栈中统一规范。可通过 **Context7** 查询 React 官方最新文档以核对 API 与示例。

---

## 一、规则与原则

### 1.1 只在顶层调用 Hooks

- **不要在循环、条件或嵌套函数里调用** `useState`、`useEffect` 等，否则会破坏 Hooks 的调用顺序，导致状态错位。
- 若需要条件逻辑，在 Hook **内部**写条件，或在**上层**用条件渲染（不同组件里调用不同 Hooks）。

```js
// 错误
if (condition) {
  const [state, setState] = useState(0);
}

// 正确：条件在内部
const [state, setState] = useState(0);
useEffect(() => {
  if (condition) { /* ... */ }
}, [condition]);
```

### 1.2 只在 React 函数中调用 Hooks

- 在函数组件或自定义 Hook 中调用，不要在普通 JS 函数、class 组件或类方法中调用。

### 1.3 自定义 Hook 命名以 use 开头

- 便于工具和团队识别其为 Hook，并自动应用 Hooks 规则检查（如 eslint-plugin-react-hooks）。

---

## 二、useState

### 2.1 按逻辑拆分状态

- 不要把多个不相关的值塞进一个对象里用一份 `useState`，否则更新时容易漏字段或触发多余渲染。
- 相关且总是一起更新的可以放在一个 state 里。

```js
// 更清晰
const [name, setName] = useState('');
const [age, setAge] = useState(0);

// 总是一起更新时可以合并
const [form, setForm] = useState({ name: '', age: 0 });
```

### 2.2 函数式更新

- 新状态依赖**当前状态**时，用函数式更新，避免闭包拿到过期 state。

```js
setCount((prev) => prev + 1);
setList((prev) => [...prev, newItem]);
```

### 2.3 惰性初始值

- 初始值计算成本高时，传**函数**给 `useState`，只会在首次渲染执行一次。

```js
const [state, setState] = useState(() => computeExpensiveInitialState());
```

---

## 三、useEffect

### 3.1 明确依赖数组

- 依赖数组要包含 effect 里用到的**所有**来自组件作用域的响应式值（props、state、上下文等），避免闭包陈旧或行为难以推断。
- 若只想在挂载时跑一次，依赖数组为 `[]`；若每次渲染都跑，不传依赖数组（一般不推荐）。

### 3.2 清理副作用

- 订阅、定时器、DOM 监听等要在 effect 里返回清理函数，并在依赖变化或卸载时执行，防止泄漏。

```js
useEffect(() => {
  const id = setInterval(() => {}, 1000);
  return () => clearInterval(id);
}, []);
```

### 3.3 避免在 effect 里直接改“触发该 effect”的状态

- 容易造成循环或多余渲染。若确实需要“根据 A 算 B”，优先考虑：能否在渲染阶段用派生状态（直接算）或 `useMemo` 解决；若必须放 effect，注意依赖和条件，避免无限循环。

### 3.4 数据请求与竞态

- 用 `AbortController` 或请求内带“版本/标识”，在清理函数里取消请求或忽略过期结果，避免后发请求覆盖先发。

```js
useEffect(() => {
  let cancelled = false;
  fetchData(id).then((data) => {
    if (!cancelled) setData(data);
  });
  return () => { cancelled = true; };
}, [id]);
```

---

## 四、useContext

### 4.1 按职责拆分 Context

- 不要一个 Context 塞满全局状态，按“主题”“用户”“路由”等拆成多个，减少无关更新导致的重渲染。

### 4.2 与 useMemo 组合优化

- Provider 的 `value` 用 `useMemo` 或 `useState` 包成稳定引用，避免每次渲染都是新对象导致所有消费者重渲染。

```js
const value = useMemo(() => ({ user, setUser }), [user]);
return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
```

### 4.3 必要时封装自定义 Hook

- `const user = useContext(UserContext)` 封装成 `useUser()`，便于后续换实现（如从 Context 改为数据层）且符合“只从 React 函数中调 Hook”的规范。

---

## 五、useRef

### 5.1 存可变值且不触发重渲染

- DOM 引用、定时器 ID、上一次 props/state、实例变量等，用 `useRef` 存；修改 `.current` 不会触发重渲染。

### 5.2 避免在渲染阶段读/写 ref.current（若会受并发影响）

- 渲染阶段尽量只读；写放在 `useEffect` 或事件处理函数里，避免与 React 的渲染时序冲突。

---

## 六、useMemo / useCallback

### 6.1 不要过度使用

- 仅在对**计算成本高**或**引用稳定性有要求**（如作为 useEffect/子组件 props 的依赖）时使用。
- 简单运算或依赖经常变的情况，用 `useMemo`/`useCallback` 反而可能增加开销。

### 6.2 useCallback 依赖要完整

- 依赖数组要包含回调内用到的所有响应式值；配合 `React.memo` 子组件时，才能稳定避免子组件无意义重渲染。

### 6.3 useMemo 用于派生状态

- 从 props/state 推导出的数据，用 `useMemo` 缓存，依赖与推导用到的值一致。

```js
const fullName = useMemo(() => `${first} ${last}`, [first, last]);
```

---

## 七、自定义 Hooks

### 7.1 抽离可复用逻辑

- 重复的“状态 + 副作用”组合（如表单字段、请求、订阅）抽成自定义 Hook，便于复用和测试。

### 7.2 返回稳定的引用

- 返回对象或数组时，用 `useMemo` 包一层，避免调用方依赖引用时造成多余 effect 或重渲染。

### 7.3 命名清晰

- 以 `use` 开头，名称体现用途（如 `useFetch`、`useLocalStorage`）。

---

## 八、性能相关

### 8.1 React.memo 与 Hooks

- 子组件用 `React.memo` 时，传入的**回调用 useCallback**、**对象/数组用 useMemo**，否则父组件每次渲染都会传入新引用，memo 无效。

### 8.2 大列表

- 长列表用虚拟滚动（如 react-window）减少 DOM；列表项组件用 `React.memo` 并保证 key 稳定（如 id）。

### 8.3 状态下沉与提升

- 状态尽量放在“只影响局部 UI”的最近公共父组件；避免把会频繁变的状态提到很高层级导致整树重渲染。

---

## 九、常见坑与规避

| 问题 | 建议 |
|------|------|
| 闭包拿到旧 state | 用函数式 setState 或保证依赖数组完整 |
| effect 无限循环 | 检查依赖数组，避免在 effect 里直接 set 依赖该 effect 的状态 |
| 请求竞态 | 用取消标志或 AbortController，在清理函数里忽略过期结果 |
| 忘记清理 | 订阅、定时器、监听器在 effect 的 return 里清理 |
| 过度 useMemo/useCallback | 先保证正确性，再对热点路径做性能优化 |

---

## 十、小结速查

- **规则**：顶层调用、仅 React 函数、自定义 Hook 以 `use` 开头。
- **useState**：按逻辑拆分、函数式更新、惰性初始值。
- **useEffect**：依赖完整、清理副作用、注意竞态与循环。
- **useContext**：拆分 Context、稳定 value、可封装 useXxx。
- **useRef**：可变引用、不触发渲染。
- **useMemo/useCallback**：按需使用、依赖完整、配合 memo 时注意稳定引用。
- **自定义 Hook**：抽复用逻辑、返回稳定引用、命名清晰。

---

*具体 API 以 [React 官方文档](https://react.dev/reference/react) 为准；在 Cursor 中配置 Context7 后，可让 AI 用 Context7 查询 React 最新文档进行对照。*
