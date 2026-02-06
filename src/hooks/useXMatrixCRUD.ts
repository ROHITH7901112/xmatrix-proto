
import { useState } from 'react';
import { useXMatrixStore } from '@/lib/store';
import { LongTermObjective, AnnualObjective, Initiative, KPI, Owner, EntityType } from '@/lib/types';

export function useXMatrixCRUD() {
    const store = useXMatrixStore();
    const { 
        editModeState, 
        getActiveData, 
        createLongTermObjective,
        updateLongTermObjective, 
        deleteLongTermObjective, 
        createAnnualObjective,
        updateAnnualObjective, 
        deleteAnnualObjective, 
        createInitiative,
        updateInitiative, 
        deleteInitiative, 
        createKPI,
        updateKPI, 
        deleteKPI, 
        createOwner,
        updateOwner, 
        deleteOwner 
    } = store;
    const data = getActiveData();
    const isEditMode = editModeState.mode === 'edit';

    const [modalType, setModalType] = useState<EntityType | null>(null);
    const [editingItem, setEditingItem] = useState<LongTermObjective | AnnualObjective | Initiative | KPI | Owner | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Helper functions
    const openAddModal = (type: EntityType) => {
        setEditingItem(null);
        setModalType(type);
    };

    const openEditModal = (type: EntityType, item: LongTermObjective | AnnualObjective | Initiative | KPI | Owner) => {
        setEditingItem(item);
        setModalType(type);
    };

    const closeModal = () => {
        setModalType(null);
        setEditingItem(null);
    };

    // CRUD Handlers - LTO
    const handleCreateLTO = async (lto: LongTermObjective) => {
        if (!data) return;
        setIsSaving(true);
        try {
            if (isEditMode) {
                // In edit mode: add to draft state only
                createLongTermObjective(lto);
                closeModal();
            } else {
                // In view mode: save to server directly
                await fetch('/api/objectives/long-term', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ xmatrixId: data.id, ...lto }),
                });
                await store.fetchData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateLTO = async (lto: LongTermObjective) => {
        setIsSaving(true);
        try {
            if (isEditMode) {
                // In edit mode: update draft state only
                await updateLongTermObjective(lto.id, lto);
                closeModal();
            } else {
                // In view mode: save to server directly
                await fetch(`/api/objectives/long-term/${lto.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(lto),
                });
                await store.fetchData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteLTO = async (id: string) => {
        if (!confirm('Are you sure you want to delete this objective?')) return;
        try {
            if (isEditMode) {
                // In edit mode: delete from draft state only
                await deleteLongTermObjective(id);
                closeModal();
            } else {
                // In view mode: delete from server directly
                await fetch(`/api/objectives/long-term/${id}`, { method: 'DELETE' });
                await store.fetchData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // CRUD Handlers - AO
    const handleCreateAO = async (ao: AnnualObjective) => {
        if (!data) return;
        setIsSaving(true);
        try {
            if (isEditMode) {
                // In edit mode: add to draft state only
                createAnnualObjective(ao);
                closeModal();
            } else {
                // In view mode: save to server directly
                await fetch('/api/objectives/annual', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ xmatrixId: data.id, ...ao }),
                });
                await store.fetchData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateAO = async (ao: AnnualObjective) => {
        setIsSaving(true);
        try {
            if (isEditMode) {
                await updateAnnualObjective(ao.id, ao);
                closeModal();
            } else {
                await fetch(`/api/objectives/annual/${ao.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ao),
                });
                await store.fetchData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAO = async (id: string) => {
        if (!confirm('Are you sure you want to delete this objective?')) return;
        try {
            if (isEditMode) {
                await deleteAnnualObjective(id);
                closeModal();
            } else {
                await fetch(`/api/objectives/annual/${id}`, { method: 'DELETE' });
                await store.fetchData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // CRUD Handlers - Initiative
    const handleCreateInitiative = async (initiative: Initiative) => {
        if (!data) return;
        setIsSaving(true);
        try {
            if (isEditMode) {
                // In edit mode: add to draft state only
                createInitiative(initiative);
                closeModal();
            } else {
                // In view mode: save to server directly
                await fetch('/api/initiatives', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ xmatrixId: data.id, ...initiative }),
                });
                await store.fetchData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateInitiative = async (initiative: Initiative) => {
        setIsSaving(true);
        try {
            if (isEditMode) {
                await updateInitiative(initiative.id, initiative);
                closeModal();
            } else {
                await fetch(`/api/initiatives/${initiative.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(initiative),
                });
                await store.fetchData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteInitiative = async (id: string) => {
        if (!confirm('Are you sure you want to delete this initiative?')) return;
        try {
            if (isEditMode) {
                await deleteInitiative(id);
                closeModal();
            } else {
                await fetch(`/api/initiatives/${id}`, { method: 'DELETE' });
                await store.fetchData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // CRUD Handlers - KPI
    const handleCreateKPI = async (kpi: KPI) => {
        if (!data) return;
        setIsSaving(true);
        try {
            if (isEditMode) {
                // In edit mode: add to draft state only
                createKPI(kpi);
                closeModal();
            } else {
                // In view mode: save to server directly
                await fetch('/api/kpis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ xmatrixId: data.id, ...kpi, monthlyData: [] }),
                });
                await store.fetchData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateKPI = async (kpi: KPI) => {
        setIsSaving(true);
        try {
            if (isEditMode) {
                await updateKPI(kpi.id, kpi);
                closeModal();
            } else {
                await fetch(`/api/kpis/${kpi.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(kpi),
                });
                await store.fetchData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteKPI = async (id: string) => {
        if (!confirm('Are you sure you want to delete this KPI?')) return;
        try {
            if (isEditMode) {
                await deleteKPI(id);
                closeModal();
            } else {
                await fetch(`/api/kpis/${id}`, { method: 'DELETE' });
                await store.fetchData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // CRUD Handlers - Owner
    const handleCreateOwner = async (owner: Owner) => {
        if (!data) return;
        setIsSaving(true);
        try {
            if (isEditMode) {
                // In edit mode: add to draft state only
                createOwner(owner);
                closeModal();
            } else {
                // In view mode: save to server directly
                await fetch('/api/owners', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ xmatrixId: data.id, ...owner }),
                });
                await store.fetchData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateOwner = async (owner: Owner) => {
        setIsSaving(true);
        try {
            if (isEditMode) {
                await updateOwner(owner.id, owner);
                closeModal();
            } else {
                await fetch(`/api/owners/${owner.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(owner),
                });
                await store.fetchData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteOwner = async (id: string) => {
        if (!confirm('Are you sure you want to delete this owner?')) return;
        try {
            if (isEditMode) {
                await deleteOwner(id);
                closeModal();
            } else {
                await fetch(`/api/owners/${id}`, { method: 'DELETE' });
                await store.fetchData();
                closeModal();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return {
        modalType,
        editingItem,
        isSaving,
        openAddModal,
        openEditModal,
        closeModal,
        handleCreateLTO,
        handleUpdateLTO,
        handleDeleteLTO,
        handleCreateAO,
        handleUpdateAO,
        handleDeleteAO,
        handleCreateInitiative,
        handleUpdateInitiative,
        handleDeleteInitiative,
        handleCreateKPI,
        handleUpdateKPI,
        handleDeleteKPI,
        handleCreateOwner,
        handleUpdateOwner,
        handleDeleteOwner,
    };
}
