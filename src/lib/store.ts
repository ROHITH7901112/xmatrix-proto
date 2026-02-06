// Global State Store using Zustand - with API integration

import { create } from 'zustand';
import { ViewState, SelectedElement, HoveredElement, FilterState, XMatrixData, Relationship, RelationshipStrength, LongTermObjective, AnnualObjective, Initiative, KPI, Owner, EditModeState } from './types';
import { xMatrixData as mockData } from './mock-data';

// Deep clone helper for draft state
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

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

const initialEditModeState: EditModeState = {
  mode: 'view',
  draftData: null,
  hasUnsavedChanges: false,
  lastSavedAt: null,
};

// Generate unique IDs
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useXMatrixStore = create<XMatrixStore>((set, get) => ({
  data: mockData, // Start with mock data as fallback
  isLoading: false,
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
    const { editModeState } = get();
    
    if (saveChanges && editModeState.draftData) {
      // Persist all draft changes to the server
      try {
        const draft = editModeState.draftData;
        
        // Sync relationships
        await fetch('/api/relationships', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            xmatrixId: draft.id,
            relationships: draft.relationships,
            sync: true,
          }),
        });

        // Commit draft to main data
        set({
          data: draft,
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
      // Discard draft changes
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
    const { editModeState, data } = get();
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
    const { relationships, longTermObjectives, annualObjectives, initiatives, kpis, owners } = activeData;
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
        case 'owner': return 4;
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

        // Special case: KPI <-> Owner (they should always highlight each other)
        if ((currentType === 'kpi' && conn.type === 'owner') || 
            (currentType === 'owner' && conn.type === 'kpi')) {
          isValidStep = true;
        } else if (direction === 'up') {
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
    const { viewState } = get();
    const activeData = get().getActiveData();
    const activeElement = viewState.hoveredElement || viewState.selectedElement;

    if (!activeElement) return [];

    return activeData.relationships.filter(
      (rel) => rel.sourceId === activeElement.id || rel.targetId === activeElement.id
    );
  },
}));
