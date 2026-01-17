/**
 * 提单模块常量 - 画布布局
 */

export const CANVAS_LAYOUT = {
  // 项目节点位置
  PROJECT_NODE_X: 120,
  PROJECT_NODE_Y: 300,
  PROJECT_NODE_WIDTH: 340,

  // 仿真类型节点位置
  SIM_TYPE_NODE_X: 580,
  SIM_TYPE_NODE_WIDTH: 240,

  // 配置模块位置
  CONFIG_BOX_X: 920,
  CONFIG_BOX_WIDTH: 600,
  CONFIG_BOX_HEIGHT: 180,

  // 间距
  VERTICAL_SPACING: 260,
  LINE_OFFSET_Y: 70,
} as const;

/**
 * 画布交互常量
 */
export const CANVAS_INTERACTION = {
  MIN_SCALE: 0.5,
  MAX_SCALE: 2.0,
  SCALE_STEP: 0.1,
  ZOOM_SENSITIVITY: 0.001,
} as const;
