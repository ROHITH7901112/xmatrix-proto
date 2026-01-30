// Global State Store using Zustand - with API integration

import { create } from 'zustand';
import { ViewState, SelectedElement, HoveredElement, FilterState, XMatrixData, Relationship, RelationshipStrength, LongTermObjective, AnnualObjective, Initiative, KPI, Owner } from './types';
import { xMatrixData as mockData } from './mock-data';

interface XMatrixStore {
  // Data
  data: XMatrixData;
  isLoading: boolean;
  error: string | null;

  // View State
  viewState: ViewState;

  // Filter State
  filterState: FilterState;

  // Data Loading Actions
  fetchData: () => Promise<void>;
  refreshData: () => Promise<void>;

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
  updateLongTermObjective: (id: string, data: Partial<LongTermObjective>) => Promise<void>;
  deleteLongTermObjective: (id: string) => Promise<void>;

  // CRUD Actions - Annual Objectives
  addAnnualObjective: () => Promise<void>;
  updateAnnualObjective: (id: string, data: Partial<AnnualObjective>) => Promise<void>;
  deleteAnnualObjective: (id: string) => Promise<void>;

  // CRUD Actions - Initiatives
  addInitiative: () => Promise<void>;
  updateInitiative: (id: string, data: Partial<Initiative>) => Promise<void>;
  deleteInitiative: (id: string) => Promise<void>;

  // CRUD Actions - KPIs
  addKPI: () => Promise<void>;
  updateKPI: (id: string, data: Partial<KPI>) => Promise<void>;
  deleteKPI: (id: string) => Promise<void>;

  // CRUD Actions - Owners
  addOwner: () => Promise<void>;
  updateOwner: (id: string, data: Partial<Owner>) => Promise<void>;
  deleteOwner: (id: string) => Promise<void>;

  // Computed
  getRelatedElements: (elementId: string, elementType: string) => Set<string>;
  getHighlightedElements: () => Set<string>;
  getActiveRelationships: () => Relationship[];
}

const initialViewState: ViewState = {
  rotation: 0,
  selectedElement: null,
  hoveredElement: null,
  zoom: 1,
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

// Generate unique IDs
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useXMatrixStore = create<XMatrixStore>((set, get) => ({
  data: mockData, // Start with mock data as fallback
  isLoading: false,
  error: null,
  viewState: initialViewState,
  filterState: initialFilterState,

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
        set({ isLoading: false });
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
    set((state) => ({ viewState: { ...state.viewState, zoom } })),

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
  toggleRelationship: (sourceId, sourceType, targetId, targetType) => {
    const state = get();
    const { relationships } = state.data;
    const existingIndex = relationships.findIndex(
      (r) => (r.sourceId === sourceId && r.targetId === targetId) ||
        (r.sourceId === targetId && r.targetId === sourceId)
    );

    let newRelationships: Relationship[];
    let apiAction: Promise<Response>;

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
      apiAction = fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmatrixId: state.data.id, ...newRel }),
      });
    } else {
      const existing = relationships[existingIndex];
      if (existing.strength === 'primary') {
        // Primary → Secondary
        newRelationships = [...relationships];
        newRelationships[existingIndex] = { ...existing, strength: 'secondary' as RelationshipStrength };
        apiAction = fetch('/api/relationships', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            xmatrixId: state.data.id,
            sourceId: existing.sourceId,
            targetId: existing.targetId,
            strength: 'secondary',
          }),
        });
      } else {
        // Secondary → Remove (none)
        newRelationships = relationships.filter((_, i) => i !== existingIndex);
        apiAction = fetch(`/api/relationships?xmatrixId=${state.data.id}&sourceId=${existing.sourceId}&targetId=${existing.targetId}`, {
          method: 'DELETE',
        });
      }
    }

    // Optimistic update
    set({
      data: {
        ...state.data,
        relationships: newRelationships,
      },
    });

    // Fire API call (don't await for better UX)
    apiAction.catch((error) => {
      console.error('Error updating relationship:', error);
      // Revert on error
      get().refreshData();
    });
  },

  // Add new Long-Term Objective
  addLongTermObjective: async () => {
    const state = get();
    const count = state.data.longTermObjectives.length + 1;
    const newLTO: LongTermObjective = {
      id: generateId('lto'),
      code: `LTO-${count}`,
      title: `New Long-Term Objective ${count}`,
      description: 'Click to edit description',
      timeframe: '2025-2028',
      health: 'on-track',
    };

    // Optimistic update
    set({
      data: {
        ...state.data,
        longTermObjectives: [...state.data.longTermObjectives, newLTO],
      },
    });

    try {
      await fetch('/api/objectives/long-term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmatrixId: state.data.id, ...newLTO }),
      });
    } catch (error) {
      console.error('Error creating LTO:', error);
      get().refreshData();
    }
  },

  updateLongTermObjective: async (id: string, data: Partial<LongTermObjective>) => {
    const state = get();

    // Optimistic update
    set({
      data: {
        ...state.data,
        longTermObjectives: state.data.longTermObjectives.map(lto =>
          lto.id === id ? { ...lto, ...data } : lto
        ),
      },
    });

    try {
      await fetch(`/api/objectives/long-term/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error updating LTO:', error);
      get().refreshData();
    }
  },

  deleteLongTermObjective: async (id: string) => {
    const state = get();

    // Optimistic update
    set({
      data: {
        ...state.data,
        longTermObjectives: state.data.longTermObjectives.filter(lto => lto.id !== id),
      },
    });

    try {
      await fetch(`/api/objectives/long-term/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting LTO:', error);
      get().refreshData();
    }
  },

  // Add new Annual Objective
  addAnnualObjective: async () => {
    const state = get();
    const count = state.data.annualObjectives.length + 1;
    const newAO: AnnualObjective = {
      id: generateId('ao'),
      code: `AO-${count}`,
      title: `New Annual Objective ${count}`,
      description: 'Click to edit description',
      year: 2026,
      health: 'on-track',
      progress: 0,
    };

    // Optimistic update
    set({
      data: {
        ...state.data,
        annualObjectives: [...state.data.annualObjectives, newAO],
      },
    });

    try {
      await fetch('/api/objectives/annual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmatrixId: state.data.id, ...newAO }),
      });
    } catch (error) {
      console.error('Error creating AO:', error);
      get().refreshData();
    }
  },

  updateAnnualObjective: async (id: string, data: Partial<AnnualObjective>) => {
    const state = get();

    // Optimistic update
    set({
      data: {
        ...state.data,
        annualObjectives: state.data.annualObjectives.map(ao =>
          ao.id === id ? { ...ao, ...data } : ao
        ),
      },
    });

    try {
      await fetch(`/api/objectives/annual/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error updating AO:', error);
      get().refreshData();
    }
  },

  deleteAnnualObjective: async (id: string) => {
    const state = get();

    // Optimistic update
    set({
      data: {
        ...state.data,
        annualObjectives: state.data.annualObjectives.filter(ao => ao.id !== id),
      },
    });

    try {
      await fetch(`/api/objectives/annual/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting AO:', error);
      get().refreshData();
    }
  },

  // Add new Initiative
  addInitiative: async () => {
    const state = get();
    const count = state.data.initiatives.length + 1;
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

    // Optimistic update
    set({
      data: {
        ...state.data,
        initiatives: [...state.data.initiatives, newInit],
      },
    });

    try {
      await fetch('/api/initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmatrixId: state.data.id, ...newInit }),
      });
    } catch (error) {
      console.error('Error creating initiative:', error);
      get().refreshData();
    }
  },

  updateInitiative: async (id: string, data: Partial<Initiative>) => {
    const state = get();

    // Optimistic update
    set({
      data: {
        ...state.data,
        initiatives: state.data.initiatives.map(init =>
          init.id === id ? { ...init, ...data } : init
        ),
      },
    });

    try {
      await fetch(`/api/initiatives/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error updating initiative:', error);
      get().refreshData();
    }
  },

  deleteInitiative: async (id: string) => {
    const state = get();

    // Optimistic update
    set({
      data: {
        ...state.data,
        initiatives: state.data.initiatives.filter(init => init.id !== id),
      },
    });

    try {
      await fetch(`/api/initiatives/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting initiative:', error);
      get().refreshData();
    }
  },

  // Add new KPI
  addKPI: async () => {
    const state = get();
    const count = state.data.kpis.length + 1;
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

    // Optimistic update
    set({
      data: {
        ...state.data,
        kpis: [...state.data.kpis, newKPI],
      },
    });

    try {
      await fetch('/api/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmatrixId: state.data.id, ...newKPI }),
      });
    } catch (error) {
      console.error('Error creating KPI:', error);
      get().refreshData();
    }
  },

  updateKPI: async (id: string, data: Partial<KPI>) => {
    const state = get();

    // Optimistic update
    set({
      data: {
        ...state.data,
        kpis: state.data.kpis.map(kpi =>
          kpi.id === id ? { ...kpi, ...data } : kpi
        ),
      },
    });

    try {
      await fetch(`/api/kpis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error updating KPI:', error);
      get().refreshData();
    }
  },

  deleteKPI: async (id: string) => {
    const state = get();

    // Optimistic update
    set({
      data: {
        ...state.data,
        kpis: state.data.kpis.filter(kpi => kpi.id !== id),
      },
    });

    try {
      await fetch(`/api/kpis/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting KPI:', error);
      get().refreshData();
    }
  },

  // Add new Owner
  addOwner: async () => {
    const state = get();
    const count = state.data.owners.length + 1;
    const newOwner: Owner = {
      id: generateId('owner'),
      name: `Owner ${count}`,
      role: 'Team Member',
      avatar: '',
      initials: `O${count}`,
      responsibilityType: 'responsible',
    };

    // Optimistic update
    set({
      data: {
        ...state.data,
        owners: [...state.data.owners, newOwner],
      },
    });

    try {
      await fetch('/api/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xmatrixId: state.data.id, ...newOwner }),
      });
    } catch (error) {
      console.error('Error creating owner:', error);
      get().refreshData();
    }
  },

  updateOwner: async (id: string, data: Partial<Owner>) => {
    const state = get();

    // Optimistic update
    set({
      data: {
        ...state.data,
        owners: state.data.owners.map(owner =>
          owner.id === id ? { ...owner, ...data } : owner
        ),
      },
    });

    try {
      await fetch(`/api/owners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error updating owner:', error);
      get().refreshData();
    }
  },

  deleteOwner: async (id: string) => {
    const state = get();

    // Optimistic update
    set({
      data: {
        ...state.data,
        owners: state.data.owners.filter(owner => owner.id !== id),
      },
    });

    try {
      await fetch(`/api/owners/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting owner:', error);
      get().refreshData();
    }
  },

  getRelatedElements: (elementId: string, elementType: string) => {
    const { relationships, longTermObjectives, annualObjectives, initiatives, kpis, owners } = get().data;
    const related = new Set<string>();
    related.add(elementId);

    // Helper: Check if an element ID exists in the current data
    const elementExists = (id: string, type: string): boolean => {
      switch (type) {
        case 'lto': return longTermObjectives.some(e => e.id === id);
        case 'ao': return annualObjectives.some(e => e.id === id);
        case 'initiative': return initiatives.some(e => e.id === id);
        case 'kpi': return kpis.some(e => e.id === id);
        case 'owner': return owners.some(e => e.id === id);
        default: return false;
      }
    };

    // Helpers
    const getConnections = (id: string) => {
      const connections: { id: string; type: string }[] = [];
      relationships.forEach(rel => {
        if (rel.sourceId === id && elementExists(rel.targetId, rel.targetType)) {
          connections.push({ id: rel.targetId, type: rel.targetType });
        }
        if (rel.targetId === id && elementExists(rel.sourceId, rel.sourceType)) {
          connections.push({ id: rel.sourceId, type: rel.sourceType });
        }
      });
      return connections;
    };

    const getRank = (type: string) => {
      switch (type) {
        case 'lto': return 0;
        case 'ao': return 1;
        case 'initiative': return 2;
        case 'kpi': return 3;
        case 'owner': return 3;
        default: return 99;
      }
    };

    // Recursive Traversal
    const traverse = (currentId: string, currentType: string, direction: 'up' | 'down') => {
      const currentRank = getRank(currentType);
      const connections = getConnections(currentId);

      connections.forEach(conn => {
        // Prevent cycles
        if (related.has(conn.id)) return;

        const connRank = getRank(conn.type);
        let isValidStep = false;

        if (direction === 'up') {
          // Going to Root: Look for LOWER rank number (0 is root)
          isValidStep = connRank < currentRank;
        } else {
          // Going to Leaves: Look for HIGHER rank number
          isValidStep = connRank > currentRank;
        }

        if (isValidStep) {
          related.add(conn.id);
          traverse(conn.id, conn.type, direction);
        }
      });
    };

    // Highlight Ancestors (Path to Root)
    traverse(elementId, elementType, 'up');

    // Highlight Descendants (Tree View)
    traverse(elementId, elementType, 'down');

    return related;
  },

  getHighlightedElements: () => {
    const { viewState } = get();
    const activeElement = viewState.hoveredElement || viewState.selectedElement;

    if (!activeElement) return new Set<string>();

    return get().getRelatedElements(activeElement.id, activeElement.type);
  },

  getActiveRelationships: () => {
    const { viewState, data } = get();
    const activeElement = viewState.hoveredElement || viewState.selectedElement;

    if (!activeElement) return [];

    return data.relationships.filter(
      (rel) => rel.sourceId === activeElement.id || rel.targetId === activeElement.id
    );
  },
}));
