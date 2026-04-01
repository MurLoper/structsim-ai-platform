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
import { FLOW_CANVAS_THEME_TOKENS } from './flowCanvasTheme';
import { SimulationNode } from './nodes/SimulationNode';
import { ParameterNode } from './nodes/ParameterNode';
import { ResultNode } from './nodes/ResultNode';
import { ConditionNode } from './nodes/ConditionNode';

export interface FlowCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  readOnly?: boolean;
  height?: number | string;
  className?: string;
  showMiniMap?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
  toolbar?: React.ReactNode;
  customNodeTypes?: NodeTypes;
  customEdgeTypes?: EdgeTypes;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const defaultNodeTypes: NodeTypes = {
  simulation: SimulationNode as any,
  parameter: ParameterNode as any,
  result: ResultNode as any,
  condition: ConditionNode as any,
};
/* eslint-enable @typescript-eslint/no-explicit-any */

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
  const themeTokens = FLOW_CANVAS_THEME_TOKENS[theme] || FLOW_CANVAS_THEME_TOKENS.light;
  const [nodes, , handleNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes = useMemo(() => ({ ...defaultNodeTypes, ...customNodeTypes }), [customNodeTypes]);

  const onNodesChange: OnNodesChange = useCallback(
    changes => {
      handleNodesChange(changes);
      setTimeout(() => {
        onNodesChangeCallback?.(nodes);
      }, 0);
    },
    [handleNodesChange, nodes, onNodesChangeCallback]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    changes => {
      handleEdgesChange(changes);
      setTimeout(() => {
        onEdgesChangeCallback?.(edges);
      }, 0);
    },
    [edges, handleEdgesChange, onEdgesChangeCallback]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return;
      setEdges(currentEdges =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            style: { strokeWidth: 2 },
          },
          currentEdges
        )
      );
    },
    [readOnly, setEdges]
  );

  return (
    <div className={cn('w-full overflow-hidden rounded-lg border', className)} style={{ height }}>
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
          style: { stroke: themeTokens.edge, strokeWidth: 2 },
        }}
        style={{ background: themeTokens.background }}
      >
        {showBackground && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={themeTokens.backgroundDot}
          />
        )}
        {showControls && (
          <Controls showZoom showFitView showInteractive={!readOnly} position="bottom-left" />
        )}
        {showMiniMap && (
          <MiniMap
            nodeColor={themeTokens.miniMapNode}
            maskColor={themeTokens.miniMapMask}
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
