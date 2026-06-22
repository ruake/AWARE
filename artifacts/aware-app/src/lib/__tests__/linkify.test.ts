import { describe, it, expect } from 'vitest';
import { linkifyText } from '../linkify';

describe('linkifyText', () => {
  it('should detect test case IDs (tc_123)', () => {
    const input = 'Check tc_123 for details';
    expect(linkifyText(input)).toBe('Check [tc_123](/tests?detail=tc_123) for details');
  });

  it('should detect diff IDs (diff_456)', () => {
    const input = 'See diff_456';
    expect(linkifyText(input)).toBe('See [diff_456](/trends?diffId=diff_456)');
  });

  it('should detect run IDs (run_abc-123)', () => {
    const input = 'Run run_abc-123 failed';
    expect(linkifyText(input)).toBe('Run [run_abc-123](/runs/run_abc-123) failed');
  });

  it('should detect legacy test IDs (TC-001)', () => {
    const input = 'Test TC-001 is flaky';
    expect(linkifyText(input)).toBe('Test [TC-001](/trends?testId=TC-001) is flaky');
  });

  it('should not linkify IDs inside backticks', () => {
    const input = 'Do not link `tc_123`';
    expect(linkifyText(input)).toBe('Do not link `tc_123`');
  });

  it('should not linkify IDs that are part of other words', () => {
    const input = 'This is nottc_123 or tc_123extra';
    expect(linkifyText(input)).toBe('This is nottc_123 or tc_123extra');
  });

  it('should handle strings with no IDs', () => {
    const input = 'Just a regular string';
    expect(linkifyText(input)).toBe('Just a regular string');
  });

  it('should handle multiple IDs in one string', () => {
    const input = 'Fix tc_101 and check run_abc';
    expect(linkifyText(input)).toBe('Fix [tc_101](/tests?detail=tc_101) and check [run_abc](/runs/run_abc)');
  });
});
