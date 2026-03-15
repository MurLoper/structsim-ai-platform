import React, { useState } from 'react';
import type { CareDevice } from '@/types/config';

interface CareDevicesDrawerContentProps {
  configCareDevices: CareDevice[]; // 配置数据源
  selectedDeviceIds: string[];
  onUpdate: (deviceIds: string[]) => void;
  t?: (key: string) => string;
}

export const CareDevicesDrawerContent: React.FC<CareDevicesDrawerContentProps> = ({
  configCareDevices,
  selectedDeviceIds,
  onUpdate,
  t = (key: string) => key,
}) => {
  const [manualInput, setManualInput] = useState('');

  // 切换器件选择
  const toggleDevice = (deviceCode: string) => {
    if (selectedDeviceIds.includes(deviceCode)) {
      onUpdate(selectedDeviceIds.filter(id => id !== deviceCode));
    } else {
      onUpdate([...selectedDeviceIds, deviceCode]);
    }
  };

  // 添加手动输入的器件
  const handleAddManual = () => {
    const trimmed = manualInput.trim();
    if (trimmed && !selectedDeviceIds.includes(trimmed)) {
      onUpdate([...selectedDeviceIds, trimmed]);
      setManualInput('');
    }
  };

  // 移除单个器件
  const handleRemoveDevice = (deviceId: string) => {
    onUpdate(selectedDeviceIds.filter(id => id !== deviceId));
  };

  // 全选配置器件
  const selectAllConfig = () => {
    const codes = configCareDevices.map(d => d.code || d.name);
    const newIds = [...new Set([...selectedDeviceIds, ...codes])];
    onUpdate(newIds);
  };

  // 清除配置器件选择
  const clearConfigSelection = () => {
    const configCodes = new Set(configCareDevices.map(d => d.code || d.name));
    onUpdate(selectedDeviceIds.filter(id => !configCodes.has(id)));
  };

  return (
    <div className="space-y-5">
      {/* 说明文字 */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {t('sub.care_devices_config_desc')}
        </p>
      </div>

      {/* 已选择数量 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 eyecare:text-foreground">
          {t('sub.care_devices_selected')}: {selectedDeviceIds.length}
        </span>
        {selectedDeviceIds.length > 0 && (
          <button onClick={() => onUpdate([])} className="text-xs text-red-500 hover:text-red-600">
            {t('sub.clear_all')}
          </button>
        )}
      </div>

      {/* 配置器件列表 */}
      {configCareDevices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 eyecare:text-foreground">
              {t('sub.care_devices_from_config')} ({configCareDevices.length})
            </label>
            <div className="flex gap-2">
              <button
                onClick={selectAllConfig}
                className="text-xs text-brand-600 hover:text-brand-700"
              >
                {t('sub.select_all')}
              </button>
              <button
                onClick={clearConfigSelection}
                className="text-xs text-slate-500 hover:text-slate-600"
              >
                {t('sub.clear')}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
            {configCareDevices.map(device => {
              const deviceKey = device.code || device.name;
              const isSelected = selectedDeviceIds.includes(deviceKey);
              return (
                <label
                  key={device.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-300'
                      : 'bg-slate-50 dark:bg-slate-700 eyecare:bg-card/50 border-transparent hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleDevice(deviceKey)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block" title={device.name}>
                      {device.name}
                    </span>
                    {device.code && (
                      <span className="text-xs text-slate-400 truncate block">{device.code}</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 手动输入区域 */}
      <div>
        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 eyecare:text-foreground mb-2 block">
          {t('sub.care_devices_manual_input')}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddManual()}
            placeholder={t('sub.care_devices_input_placeholder')}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <button
            onClick={handleAddManual}
            disabled={!manualInput.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('sub.add')}
          </button>
        </div>
      </div>

      {/* 已选择的器件列表 */}
      {selectedDeviceIds.length > 0 && (
        <div>
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 eyecare:text-foreground mb-2 block">
            {t('sub.care_devices_selected_list')}
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedDeviceIds.map(id => (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full"
              >
                {id}
                <button
                  onClick={() => handleRemoveDevice(id)}
                  className="ml-1 text-brand-500 hover:text-brand-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
