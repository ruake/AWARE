import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getSelectedEnvIds, 
  setSelectedEnvIds, 
  toggleSelectedEnvId,
  getSelectedSuiteIds,
  setSelectedSuiteIds,
  toggleSelectedSuiteId,
  getLayoutSettings,
  setLayoutSettings
} from '../filters';

describe('filters.ts', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Reset stores to default state if possible. 
    // Since they are module-level and initialized from localStorage, 
    // we can control them by clearing localStorage before the module is first loaded, 
    // but here we just test the transitions.
    setSelectedEnvIds([]);
    setSelectedSuiteIds([]);
  });

  describe('Env Filters', () => {
    it('should get and set selected env ids', () => {
      setSelectedEnvIds(['env1', 'env2']);
      expect(getSelectedEnvIds()).toEqual(['env1', 'env2']);
      expect(JSON.parse(localStorage.getItem('aware-selected-env-v2') || '[]')).toEqual(['env1', 'env2']);
    });

    it('should toggle env ids', () => {
      setSelectedEnvIds(['env1']);
      toggleSelectedEnvId('env2');
      expect(getSelectedEnvIds()).toEqual(['env1', 'env2']);
      toggleSelectedEnvId('env1');
      expect(getSelectedEnvIds()).toEqual(['env2']);
    });
  });

  describe('Suite Filters', () => {
    it('should get and set selected suite ids', () => {
      setSelectedSuiteIds(['suite1']);
      expect(getSelectedSuiteIds()).toEqual(['suite1']);
      expect(JSON.parse(localStorage.getItem('aware-selected-suites-v1') || '[]')).toEqual(['suite1']);
    });

    it('should toggle suite ids', () => {
      setSelectedSuiteIds(['suite1']);
      toggleSelectedSuiteId('suite2');
      expect(getSelectedSuiteIds()).toEqual(['suite1', 'suite2']);
      toggleSelectedSuiteId('suite1');
      expect(getSelectedSuiteIds()).toEqual(['suite2']);
    });
  });

  describe('Layout Settings', () => {
    it('should get and set layout settings', () => {
      const initial = getLayoutSettings();
      expect(initial.sidebarWidth).toBe(240);

      setLayoutSettings({ sidebarWidth: 300 });
      expect(getLayoutSettings().sidebarWidth).toBe(300);
      expect(getLayoutSettings().sidebarCollapsed).toBe(initial.sidebarCollapsed); // Preserved
      
      const stored = JSON.parse(localStorage.getItem('aware-layout-v1') || '{}');
      expect(stored.sidebarWidth).toBe(300);
    });
  });
});
