// Icon mapping utility for dynamic menu rendering
import {
  HomeIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  Cog6ToothIcon,
  FolderIcon,
  CpuChipIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  ServerIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

// Map Lucide icon names to Heroicons
const iconMap: Record<string, IconComponent> = {
  LayoutDashboard: HomeIcon,
  FileText: DocumentTextIcon,
  Plus: PlusCircleIcon,
  Settings: Cog6ToothIcon,
  Folder: FolderIcon,
  Cpu: CpuChipIcon,
  Sliders: AdjustmentsHorizontalIcon,
  BarChart2: ChartBarIcon,
  Server: ServerIcon,
  Shield: ShieldCheckIcon,
};

export const getIconComponent = (iconName: string | null): IconComponent | null => {
  if (!iconName) return null;
  return iconMap[iconName] || null;
};

export const DefaultIcon = HomeIcon;
