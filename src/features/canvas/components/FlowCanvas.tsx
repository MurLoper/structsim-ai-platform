/**
 * React Flow 画布组件
 *
 * 用于仿真工作流程图编辑
 *
 * @example
 * ```tsx
 * <FlowCanvas
 *   initialNodes={nodes}
 *   initialEdges={edges}
 *   onNodesChange={(nodes) => console.log(nodes)}
 * />
 * ```
 */
import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant,
  ConnectionMode,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

// 自定义节点
import { SimulationNode } from './nodes/SimulationNode';
import { ParameterNode } from './nodes/ParameterNode';
import { ResultNode } from './nodes/ResultNode';
import { ConditionNode } from './nodes/ConditionNode';

export interface FlowCanvasProps {
  /** 初始节点 */
  initialNodes?: Node[];
  /** 初始边 */
  initialEdges?: Edge[];
  /** 节点变化回调 */
  onNodesChange?: (nodes: Node[]) => void;
  /** 边变化回调 */
  onEdgesChange?: (edges: Edge[]) => void;
  /** 是否只读 */
  readOnly?: boolean;
  /** 容器高度 */
  height?: number | string;
  /** 自定义类名 */
  className?: string;
  /** 是否显示小地图 */
  showMiniMap?: boolean;
  /** 是否显示控制面板 */
  showControls?: boolean;
  /** 是否显示背景网格 */
  showBackground?: boolean;
  /** 工具栏内容 */
  toolbar?: React.ReactNode;
  /** 自定义节点类型 */
  customNodeTypes?: NodeTypes;
  /** 自定义边类型 */
  customEdgeTypes?: EdgeTypes;
}

// 默认节点类型
const defaultNodeTypes: NodeTypes = {
  simulation: SimulationNode,
  parameter: ParameterNode,
  result: ResultNode,
  condition: ConditionNode,
};

export function FlowCanvas({
  initialNodes = [],
  initialEdges = [],
  onNodesChange: onNodesChangeCallback,
  onEdgesChange: onEdgesChangeCallback,
  readOnly = false,
  height = 600,
  className,
  showMiniMap = true,
  showControls = true,
  showBackground = true,
  toolbar,
  customNodeTypes,
  customEdgeTypes,
}: FlowCanvasProps) {
  const { theme } = useTheme();
  const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges);

  // 合并节点类型
  const nodeTypes = useMemo(() => ({ ...defaultNodeTypes, ...customNodeTypes }), [customNodeTypes]);

  // 节点变化处理
  const onNodesChange: OnNodesChange = useCallback(
    changes => {
      handleNodesChange(changes);
      // 延迟回调以获取最新状态
      setTimeout(() => {
        onNodesChangeCallback?.(nodes);
      }, 0);
    },
    [handleNodesChange, onNodesChangeCallback, nodes]
  );

  // 边变化处理
  const onEdgesChange: OnEdgesChange = useCallback(
    changes => {
      handleEdgesChange(changes);
      setTimeout(() => {
        onEdgesChangeCallback?.(edges);
      }, 0);
    },
    [handleEdgesChange, onEdgesChangeCallback, edges]
  );

  // 连接处理
  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return;
      setEdges(eds =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            style: { strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges, readOnly]
  );

  // 主题相关颜色
  const themeColors = useMemo(() => {
    if (theme === 'dark') {
      return {
        background: '#0f172a',
        nodeBackground: '#1e293b',
        nodeBorder: '#334155',
        text: '#e2e8f0',
        edge: '#64748b',
        miniMapMask: 'rgba(15, 23, 42, 0.8)',
        miniMapNode: '#475569',
      };
    }
    if (theme === 'eyecare') {
      return {
        background: '#fdf6e3',
        nodeBackground: '#eee8d5',
        nodeBorder: '#d4c4a8',
        text: '#5c534b',
        edge: '#93a1a1',
        miniMapMask: 'rgba(253, 246, 227, 0.8)',
        miniMapNode: '#93a1a1',
      };
    }
    return {
      background: '#ffffff',
      nodeBackground: '#ffffff',
      nodeBorder: '#e2e8f0',
      text: '#1e293b',
      edge: '#94a3b8',
      miniMapMask: 'rgba(255, 255, 255, 0.8)',
      miniMapNode: '#94a3b8',
    };
  }, [theme]);

  return (
    <div className={cn('w-full border rounded-lg overflow-hidden', className)} style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={customEdgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        panOnScroll
        selectionOnDrag
        selectNodesOnDrag
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: themeColors.edge, strokeWidth: 2 },
        }}
        style={{ background: themeColors.background }}
      >
        {showBackground && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={theme === 'dark' ? '#334155' : '#e2e8f0'}
          />
        )}
        {showControls && (
          <Controls showZoom showFitView showInteractive={!readOnly} position="bottom-left" />
        )}
        {showMiniMap && (
          <MiniMap
            nodeColor={themeColors.miniMapNode}
            maskColor={themeColors.miniMapMask}
            position="bottom-right"
            pannable
            zoomable
          />
        )}
        {toolbar && (
          <Panel position="top-right" className="flex gap-2">
            {toolbar}
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

/**
 * 创建节点的工具函数
 */
export function createNode(
  id: string,
  type: string,
  position: { x: number; y: number },
  data: Record<string, unknown>
): Node {
  return {
    id,
    type,
    position,
    data,
  };
}

/**
 * 创建边的工具函数
 */
export function createEdge(
  id: string,
  source: string,
  target: string,
  options?: Partial<Edge>
): Edge {
  return {
    id,
    source,
    target,
    type: 'smoothstep',
    animated: true,
    ...options,
  };
}
