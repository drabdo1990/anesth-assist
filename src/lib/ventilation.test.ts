import { describe, expect, it } from 'vitest'
import {
  DP_LIMIT,
  DP_TARGET,
  drivingPressure,
  drivingTone,
  minuteVentilation,
  PPLAT_LIMIT,
  pplatTone,
  rrBaseline,
  volutraumaRisk,
  vtRows,
} from './ventilation'

describe('vtRows', () => {
  it('computes 6/7/8 mL/kg of IBW', () => {
    const rows = vtRows(70)
    expect(rows.map((r) => r.vtMl)).toEqual([420, 490, 560])
    expect(rows.map((r) => r.label)).toEqual(['6 mL/kg', '7 mL/kg', '8 mL/kg'])
  })
})

describe('minuteVentilation', () => {
  it('multiplies VT by RR in L/min', () => {
    expect(minuteVentilation(490, 12)).toBeCloseTo(5.88, 6)
    expect(minuteVentilation(0, 12)).toBe(0)
    expect(minuteVentilation(490, NaN)).toBe(0)
  })
})

describe('pressure limits', () => {
  it('Pplat safe limit is 30 cmH2O', () => {
    expect(PPLAT_LIMIT).toBe(30)
    expect(pplatTone(29)).toBe('ok')
    expect(pplatTone(30)).toBe('danger')
    expect(pplatTone(null)).toBeNull()
  })
  it('driving pressure = Pplat - PEEP, ok below 14, danger above 15', () => {
    expect(DP_TARGET).toBe(14)
    expect(DP_LIMIT).toBe(15)
    expect(drivingPressure(28, 8)).toBe(20)
    expect(drivingTone(13)).toBe('ok')
    expect(drivingTone(14)).toBe('caution')
    expect(drivingTone(15)).toBe('caution')
    expect(drivingTone(16)).toBe('danger')
    expect(drivingTone(null)).toBeNull()
    expect(drivingPressure(NaN, 5)).toBeNull()
  })
})

describe('rrBaseline', () => {
  it('is 10–14 for adults and 20–30 for pediatrics', () => {
    expect(rrBaseline(false)).toEqual([10, 14])
    expect(rrBaseline(true)).toEqual([20, 30])
  })
})

describe('volutraumaRisk', () => {
  it('flags obese patients whose TBW far exceeds IBW', () => {
    expect(volutraumaRisk(130, 60)).toBe(true)
    expect(volutraumaRisk(80, 70)).toBe(false)
    expect(volutraumaRisk(NaN, 70)).toBe(false)
  })
})
