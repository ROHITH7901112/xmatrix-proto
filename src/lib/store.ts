// Global State Store using Zustand - with API integration

import { create } from 'zustand';
import { ViewState, SelectedElement, HoveredElement, FilterState, XMatrixData, Relationship, RelationshipStrength, LongTermObjective, AnnualObjective, Initiative, KPI, Owner, EditModeState, MonthlyKPIData } from './types';
// App fetches real data via API - no mock data fallback
import { computeVariance, deriveHealth, deriveTrend, isLowerBetter, getCurrentValue } from './kpi-calculations';

// Deep clone helper for draft state
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Highlight debug mode (client-side only)
// Enable with either:
// 1) localStorage.setItem('xmatrix-highlight-debug', '1')
// 2) window.__XMATRIX_HIGHLIGHT_DEBUG__ = true
let lastHighlightDebugSignature = '';

const isHighlightDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;

  const storageFlag = window.localStorage.getItem('xmatrix-highlight-debug');
  if (storageFlag === '1' || storageFlag === 'true') return true;

  type DebugWindow = Window & { __XMATRIX_HIGHLIGHT_DEBUG__?: boolean };
  return Boolean((window as DebugWindow).__XMATRIX_HIGHLIGHT_DEBUG__);
};

interface XMatrixStore {
  // Data
  data: XMatrixData;
  isLoading: boolean;
  error: string | null;

  // View State
  viewState: ViewState;

  // Filter State
  filterState: FilterState;

  // Edit Mode State
  editModeState: EditModeState;

  // Data Loading Actions
  fetchData: () => Promise<void>;
  refreshData: () => Promise<void>;

  // Edit Mode Actions
  enterEditMode: () => void;
  exitEditMode: (saveChanges: boolean) => Promise<void>;
  isEditMode: () => boolean;
  getActiveData: () => XMatrixData;

  // Actions
  setRotation: (rotation: 0 | 90 | 180 | 270) => void;
  rotateClockwise: () => void;
  setSelectedElement: (element: SelectedElement | null) => void;
  setHoveredElement: (element: HoveredElement | null) => void;
  setZoom: (zoom: number) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setTimeHorizon: (horizon: 'current' | 'future') => void;

  // Filter Actions
  setOwnerFilter: (owners: string[]) => void;
  setHealthFilter: (health: ('on-track' | 'at-risk' | 'off-track')[]) => void;
  clearFilters: () => void;

  // Relationship Actions
  toggleRelationship: (sourceId: string, sourceType: 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner', targetId: string, targetType: 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner') => void;

  // CRUD Actions - Long-Term Objectives
  addLongTermObjective: () => Promise<void>;
  createLongTermObjective: (lto: LongTermObjective) => void;
  updateLongTermObjective: (id: string, data: Partial<LongTermObjective>) => Promise<void>;
  deleteLongTermObjective: (id: string) => Promise<void>;

  // CRUD Actions - Annual Objectives
  addAnnualObjective: () => Promise<void>;
  createAnnualObjective: (ao: AnnualObjective) => void;
  updateAnnualObjective: (id: string, data: Partial<AnnualObjective>) => Promise<void>;
  deleteAnnualObjective: (id: string) => Promise<void>;

  // CRUD Actions - Initiatives
  addInitiative: () => Promise<void>;
  createInitiative: (initiative: Initiative) => void;
  updateInitiative: (id: string, data: Partial<Initiative>) => Promise<void>;
  deleteInitiative: (id: string) => Promise<void>;

  // CRUD Actions - KPIs
  addKPI: () => Promise<void>;
  createKPI: (kpi: KPI) => void;
  updateKPI: (id: string, data: Partial<KPI>) => Promise<void>;
  deleteKPI: (id: string) => Promise<void>;

  // CRUD Actions - Owners
  addOwner: () => Promise<void>;
  createOwner: (owner: Owner) => void;
  updateOwner: (id: string, data: Partial<Owner>) => Promise<void>;
  deleteOwner: (id: string) => Promise<void>;

  // Bowling Chart Actions
  loadBowlingChartYear: (year: number) => Promise<void>;
  updateMonthlyKpiData: (kpiId: string, year: number, month: string, patch: { target?: number; actual?: number | null }) => Promise<void>;
  refreshKpiMonthlyData: (kpiId: string, year?: number) => Promise<void>;

  // Computed
  getRelatedElements: (elementId: string, elementType: string) => Set<string>;
  getHighlightedElements: () => Set<string>;
  getActiveRelationships: () => Relationship[];
}

const initialViewState: ViewState = {
  rotation: 0,
  selectedElement: null,
  hoveredElement: null,
  zoom: 0.75,
  isDarkMode: true,
  sidebarCollapsed: false,
  timeHorizon: 'current',
};

const initialFilterState: FilterState = {
  owners: [],
  health: [],
  objectives: [],
  timeRange: null,
};

const initialEditModeState: EditModeState = {
  mode: 'view',
  draftData: null,
  hasUnsavedChanges: false,
  lastSavedAt: null,
};

// Generate unique IDs
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useXMatrixStore = create<XMatrixStore>((set, get) => ({
  // Start with an empty XMatrix until `fetchData()` populates it from the server
  // Using empty data structure to avoid showing stale mock data on first load
  data: {
    id: '',
    name: '',
    vision: '',
    trueNorth: '',
    periodStart: 0,
    periodEnd: 0,
    themes: [],
    longTermObjectives: [],
    annualObjectives: [],
    initiatives: [],
    kpis: [],
    owners: [],
    relationships: [],
  },
  isLoading: true, // Start as loading to prevent UI flash
  error: null,
  viewState: initialViewState,
  filterState: initialFilterState,
  editModeState: initialEditModeState,

  // Fetch data from API
  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/xmatrix');
      if (!response.ok) throw new Error('Failed to fetch data');
      const matrices = await response.json();
      if (matrices.length > 0) {
        set({ data: matrices[0], isLoading: false });
      } else {
        // No records exist yet: create a blank real matrix (not mock data)
        const currentYear = new Date().getFullYear();
        const createResponse = await fetch('/api/xmatrix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `xmatrix-${currentYear}`,
            name: `Strategy ${currentYear}`,
            vision: '',
            trueNorth: '',
            periodStart: currentYear,
            periodEnd: currentYear + 2,
            themes: [],
          }),
        });

        if (!createResponse.ok) throw new Error('Failed to initialize XMatrix');
        const createdMatrix = await createResponse.json();
        set({ data: createdMatrix, isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      set({ error: 'Failed to load data', isLoading: false });
    }
  },

  refreshData: async () => {
    const { data } = get();
    try {
      const response = await fetch(`/api/xmatrix/${data.id}`);
      if (!response.ok) throw new Error('Failed to refresh data');
      const refreshedData = await response.json();
      set({ data: refreshedData });
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  },

  // Edit Mode Actions
  enterEditMode: () => {
    const { data } = get();
    set({
      editModeState: {
        mode: 'edit',
        draftData: deepClone(data),
        hasUnsavedChanges: false,
        lastSavedAt: null,
      },
    });
  },

  exitEditMode: async (saveChanges: boolean) => {
    const { editModeState, data: originalData } = get();
    
    if (saveChanges && editModeState.draftData) {
      // Persist all draft changes to the server via atomic bulk sync
      try {
        const draft = editModeState.draftData;
        
        // Single PATCH request: server diffs entities + replaces relationships in one transaction
        const response = await fetch(`/api/xmatrix/${draft.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draft,
            original: originalData,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to save changes');
        }

        // Server returns the freshly-read authoritative state from DB
        const savedData = await response.json();

        // Commit server state as the new source of truth
        set({
          data: savedData,
          editModeState: {
            mode: 'view',
            draftData: null,
            hasUnsavedChanges: false,
            lastSavedAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Error saving changes:', error);
        throw error;
      }
    } else {
      // Discard draft changes — original data untouched
      set({
        editModeState: {
          mode: 'view',
          draftData: null,
          hasUnsavedChanges: false,
          lastSavedAt: null,
        },
      });
    }
  },

  isEditMode: () => {
    return get().editModeState.mode === 'edit';
  },

  getActiveData: () => {
    const { editModeState, data } = get(); // get() is from zustand which gets the current state of the store
    return editModeState.mode === 'edit' && editModeState.draftData
      ? editModeState.draftData
      : data;
  },

  setRotation: (rotation) =>
    set((state) => ({ viewState: { ...state.viewState, rotation } })),

  rotateClockwise: () =>
    set((state) => {
      const rotations: (0 | 90 | 180 | 270)[] = [0, 90, 180, 270];
      const currentIndex = rotations.indexOf(state.viewState.rotation);
      const nextIndex = (currentIndex + 1) % 4;
      return { viewState: { ...state.viewState, rotation: rotations[nextIndex] } };
    }),

  setSelectedElement: (element) =>
    set((state) => ({ viewState: { ...state.viewState, selectedElement: element } })),

  setHoveredElement: (element) =>
    set((state) => ({ viewState: { ...state.viewState, hoveredElement: element } })),

  setZoom: (zoom) =>
    set((state) => ({
      viewState: {
        ...state.viewState,
        zoom: Math.max(0.6, Math.min(1.8, Number(zoom.toFixed(2))))
      }
    })),

  toggleDarkMode: () =>
    set((state) => ({ viewState: { ...state.viewState, isDarkMode: !state.viewState.isDarkMode } })),

  toggleSidebar: () =>
    set((state) => ({ viewState: { ...state.viewState, sidebarCollapsed: !state.viewState.sidebarCollapsed } })),

  setTimeHorizon: (horizon) =>
    set((state) => ({ viewState: { ...state.viewState, timeHorizon: horizon } })),

  setOwnerFilter: (owners) =>
    set((state) => ({ filterState: { ...state.filterState, owners } })),

  setHealthFilter: (health) =>
    set((state) => ({ filterState: { ...state.filterState, health } })),

  clearFilters: () => set({ filterState: initialFilterState }),

  // Toggle relationship: none → primary → secondary → none
  // Only works in Edit Mode - modifies draft state
  toggleRelationship: (sourceId, sourceType, targetId, targetType) => {
    const state = get();
    
    // Block relationship changes in view mode
    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    const { relationships } = draftData;
    const existingIndex = relationships.findIndex(
      (r) => (r.sourceId === sourceId && r.targetId === targetId) ||
        (r.sourceId === targetId && r.targetId === sourceId)
    );

    let newRelationships: Relationship[];

    if (existingIndex === -1) {
      // No relationship exists → create primary
      const newRel: Relationship = {
        sourceId,
        sourceType,
        targetId,
        targetType,
        strength: 'primary' as RelationshipStrength,
      };
      newRelationships = [...relationships, newRel];
    } else {
      const existing = relationships[existingIndex];
      if (existing.strength === 'primary') {
        // Primary → Secondary
        newRelationships = [...relationships];
        newRelationships[existingIndex] = { ...existing, strength: 'secondary' as RelationshipStrength };
      } else {
        // Secondary → Remove (none)
        newRelationships = relationships.filter((_, i) => i !== existingIndex);
      }
    }

    // Update draft state only
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          relationships: newRelationships,
        },
        hasUnsavedChanges: true,
      },
    });
  },

  // Add new Long-Term Objective - works with draft in edit mode
  addLongTermObjective: async () => {
    const state = get();
    
    // Only allow in edit mode
    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    const count = draftData.longTermObjectives.length + 1;
    const newLTO: LongTermObjective = {
      id: generateId('lto'),
      code: `LTO-${count}`,
      title: `New Long-Term Objective ${count}`,
      description: 'Click to edit description',
      timeframe: '2025-2028',
      health: 'on-track',
    };

    // Update draft state
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          longTermObjectives: [...draftData.longTermObjectives, newLTO],
        },
        hasUnsavedChanges: true,
      },
    });
  },

  createLongTermObjective: (lto: LongTermObjective) => {
    const state = get();
    
    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          longTermObjectives: [...draftData.longTermObjectives, lto],
        },
        hasUnsavedChanges: true,
      },
    });
  },

  updateLongTermObjective: async (id: string, updateData: Partial<LongTermObjective>) => {
    const state = get();

    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          longTermObjectives: draftData.longTermObjectives.map(lto =>
            lto.id === id ? { ...lto, ...updateData } : lto
          ),
        },
        hasUnsavedChanges: true,
      },
    });
  },

  deleteLongTermObjective: async (id: string) => {
    const state = get();

    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          longTermObjectives: draftData.longTermObjectives.filter(lto => lto.id !== id),
          relationships: draftData.relationships.filter(
            r => r.sourceId !== id && r.targetId !== id
          ),
        },
        hasUnsavedChanges: true,
      },
    });
  },

  // Add new Annual Objective - works with draft in edit mode
  addAnnualObjective: async () => {
    const state = get();

    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    const count = draftData.annualObjectives.length + 1;
    const newAO: AnnualObjective = {
      id: generateId('ao'),
      code: `AO-${count}`,
      title: `New Annual Objective ${count}`,
      description: 'Click to edit description',
      year: 2026,
      health: 'on-track',
      progress: 0,
    };

    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          annualObjectives: [...draftData.annualObjectives, newAO],
        },
        hasUnsavedChanges: true,
      },
    });
  },

  createAnnualObjective: (ao: AnnualObjective) => {
    const state = get();
    
    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          annualObjectives: [...draftData.annualObjectives, ao],
        },
        hasUnsavedChanges: true,
      },
    });
  },

  updateAnnualObjective: async (id: string, updateData: Partial<AnnualObjective>) => {
    const state = get();

    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          annualObjectives: draftData.annualObjectives.map(ao =>
            ao.id === id ? { ...ao, ...updateData } : ao
          ),
        },
        hasUnsavedChanges: true,
      },
    });
  },

  deleteAnnualObjective: async (id: string) => {
    const state = get();

    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          annualObjectives: draftData.annualObjectives.filter(ao => ao.id !== id),
          relationships: draftData.relationships.filter(
            r => r.sourceId !== id && r.targetId !== id
          ),
        },
        hasUnsavedChanges: true,
      },
    });
  },

  // Add new Initiative - works with draft in edit mode
  addInitiative: async () => {
    const state = get();

    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    const count = draftData.initiatives.length + 1;
    const newInit: Initiative = {
      id: generateId('init'),
      code: `I-${count}`,
      title: `New Initiative ${count}`,
      description: 'Click to edit description',
      priority: 'medium',
      health: 'on-track',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    };

    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          initiatives: [...draftData.initiatives, newInit],
        },
        hasUnsavedChanges: true,
      },
    });
  },

  createInitiative: (initiative: Initiative) => {
    const state = get();
    
    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          initiatives: [...draftData.initiatives, initiative],
        },
        hasUnsavedChanges: true,
      },
    });
  },

  updateInitiative: async (id: string, updateData: Partial<Initiative>) => {
    const state = get();

    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          initiatives: draftData.initiatives.map(init =>
            init.id === id ? { ...init, ...updateData } : init
          ),
        },
        hasUnsavedChanges: true,
      },
    });
  },

  deleteInitiative: async (id: string) => {
    const state = get();

    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          initiatives: draftData.initiatives.filter(init => init.id !== id),
          relationships: draftData.relationships.filter(
            r => r.sourceId !== id && r.targetId !== id
          ),
        },
        hasUnsavedChanges: true,
      },
    });
  },

  // Add new KPI - works with draft in edit mode
  addKPI: async () => {
    const state = get();

    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    const count = draftData.kpis.length + 1;
    const newKPI: KPI = {
      id: generateId('kpi'),
      code: `K-${count}`,
      title: `New KPI ${count}`,
      unit: '%',
      currentValue: 0,
      targetValue: 100,
      health: 'on-track',
      trend: 'stable',
      ownerIds: [],
      monthlyData: [],
    };

    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          kpis: [...draftData.kpis, newKPI],
        },
        hasUnsavedChanges: true,
      },
    });
  },

  createKPI: (kpi: KPI) => {
    const state = get();
    
    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          kpis: [...draftData.kpis, kpi],
        },
        hasUnsavedChanges: true,
      },
    });
  },

  updateKPI: async (id: string, updateData: Partial<KPI>) => {
    const state = get();

    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          kpis: draftData.kpis.map(kpi =>
            kpi.id === id ? { ...kpi, ...updateData } : kpi
          ),
        },
        hasUnsavedChanges: true,
      },
    });
  },

  deleteKPI: async (id: string) => {
    const state = get();

    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          kpis: draftData.kpis.filter(kpi => kpi.id !== id),
          relationships: draftData.relationships.filter(
            r => r.sourceId !== id && r.targetId !== id
          ),
        },
        hasUnsavedChanges: true,
      },
    });
  },

  // Add new Owner - works with draft in edit mode
  addOwner: async () => {
    const state = get();

    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    const count = draftData.owners.length + 1;
    const newOwner: Owner = {
      id: generateId('owner'),
      name: `Owner ${count}`,
      role: 'Team Member',
      avatar: '',
      initials: `O${count}`,
      responsibilityType: 'responsible',
    };

    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          owners: [...draftData.owners, newOwner],
        },
        hasUnsavedChanges: true,
      },
    });
  },

  createOwner: (owner: Owner) => {
    const state = get();
    
    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          owners: [...draftData.owners, owner],
        },
        hasUnsavedChanges: true,
      },
    });
  },

  updateOwner: async (id: string, updateData: Partial<Owner>) => {
    const state = get();

    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          owners: draftData.owners.map(owner =>
            owner.id === id ? { ...owner, ...updateData } : owner
          ),
        },
        hasUnsavedChanges: true,
      },
    });
  },

  deleteOwner: async (id: string) => {
    const state = get();

    if (state.editModeState.mode !== 'edit' || !state.editModeState.draftData) {
      return;
    }

    const draftData = state.editModeState.draftData;
    set({
      editModeState: {
        ...state.editModeState,
        draftData: {
          ...draftData,
          owners: draftData.owners.filter(owner => owner.id !== id),
          relationships: draftData.relationships.filter(
            r => r.sourceId !== id && r.targetId !== id
          ),
          kpis: draftData.kpis.map(kpi => ({
            ...kpi,
            ownerIds: kpi.ownerIds.filter(ownerId => ownerId !== id),
          })),
        },
        hasUnsavedChanges: true,
      },
    });
  },

  getRelatedElements: (elementId: string, elementType: string) => {
    const activeData = get().getActiveData();
    const { relationships } = activeData;

    // Ignore dangling relationships that point to deleted/missing entities.
    // These stale rows can otherwise cause "ghost" highlights.
    const validEntityIds = new Set<string>([
      ...activeData.longTermObjectives.map((e) => e.id),
      ...activeData.annualObjectives.map((e) => e.id),
      ...activeData.initiatives.map((e) => e.id),
      ...activeData.kpis.map((e) => e.id),
      ...activeData.owners.map((e) => e.id),
    ]);

    const validRelationships = relationships.filter(
      (rel) => validEntityIds.has(rel.sourceId) && validEntityIds.has(rel.targetId)
    );

    const related = new Set<string>();
    related.add(elementId);

    type MatrixEntityType = 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner';

    const getNeighborsByType = (fromIds: Set<string>, targetType: MatrixEntityType): Set<string> => {
      const result = new Set<string>();

      for (const rel of validRelationships) {
        if (fromIds.has(rel.sourceId) && rel.targetType === targetType) {
          result.add(rel.targetId);
        }
        if (fromIds.has(rel.targetId) && rel.sourceType === targetType) {
          result.add(rel.sourceId);
        }
      }

      return result;
    };

    const addAll = (...groups: Set<string>[]) => {
      for (const group of groups) {
        for (const id of group) related.add(id);
      }
    };

    const activeType = elementType as MatrixEntityType;

    if (activeType === 'lto') {
      const ltos = new Set<string>([elementId]);
      const aos = getNeighborsByType(ltos, 'ao');
      const initiatives = getNeighborsByType(aos, 'initiative');
      const kpis = getNeighborsByType(initiatives, 'kpi');
      const owners = getNeighborsByType(initiatives, 'owner');
      addAll(aos, initiatives, kpis, owners);
      return related;
    }

    if (activeType === 'ao') {
      const aos = new Set<string>([elementId]);
      const ltos = getNeighborsByType(aos, 'lto');
      const initiatives = getNeighborsByType(aos, 'initiative');
      const kpis = getNeighborsByType(initiatives, 'kpi');
      const owners = getNeighborsByType(initiatives, 'owner');
      addAll(ltos, initiatives, kpis, owners);
      return related;
    }

    if (activeType === 'initiative') {
      const initiatives = new Set<string>([elementId]);
      const aos = getNeighborsByType(initiatives, 'ao');
      const ltos = getNeighborsByType(aos, 'lto');
      const kpis = getNeighborsByType(initiatives, 'kpi');
      const owners = getNeighborsByType(initiatives, 'owner');
      addAll(aos, ltos, kpis, owners);
      return related;
    }

    if (activeType === 'kpi') {
      const kpis = new Set<string>([elementId]);
      const initiatives = getNeighborsByType(kpis, 'initiative');
      const aos = getNeighborsByType(initiatives, 'ao');
      const ltos = getNeighborsByType(aos, 'lto');
      const owners = getNeighborsByType(initiatives, 'owner');
      addAll(initiatives, aos, ltos, owners);
      return related;
    }

    if (activeType === 'owner') {
      const owners = new Set<string>([elementId]);
      const initiatives = getNeighborsByType(owners, 'initiative');
      const aos = getNeighborsByType(initiatives, 'ao');
      const ltos = getNeighborsByType(aos, 'lto');
      const kpis = getNeighborsByType(initiatives, 'kpi');
      addAll(initiatives, aos, ltos, kpis);
      return related;
    }

    // Fallback: direct explicit relationships only.
    for (const rel of validRelationships) {
      if (rel.sourceId === elementId) related.add(rel.targetId);
      if (rel.targetId === elementId) related.add(rel.sourceId);
    }

    return related;
  },

  getHighlightedElements: () => { 
    const { viewState } = get();
    const activeElement = viewState.hoveredElement || viewState.selectedElement;

    if (!activeElement) return new Set<string>(); 

    const highlighted = get().getRelatedElements(activeElement.id, activeElement.type);

    if (isHighlightDebugEnabled()) {
      const sortedIds = [...highlighted].sort();
      const signature = `${activeElement.type}:${activeElement.id}|${sortedIds.join(',')}`;

      if (signature !== lastHighlightDebugSignature) {
        lastHighlightDebugSignature = signature;

        const activeData = get().getActiveData();

        const buckets = {
          lto: sortedIds.filter((id) => activeData.longTermObjectives.some((e) => e.id === id)),
          ao: sortedIds.filter((id) => activeData.annualObjectives.some((e) => e.id === id)),
          initiative: sortedIds.filter((id) => activeData.initiatives.some((e) => e.id === id)),
          kpi: sortedIds.filter((id) => activeData.kpis.some((e) => e.id === id)),
          owner: sortedIds.filter((id) => activeData.owners.some((e) => e.id === id)),
        };

        console.groupCollapsed(
          `[XMatrix Highlight Debug] ${activeElement.type}:${activeElement.id} → ${sortedIds.length} highlighted`
        );
        console.log('Active Element:', activeElement);
        console.log('All Highlighted IDs:', sortedIds);
        console.log('By Section:', buckets);
        console.groupEnd();
      }
    }

    return highlighted;
  },

  getActiveRelationships: () => {
    const { viewState } = get();
    const activeData = get().getActiveData();
    const activeElement = viewState.hoveredElement || viewState.selectedElement;

    if (!activeElement) return [];

    return activeData.relationships.filter(
      (rel) => rel.sourceId === activeElement.id || rel.targetId === activeElement.id
    );
  },

  // Bowling Chart Actions
  loadBowlingChartYear: async (year: number) => {
    const { data } = get();
    if (!data.id) return;

    try {
      const response = await fetch(`/api/kpis?xmatrixId=${data.id}&year=${year}`);
      if (!response.ok) throw new Error('Failed to load KPI year data');
      const yearKpis = await response.json();

      set(state => ({
        data: {
          ...state.data,
          kpis: yearKpis,
        },
      }));
    } catch (error) {
      console.error('Error loading Bowling Chart year data:', error);
    }
  },

  updateMonthlyKpiData: async (kpiId: string, year: number, month: string, patch: { target?: number; actual?: number | null }) => {
    const state = get();
    const kpi = state.data.kpis.find(k => k.id === kpiId);
    if (!kpi) return;

    // 1. Optimistic update — compute new monthly data locally
    const updatedMonthlyData = kpi.monthlyData.map(m => {
      if (m.month !== month) return m;
      const newTarget = patch.target !== undefined ? patch.target : m.target;
      const newActual = patch.actual !== undefined ? patch.actual : m.actual;
      const newVariance = computeVariance(newActual, newTarget);
      return { ...m, year, target: newTarget, actual: newActual, variance: newVariance };
    });

    // If month doesn't exist in array, add it
    if (!updatedMonthlyData.find(m => m.month === month)) {
      const target = patch.target ?? 0;
      const actual = patch.actual !== undefined ? patch.actual : null;
      updatedMonthlyData.push({
        year,
        month,
        target,
        actual,
        variance: computeVariance(actual, target),
      });
    }

    // 2. Derive new health and trend deterministically
    const lowerBetter = isLowerBetter(kpi.unit, kpi.code);
    const newHealth = deriveHealth(updatedMonthlyData, undefined, lowerBetter, kpi.targetValue);
    const newTrend = deriveTrend(updatedMonthlyData, lowerBetter);
    const newCurrentValue = getCurrentValue(updatedMonthlyData);

    // 3. Apply optimistic update to store
    const updatedKpi: KPI = {
      ...kpi,
      monthlyData: updatedMonthlyData,
      health: newHealth,
      trend: newTrend,
      currentValue: newCurrentValue,
    };

    set(state => ({
      data: {
        ...state.data,
        kpis: state.data.kpis.map(k => k.id === kpiId ? updatedKpi : k),
      },
    }));

    // 4. Persist to backend — SINGLE API call combining monthly data + metadata
    try {
      const response = await fetch(`/api/kpis/${kpiId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          health: newHealth,
          trend: newTrend,
          currentValue: newCurrentValue,
          monthlyData: updatedMonthlyData, // Send complete monthly data array
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save KPI data');
      }
    } catch (error) {
      console.error('Error persisting KPI data, rolling back:', error);
      // Rollback — restore original KPI
      set(state => ({
        data: {
          ...state.data,
          kpis: state.data.kpis.map(k => k.id === kpiId ? kpi : k),
        },
      }));
    }
  },

  refreshKpiMonthlyData: async (kpiId: string, year: number = new Date().getFullYear()) => {
    try {
      const response = await fetch(`/api/kpis/${kpiId}/monthly?year=${year}`);
      if (!response.ok) return;
      const result = await response.json();
      const monthlyData: MonthlyKPIData[] = result.monthlyData.map((m: MonthlyKPIData) => ({
        ...m,
        year,
      }));

      set(state => ({
        data: {
          ...state.data,
          kpis: state.data.kpis.map(k => {
            if (k.id !== kpiId) return k;
            const lowerBetter = isLowerBetter(k.unit, k.code);
            return {
              ...k,
              monthlyData,
              health: deriveHealth(monthlyData, undefined, lowerBetter, k.targetValue),
              trend: deriveTrend(monthlyData, lowerBetter),
              currentValue: getCurrentValue(monthlyData),
            };
          }),
        },
      }));
    } catch (error) {
      console.error('Error refreshing KPI monthly data:', error);
    }
  },
}));
