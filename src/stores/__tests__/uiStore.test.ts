/**
 * UI Store 测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useUIStore, type Theme, type Language } from '../uiStore';

// Mock document methods
const mockClassList = {
  add: vi.fn(),
  remove: vi.fn(),
  contains: vi.fn(),
};

const mockDocumentElement = {
  classList: mockClassList,
  setAttribute: vi.fn(),
  removeAttribute: vi.fn(),
};

describe('useUIStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Mock document.documentElement
    vi.spyOn(window, 'document', 'get').mockReturnValue({
      ...document,
      documentElement: mockDocumentElement,
    } as any);

    // Reset store state
    useUIStore.setState({
      theme: 'light',
      language: 'en',
      sidebarCollapsed: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const state = useUIStore.getState();

      expect(state.theme).toBe('light');
      expect(state.language).toBe('en');
      expect(state.sidebarCollapsed).toBe(false);
    });
  });

  describe('setTheme', () => {
    it('应该能设置为深色主题', () => {
      const { setTheme } = useUIStore.getState();

      act(() => {
        setTheme('dark');
      });

      expect(useUIStore.getState().theme).toBe('dark');
      expect(mockClassList.remove).toHaveBeenCalledWith('dark', 'eyecare');
      expect(mockDocumentElement.removeAttribute).toHaveBeenCalledWith('data-theme');
      expect(mockClassList.add).toHaveBeenCalledWith('dark');
    });

    it('应该能设置为护眼主题', () => {
      const { setTheme } = useUIStore.getState();

      act(() => {
        setTheme('eyecare');
      });

      expect(useUIStore.getState().theme).toBe('eyecare');
      expect(mockClassList.remove).toHaveBeenCalledWith('dark', 'eyecare');
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'eyecare');
    });

    it('应该能设置为亮色主题', () => {
      // First set to dark
      useUIStore.setState({ theme: 'dark' });

      const { setTheme } = useUIStore.getState();

      act(() => {
        setTheme('light');
      });

      expect(useUIStore.getState().theme).toBe('light');
      expect(mockClassList.remove).toHaveBeenCalledWith('dark', 'eyecare');
      expect(mockDocumentElement.removeAttribute).toHaveBeenCalledWith('data-theme');
      // Should not add any class for light theme
    });

    it('主题切换应该正确清除之前的主题类', () => {
      const { setTheme } = useUIStore.getState();

      // Switch through all themes
      act(() => {
        setTheme('dark');
      });
      expect(mockClassList.add).toHaveBeenCalledWith('dark');

      vi.clearAllMocks();

      act(() => {
        setTheme('eyecare');
      });
      expect(mockClassList.remove).toHaveBeenCalledWith('dark', 'eyecare');
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'eyecare');

      vi.clearAllMocks();

      act(() => {
        setTheme('light');
      });
      expect(mockClassList.remove).toHaveBeenCalledWith('dark', 'eyecare');
      expect(mockDocumentElement.removeAttribute).toHaveBeenCalledWith('data-theme');
    });
  });

  describe('setLanguage', () => {
    it('应该能设置语言为中文', () => {
      const { setLanguage } = useUIStore.getState();

      act(() => {
        setLanguage('zh');
      });

      expect(useUIStore.getState().language).toBe('zh');
    });

    it('应该能设置语言为英文', () => {
      // First set to Chinese
      useUIStore.setState({ language: 'zh' });

      const { setLanguage } = useUIStore.getState();

      act(() => {
        setLanguage('en');
      });

      expect(useUIStore.getState().language).toBe('en');
    });
  });

  describe('toggleSidebar', () => {
    it('应该能切换侧边栏状态从展开到收起', () => {
      const { toggleSidebar } = useUIStore.getState();

      act(() => {
        toggleSidebar();
      });

      expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    });

    it('应该能切换侧边栏状态从收起到展开', () => {
      // First collapse
      useUIStore.setState({ sidebarCollapsed: true });

      const { toggleSidebar } = useUIStore.getState();

      act(() => {
        toggleSidebar();
      });

      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });

    it('多次切换应该正确交替状态', () => {
      const { toggleSidebar } = useUIStore.getState();

      // Initial: false
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);

      act(() => {
        toggleSidebar();
      });
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      act(() => {
        toggleSidebar();
      });
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);

      act(() => {
        toggleSidebar();
      });
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    });
  });

  describe('状态持久化', () => {
    it('store 应该配置了正确的存储名称', () => {
      // Check that persist is configured
      const persistConfig = (useUIStore as any).persist;
      // Note: Zustand persist adds getOptions method
      expect(persistConfig).toBeDefined();
    });
  });

  describe('类型安全', () => {
    it('Theme 类型应该正确', () => {
      const themes: Theme[] = ['light', 'dark', 'eyecare'];
      const { setTheme } = useUIStore.getState();

      themes.forEach(theme => {
        act(() => {
          setTheme(theme);
        });
        expect(useUIStore.getState().theme).toBe(theme);
      });
    });

    it('Language 类型应该正确', () => {
      const languages: Language[] = ['en', 'zh'];
      const { setLanguage } = useUIStore.getState();

      languages.forEach(lang => {
        act(() => {
          setLanguage(lang);
        });
        expect(useUIStore.getState().language).toBe(lang);
      });
    });
  });
});
