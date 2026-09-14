import { describe, expect, it } from 'vitest';
import { BACKEND_ROLES, protectedRouteFor, roleDashboardMap, roleRouteMap } from './roles';

describe('role contracts', () => {
  it('covers every backend-issued role and no listings role', () => {
    expect([...BACKEND_ROLES].toSorted()).toStrictEqual(['agent', 'mgmt', 'owner', 'tenant']);
    expect(Object.keys(roleDashboardMap).toSorted()).toStrictEqual([...BACKEND_ROLES].toSorted());
    expect(BACKEND_ROLES).not.toContain('listings');
  });

  it('lands each role on a dashboard that role may access', () => {
    for (const role of BACKEND_ROLES) {
      const dest = roleDashboardMap[role];
      const match = protectedRouteFor(dest);
      expect(match).toBeDefined();
      expect(match?.roles).toContain(role);
    }
  });

  it('restricts the agents workbench to management', () => {
    expect(protectedRouteFor('/agents')?.roles).toStrictEqual(['mgmt']);
    expect(protectedRouteFor('/agents/12')?.roles).toStrictEqual(['mgmt']);
    expect(protectedRouteFor('/agents')?.roles).not.toContain('agent');
  });

  it('gives agents the marketplace dashboard instead of management APIs', () => {
    expect(roleDashboardMap.agent).toBe('/marketplace');
    expect(protectedRouteFor('/marketplace')?.roles).toStrictEqual(['agent']);
    expect(protectedRouteFor('/marketplace/map')?.roles).toStrictEqual(['agent']);
  });

  it('leaves public listings ungated', () => {
    expect(protectedRouteFor('/listings')).toBeUndefined();
    expect(protectedRouteFor('/listings/42')).toBeUndefined();
  });

  it('keeps management prefixes exclusive to mgmt', () => {
    expect(roleRouteMap.find((entry) => entry.path === '/management')?.roles).toStrictEqual([
      'mgmt',
    ]);
    expect(protectedRouteFor('/management/agents')?.roles).toStrictEqual(['mgmt']);
  });
});
