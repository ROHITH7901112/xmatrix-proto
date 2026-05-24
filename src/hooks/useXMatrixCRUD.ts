 
import { useState } from 'react';
import { toast } from 'sonner';
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
                createLongTermObjective(lto);
                toast.success('Long-term objective created');
                closeModal();
            } else {
                await fetch('/api/objectives/long-term', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ xmatrixId: data.id, ...lto }),
                });
                await store.fetchData();
                toast.success('Long-term objective created');
                closeModal();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to create long-term objective');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateLTO = async (lto: LongTermObjective) => {
        setIsSaving(true);
        try {
            if (isEditMode) {
                await updateLongTermObjective(lto.id, lto);
                toast.success('Long-term objective updated');
                closeModal();
            } else {
                await fetch(`/api/objectives/long-term/${lto.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(lto),
                });
                await store.fetchData();
                toast.success('Long-term objective updated');
                closeModal();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to update long-term objective');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteLTO = async (id: string) => {
        if (!confirm('Are you sure you want to delete this objective?')) return;
        try {
            if (isEditMode) {
                await deleteLongTermObjective(id);
                toast.success('Long-term objective deleted');
                closeModal();
            } else {
                await fetch(`/api/objectives/long-term/${id}`, { method: 'DELETE' });
                await store.fetchData();
                toast.success('Long-term objective deleted');
                closeModal();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete long-term objective');
        }
    };

    // CRUD Handlers - AO
    const handleCreateAO = async (ao: AnnualObjective) => {
        if (!data) return;
        setIsSaving(true);
        try {
            if (isEditMode) {
                createAnnualObjective(ao);
                toast.success('Annual objective created');
                closeModal();
            } else {
                await fetch('/api/objectives/annual', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ xmatrixId: data.id, ...ao }),
                });
                await store.fetchData();
                toast.success('Annual objective created');
                closeModal();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to create annual objective');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateAO = async (ao: AnnualObjective) => {
        setIsSaving(true);
        try {
            if (isEditMode) {
                await updateAnnualObjective(ao.id, ao);
                toast.success('Annual objective updated');
                closeModal();
            } else {
                await fetch(`/api/objectives/annual/${ao.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ao),
                });
                await store.fetchData();
                toast.success('Annual objective updated');
                closeModal();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to update annual objective');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAO = async (id: string) => {
        if (!confirm('Are you sure you want to delete this objective?')) return;
        try {
            if (isEditMode) {
                await deleteAnnualObjective(id);
                toast.success('Annual objective deleted');
                closeModal();
            } else {
                await fetch(`/api/objectives/annual/${id}`, { method: 'DELETE' });
                await store.fetchData();
                toast.success('Annual objective deleted');
                closeModal();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete annual objective');
        }
    };

    // CRUD Handlers - Initiative
    const handleCreateInitiative = async (initiative: Initiative) => {
        if (!data) return;
        setIsSaving(true);
        try {
            if (isEditMode) {
                createInitiative(initiative);
                toast.success('Initiative created');
                closeModal();
            } else {
                await fetch('/api/initiatives', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ xmatrixId: data.id, ...initiative }),
                });
                await store.fetchData();
                toast.success('Initiative created');
                closeModal();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to create initiative');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateInitiative = async (initiative: Initiative) => {
        setIsSaving(true);
        try {
            if (isEditMode) {
                await updateInitiative(initiative.id, initiative);
                toast.success('Initiative updated');
                closeModal();
            } else {
                await fetch(`/api/initiatives/${initiative.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(initiative),
                });
                await store.fetchData();
                toast.success('Initiative updated');
                closeModal();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to update initiative');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteInitiative = async (id: string) => {
        if (!confirm('Are you sure you want to delete this initiative?')) return;
        try {
            if (isEditMode) {
                await deleteInitiative(id);
                toast.success('Initiative deleted');
                closeModal();
            } else {
                await fetch(`/api/initiatives/${id}`, { method: 'DELETE' });
                await store.fetchData();
                toast.success('Initiative deleted');
                closeModal();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete initiative');
        }
    };

    // CRUD Handlers - KPI
    const handleCreateKPI = async (kpi: KPI) => {
        if (!data) return;
        setIsSaving(true);
        try {
            // monthlyData is already computed with distributed targets from the KPIForm
            const kpiWithMonthlyData = {
                ...kpi,
                // Preserve computed distribution (can span multiple years).
                // Fallback to 12 empty months only when no monthly data is provided.
                monthlyData: kpi.monthlyData && kpi.monthlyData.length > 0
                    ? kpi.monthlyData
                    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => ({
                        month,
                        target: 0,
                        actual: null,
                        variance: null,
                    })),
            };

            if (isEditMode) {
                createKPI(kpiWithMonthlyData);
                // Create kpi-owner relationships in draft state
                for (const ownerId of kpiWithMonthlyData.ownerIds) {
                    store.toggleRelationship(kpiWithMonthlyData.id, 'kpi', ownerId, 'owner');
                }
                toast.success('KPI created');
                closeModal();
            } else {
                await fetch('/api/kpis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ xmatrixId: data.id, ...kpiWithMonthlyData }),
                });
                // Create kpi-owner relationships for each selected owner
                for (const ownerId of kpiWithMonthlyData.ownerIds) {
                    await fetch('/api/relationships', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            xmatrixId: data.id,
                            sourceId: kpiWithMonthlyData.id,
                            sourceType: 'kpi',
                            targetId: ownerId,
                            targetType: 'owner',
                            strength: 'primary',
                        }),
                    });
                }
                await store.fetchData();
                toast.success('KPI created');
                closeModal();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to create KPI');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateKPI = async (kpi: KPI) => {
        setIsSaving(true);
        try {
            if (isEditMode) {
                await updateKPI(kpi.id, kpi);
                toast.success('KPI updated');
                closeModal();
            } else {
                await fetch(`/api/kpis/${kpi.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(kpi),
                });
                await store.fetchData();
                toast.success('KPI updated');
                closeModal();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to update KPI');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteKPI = async (id: string) => {
        if (!confirm('Are you sure you want to delete this KPI?')) return;
        try {
            if (isEditMode) {
                await deleteKPI(id);
                toast.success('KPI deleted');
                closeModal();
            } else {
                await fetch(`/api/kpis/${id}`, { method: 'DELETE' });
                await store.fetchData();
                toast.success('KPI deleted');
                closeModal();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete KPI');
        }
    };

    // CRUD Handlers - Owner
    const handleCreateOwner = async (owner: Owner) => {
        if (!data) return;
        setIsSaving(true);
        try {
            if (isEditMode) {
                createOwner(owner);
                toast.success('Owner created');
                closeModal();
            } else {
                await fetch('/api/owners', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ xmatrixId: data.id, ...owner }),
                });
                await store.fetchData();
                toast.success('Owner created');
                closeModal();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to create owner');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateOwner = async (owner: Owner) => {
        setIsSaving(true);
        try {
            if (isEditMode) {
                await updateOwner(owner.id, owner);
                toast.success('Owner updated');
                closeModal();
            } else {
                await fetch(`/api/owners/${owner.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(owner),
                });
                await store.fetchData();
                toast.success('Owner updated');
                closeModal();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to update owner');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteOwner = async (id: string) => {
        if (!confirm('Are you sure you want to delete this owner?')) return;
        try {
            if (isEditMode) {
                await deleteOwner(id);
                toast.success('Owner deleted');
                closeModal();
            } else {
                await fetch(`/api/owners/${id}`, { method: 'DELETE' });
                await store.fetchData();
                toast.success('Owner deleted');
                closeModal();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete owner');
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
