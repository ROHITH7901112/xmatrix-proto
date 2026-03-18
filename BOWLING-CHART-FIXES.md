# Bowling Chart & KPI System Fixes

## Overview
Fixed three critical issues in the bowling chart and X-Matrix KPI system:
1. **Retroactive Progress Distribution** - Progress on newly created KPIs is now distributed across past months
2. **X-Matrix KPI Coloring Fix** - Health status now evaluates current month first, preventing false red statuses
3. **Trend & Coloring Documentation** - Added comprehensive explanation of all indicators

---

## 1. Retroactive Progress Distribution

### Problem
When creating a KPI mid-year with an existing current value > 0, all progress was attributed to the current month only, showing red status for past months with no actual value.

**Example:**
- Create KPI in March with 10% current value
- Jan, Feb show as "0% actual" (appears missed)
- Mar shows 10% actual (all progress lumped here)

### Solution
Progress is now **distributed proportionally across all past months** based on the target distribution method.

**Algorithm:**
1. Identify all months from start date to current date (past months)
2. Apply the same distribution weights (equal, linear, front-loaded) to these past months
3. Distribute the current value across past months using these weights
4. Future months remain with 0% actual

**Example (Equal Distribution, Jan-Dec KPI started in Jan):**
```
Current Value: 10%, Distribution: Equal
Months from Jan-Mar (3 months passed)
Weights: [1, 1, 1] (all equal)
Distribution of 10% progress:
  - Jan: 10% × (1/3) = 3.33%
  - Feb: 10% × (1/3) = 3.33%
  - Mar: 10% × (1/3) = 3.34% (handles rounding)
```

**Example (Linear Distribution, Jan-Dec KPI started in Jan):**
```
Current Value: 10%, Distribution: Linear (increasing)
Weights: [1, 2, 3] (proportional to position)
Total Weight: 6
Distribution of 10% progress:
  - Jan: 10% × (1/6) = 1.67%
  - Feb: 10% × (2/6) = 3.33%
  - Mar: 10% × (3/6) = 5.0%
```

### Implementation Files
- `src/app/manage/page.tsx` - `computeDistributedTargets()` function
- `src/components/shared/EntityModals.tsx` - `computeDistributedTargets()` function

---

## 2. X-Matrix KPI Color Fix

### Problem
KPIs showed red status (off-track) in the X-Matrix even when they exceeded the target for the current month, because health was evaluated on the "latest month with data" which might be a past month.

**Example:**
- Feb had 80% actual vs 100% target (off-track, red)
- Mar has 120% actual vs 110% target (on-track, green!)
- But X-Matrix shows RED because it was checking Feb's data

### Solution
Health status now **prioritizes the current month** before falling back to previous months.

**Algorithm:**
1. Check if the current month (today's month) has actual data
   - If YES: Use current month for health evaluation
   - If NO: Fall back to latest month with data
2. If no month has any data, default to "on-track"
3. Calculate variance % and compare to thresholds:
   - ≥ 0% = ON-TRACK (●)
   - -5% to 0% = AT-RISK (◐)
   - < -5% = OFF-TRACK (○)

### Implementation File
- `src/lib/kpi-calculations.ts` - `deriveHealth()` function

---

## 3. Color & Indicator System Documentation

### KPI Health Status (Status Column in Bowling Chart)

```
● ON-TRACK (Green)   → Variance % ≥ 0%         (Actual ≥ Target)
◐ AT-RISK (Yellow)   → -5% ≤ Variance % < 0%   (Target at risk but salvageable)
○ OFF-TRACK (Red)    → Variance % < -5%        (Significantly below target)
```

**Key Concept:** For metrics where "lower is better" (e.g., "Time to Market" in days, cost ratios), the variance sign is inverted:
- 100 days target, 95 days actual = -5% variance, but sign flips to +5% → **ON-TRACK** ✓
- 100 days target, 105 days actual = +5% variance, but sign flips to -5% → **AT-RISK** ⚠️

### Trend Indicator (Trend Column)

```
↑ UP      → Performance improving | Recent average > Earlier average
↓ DOWN    → Performance declining | Recent average < Earlier average
— STABLE  → Flat performance      | Change < 1% of target
```

**Algorithm:**
1. Collect the last 4 months with actual data (or fewer if not available)
2. Split into first half and second half
3. Calculate average for each half
4. Compare: `recent_avg - earlier_avg`
5. If change > 1% of latest target = TREND
6. For "lower is better" metrics, direction flips (decrease = improvement = UP)

**Example (Revenue in $M):**
```
Recent 4 months: [50, 52, 55, 58]
First half avg: (50 + 52) / 2 = 51
Second half avg: (55 + 58) / 2 = 56.5
Diff: 56.5 - 51 = 5.5
Target: 60
Threshold: 60 × 1% = 0.6
5.5 > 0.6 → Trend is ↑ UP
```

### Variance Bar (Below Each Month)

The colored bar below each month shows **monthly variance as a percentage**.

```
Width Calculation:
  width = 50% + variance_percent (clamped to 5-95%)
  
  50% = neutral (0% variance)
  60% = +10% variance (exceeding by 10%)
  40% = -10% variance (missing by 10%)
```

**Color Legend:**
```
■ Green  → Variance % ≥ 0%        (Exceeds target)
■ Yellow → -5% ≤ Variance % < 0%  (At risk)
■ Red    → Variance % < -5%       (Off-track)
```

**Example:**
```
Target: 100, Actual: 110
Variance: +10%
Variance %: ((110 - 100) / 100) × 100 = 10%
Bar width: 50% + 10% = 60% (extends 10% past center)
Bar color: Green (≥ 0%)
```

---

## Files Modified

### 1. `/src/app/manage/page.tsx`
- **Function:** `computeDistributedTargets()`
- **Changes:**
  - Added `currentValue` parameter (default 0)
  - Added retroactive distribution logic for past months
  - Changed return type to include `actual: number | null` instead of just `null`

### 2. `/src/components/shared/EntityModals.tsx`
- **Function:** `computeDistributedTargets()`
- **Changes:** Same as manage/page.tsx
- **Callers Updated:**
  - `previewMonthly` computation in `KPIForm`
  - `handleSubmit` monthly data calculation

### 3. `/src/lib/kpi-calculations.ts`
- **Function:** `deriveHealth()`
  - Now prioritizes current month before falling back
  - Added comprehensive documentation block
- **Function:** `deriveTrend()`
  - Added detailed documentation about trend calculation
  - Documented "lower is better" metric behavior

### 4. `/src/components/bowling-chart/BowlingChart.tsx`
- **Addition:** Comprehensive documentation block at top
- Explains:
  - Health status coloring system
  - Trend indicators and calculation
  - Variance bar system
  - Retroactive progress distribution

---

## Testing Scenarios

### Scenario 1: Retroactive Distribution
1. Create new KPI in March with:
   - Start Date: Jan 1
   - End Date: Dec 31
   - Current Value: 20%
   - Target: 100%
   - Distribution: Equal
2. ✓ Jan, Feb, Mar should each show ~6.67% actual
3. ✓ Apr-Dec should show 0% actual (future months)

### Scenario 2: Current Month Priority
1. Create KPI with historical data
2. Jan: 80 actual vs 100 target (80%, off-track)
3. Feb: 100 actual vs 100 target (100%, on-track)
4. Mar (today): View the KPI
5. ✓ Status should show based on Mar's data, not Feb's
6. ✓ If Mar shows green (exceeding), X-Matrix shows ● green

### Scenario 3: Trend Calculation
1. Create KPI with actual values: [70, 75, 80, 85]
2. ✓ Trend should show ↑ UP (improving performance)
3. If "lower is better" (days): [85, 80, 75, 70]
4. ✓ Trend should show ↑ UP (decreasing days = improving)

---

## Key Behavioral Changes

| Aspect | Before | After |
|--------|--------|-------|
| **New KPI Progress** | All attributed to current month | Distributed across past months |
| **Health Status** | Based on latest month with data | Based on current month (if available) |
| **X-Matrix Colors** | Could show red despite current month success | Accurate to current month |
| **Trend Noise** | Could be noisy on small changes | Filters 1% threshold noise |

---

## Notes

- **Month Determination:** Uses JavaScript `new Date().getMonth()` (0 = January)
- **Rounding:** Values rounded to 2 decimal places to handle floating point precision
- **Retroactive Cap:** Only distributes to months that have already passed (not future months)
- **No Data:** If a KPI has no monthly data at all, health defaults to "on-track" (safe assumption)
