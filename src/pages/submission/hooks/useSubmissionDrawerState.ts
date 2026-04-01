import { useState } from 'react';
import type { DrawerMode } from '../types';

export const useSubmissionDrawerState = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('project');
  const [activeSimTypeId, setActiveSimTypeId] = useState<number | null>(null);
  const [activeFoldTypeId, setActiveFoldTypeId] = useState<number | null>(null);
  const [activeConditionId, setActiveConditionId] = useState<number | null>(null);

  return {
    isDrawerOpen,
    setIsDrawerOpen,
    drawerMode,
    setDrawerMode,
    activeSimTypeId,
    setActiveSimTypeId,
    activeFoldTypeId,
    setActiveFoldTypeId,
    activeConditionId,
    setActiveConditionId,
  };
};
