import React, { useState } from 'react';
import { Alert, FormItem, Tag, Button } from '@/components/ui';
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
      <Alert type="info">{t('sub.care_devices_config_desc')}</Alert>

      {/* 已选择数量 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {t('sub.care_devices_selected')}: {selectedDeviceIds.length}
        </span>
        {selectedDeviceIds.length > 0 && (
          <button
            onClick={() => onUpdate([])}
            className="text-xs text-destructive hover:text-destructive/80"
          >
            {t('sub.clear_all')}
          </button>
        )}
      </div>

      {/* 配置器件列表 */}
      {configCareDevices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-foreground">
              {t('sub.care_devices_from_config')} ({configCareDevices.length})
            </span>
            <div className="flex gap-2">
              <button
                onClick={selectAllConfig}
                className="text-xs text-primary hover:text-primary/80"
              >
                {t('sub.select_all')}
              </button>
              <button
                onClick={clearConfigSelection}
                className="text-xs text-muted-foreground hover:text-foreground"
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
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-muted/50 border-transparent hover:border-border'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleDevice(deviceKey)}
                    className="w-4 h-4 rounded border-input"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground truncate block" title={device.name}>
                      {device.name}
                    </span>
                    {device.code && (
                      <span className="text-xs text-muted-foreground truncate block">
                        {device.code}
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 手动输入区域 */}
      <FormItem label={t('sub.care_devices_manual_input')}>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddManual()}
            placeholder={t('sub.care_devices_input_placeholder')}
            className="flex-1 px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button onClick={handleAddManual} disabled={!manualInput.trim()}>
            {t('sub.add')}
          </Button>
        </div>
      </FormItem>

      {/* 已选择的器件列表 */}
      {selectedDeviceIds.length > 0 && (
        <FormItem label={t('sub.care_devices_selected_list')}>
          <div className="flex flex-wrap gap-2">
            {selectedDeviceIds.map(id => (
              <Tag key={id} closable onClose={() => handleRemoveDevice(id)}>
                {id}
              </Tag>
            ))}
          </div>
        </FormItem>
      )}
    </div>
  );
};
