import React, { useMemo, useState } from 'react';
import { Alert, Button, FormItem, Input, Tag, Textarea } from '@/components/ui';
import type { CareDevice } from '@/types/config';

interface CareDevicesDrawerContentProps {
  configCareDevices: CareDevice[];
  selectedDeviceIds: string[];
  conditionRemark?: string;
  onUpdate: (deviceIds: string[]) => void;
  onRemarkChange?: (remark: string) => void;
  t?: (key: string) => string;
}

export const CareDevicesDrawerContent: React.FC<CareDevicesDrawerContentProps> = ({
  configCareDevices,
  selectedDeviceIds,
  conditionRemark = '',
  onUpdate,
  onRemarkChange,
  t = (key: string) => key,
}) => {
  const [customDeviceInput, setCustomDeviceInput] = useState('');

  const mergedCareDevices = useMemo(
    () =>
      configCareDevices.map(device => ({
        ...device,
        code: device.code || device.name,
      })),
    [configCareDevices]
  );

  const toggleDevice = (deviceCode: string) => {
    if (selectedDeviceIds.includes(deviceCode)) {
      onUpdate(selectedDeviceIds.filter(id => id !== deviceCode));
    } else {
      onUpdate([...selectedDeviceIds, deviceCode]);
    }
  };

  const handleRemoveDevice = (deviceId: string) => {
    onUpdate(selectedDeviceIds.filter(id => id !== deviceId));
  };

  const selectAllConfig = () => {
    const codes = mergedCareDevices.map(d => d.code || d.name);
    onUpdate([...new Set([...selectedDeviceIds, ...codes])]);
  };

  const clearConfigSelection = () => {
    const configCodes = new Set(mergedCareDevices.map(d => d.code || d.name));
    onUpdate(selectedDeviceIds.filter(id => !configCodes.has(id)));
  };

  const addCustomDevices = () => {
    const customIds = customDeviceInput
      .split(/[\s,，;；\n]+/)
      .map(item => item.trim())
      .filter(Boolean);
    if (customIds.length === 0) {
      return;
    }
    onUpdate(Array.from(new Set([...selectedDeviceIds, ...customIds])));
    setCustomDeviceInput('');
  };

  return (
    <div className="space-y-5">
      <Alert type="info">{t('sub.care_devices_config_desc')}</Alert>

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

      {mergedCareDevices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-foreground">
              {t('sub.care_devices_from_config')} ({mergedCareDevices.length})
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
          <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto custom-scrollbar">
            {mergedCareDevices.map(device => {
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

      <FormItem label={t('sub.care_devices_manual_input')}>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">{t('sub.care_devices_manual_desc')}</div>
          <div className="flex gap-2">
            <Input
              value={customDeviceInput}
              onChange={e => setCustomDeviceInput(e.target.value)}
              placeholder={t('sub.care_devices_input_placeholder')}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addCustomDevices();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addCustomDevices}>
              {t('sub.add')}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            支持输入一个或多个自定义器件 ID，多个 ID 可用逗号、空格或换行分隔。
          </div>
        </div>
      </FormItem>

      <FormItem label={t('sub.condition_remark')}>
        <Textarea
          value={conditionRemark}
          onChange={e => onRemarkChange?.(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder={t('sub.condition_remark_placeholder')}
        />
      </FormItem>

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
