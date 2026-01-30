/**
 * 提单模块常量 - 画布布局
 */

export const CANVAS_LAYOUT = {
  // 项目节点位置
  PROJECT_NODE_X: 120,
  PROJECT_NODE_Y: 300,
  PROJECT_NODE_WIDTH: 340,

  // 姿态节点位置
  FOLD_TYPE_NODE_X: 560,
  FOLD_TYPE_NODE_WIDTH: 180,

  // 仿真类型节点位置
  SIM_TYPE_NODE_X: 860,
  SIM_TYPE_NODE_WIDTH: 220,

  // 配置模块位置
  CONFIG_BOX_X: 1180,
  CONFIG_BOX_WIDTH: 620,
  CONFIG_BOX_HEIGHT: 200,

  // 间距 - 仿真类型间距 = 配置卡片高度 + 间隙
  SIM_TYPE_VERTICAL_SPACING: 240, // CONFIG_BOX_HEIGHT + 40px gap
  FOLD_TYPE_GAP: 60, // 姿态之间的额外间隙
  LINE_OFFSET_Y: 70,
  START_Y: 100, // 画布起始Y坐标
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
