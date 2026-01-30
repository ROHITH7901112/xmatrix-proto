
import { useState } from 'react';
import { useXMatrixStore } from '@/lib/store';
import { LongTermObjective, AnnualObjective, Initiative, KPI, Owner, EntityType } from '@/lib/types';

export function useXMatrixCRUD() {
    const { data, fetchData } = useXMatrixStore();
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
            await fetch('/api/objectives/long-term', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xmatrixId: data.id, ...lto }),
            });
            await fetchData();
            closeModal();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateLTO = async (lto: LongTermObjective) => {
        setIsSaving(true);
        try {
            await fetch(`/api/objectives/long-term/${lto.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(lto),
            });
            await fetchData();
            closeModal();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteLTO = async (id: string) => {
        if (!confirm('Are you sure you want to delete this objective?')) return;
        try {
            await fetch(`/api/objectives/long-term/${id}`, { method: 'DELETE' });
            await fetchData();
            closeModal();
        } catch (err) {
            console.error(err);
        }
    };

    // CRUD Handlers - AO
    const handleCreateAO = async (ao: AnnualObjective) => {
        if (!data) return;
        setIsSaving(true);
        try {
            await fetch('/api/objectives/annual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xmatrixId: data.id, ...ao }),
            });
            await fetchData();
            closeModal();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateAO = async (ao: AnnualObjective) => {
        setIsSaving(true);
        try {
            await fetch(`/api/objectives/annual/${ao.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ao),
            });
            await fetchData();
            closeModal();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAO = async (id: string) => {
        if (!confirm('Are you sure you want to delete this objective?')) return;
        try {
            await fetch(`/api/objectives/annual/${id}`, { method: 'DELETE' });
            await fetchData();
            closeModal();
        } catch (err) {
            console.error(err);
        }
    };

    // CRUD Handlers - Initiative
    const handleCreateInitiative = async (initiative: Initiative) => {
        if (!data) return;
        setIsSaving(true);
        try {
            await fetch('/api/initiatives', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xmatrixId: data.id, ...initiative }),
            });
            await fetchData();
            closeModal();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateInitiative = async (initiative: Initiative) => {
        setIsSaving(true);
        try {
            await fetch(`/api/initiatives/${initiative.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(initiative),
            });
            await fetchData();
            closeModal();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteInitiative = async (id: string) => {
        if (!confirm('Are you sure you want to delete this initiative?')) return;
        try {
            await fetch(`/api/initiatives/${id}`, { method: 'DELETE' });
            await fetchData();
            closeModal();
        } catch (err) {
            console.error(err);
        }
    };

    // CRUD Handlers - KPI
    const handleCreateKPI = async (kpi: KPI) => {
        if (!data) return;
        setIsSaving(true);
        try {
            await fetch('/api/kpis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xmatrixId: data.id, ...kpi, monthlyData: [] }),
            });
            await fetchData();
            closeModal();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateKPI = async (kpi: KPI) => {
        setIsSaving(true);
        try {
            await fetch(`/api/kpis/${kpi.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kpi),
            });
            await fetchData();
            closeModal();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteKPI = async (id: string) => {
        if (!confirm('Are you sure you want to delete this KPI?')) return;
        try {
            await fetch(`/api/kpis/${id}`, { method: 'DELETE' });
            await fetchData();
            closeModal();
        } catch (err) {
            console.error(err);
        }
    };

    // CRUD Handlers - Owner
    const handleCreateOwner = async (owner: Owner) => {
        if (!data) return;
        setIsSaving(true);
        try {
            await fetch('/api/owners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xmatrixId: data.id, ...owner }),
            });
            await fetchData();
            closeModal();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateOwner = async (owner: Owner) => {
        setIsSaving(true);
        try {
            await fetch(`/api/owners/${owner.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(owner),
            });
            await fetchData();
            closeModal();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteOwner = async (id: string) => {
        if (!confirm('Are you sure you want to delete this owner?')) return;
        try {
            await fetch(`/api/owners/${id}`, { method: 'DELETE' });
            await fetchData();
            closeModal();
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
