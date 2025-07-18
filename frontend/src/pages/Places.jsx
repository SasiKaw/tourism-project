import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import PageHeader from '../components/ui/PageHeader';
import StatsCard from '../components/ui/StatsCard';
import ContentCard from '../components/ui/ContentCard';
import Tabs from '../components/ui/Tabs';
import RegionFilter from '../components/ui/RegionFilter';
import SearchBar from '../components/ui/SearchBar';
import PlacesTable from '../components/ui/PlacesTable';
import NewDestinationButton from '../components/ui/NewDestinationButton';
import DestinationFormModal from '../components/ui/DestinationFormModal';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import PaginationControls from '../components/ui/PaginationControls';
import { useAuth }    from '../contexts/AuthContext';




const Places = () => {
  const [activeTab, setActiveTab] = useState('Destinations');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [searchTerm, setSearchTerm] = useState('');
  const [destinations, setDestinations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editType, setEditType] = useState('destination');
  const [deleteType, setDeleteType] = useState('destination');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const {getAuthHeaders} = useAuth();
  const API_BASE = 'http://localhost:8080';
  const PLACE_API = `${API_BASE}/api/places`;
  const ACTIVITY_API = `${API_BASE}/api/activities`;


  // Fetch destinations from API
  const fetchDestinations = async () => {
    try {
      const res = await fetch(`${PLACE_API}/getAllPlace`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setDestinations(data);
    } catch (err) {
      console.error('Failed to fetch destinations:', err);
    }
  };

  // Fetch activities from API
  const fetchActivities = async () => {
    try {
      const res = await fetch(`${ACTIVITY_API}/getAllActivity`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchDestinations();
    fetchActivities();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRegion, searchTerm, activeTab]);

  const activeData = activeTab === 'Destinations' ? destinations : activities;
  const setActiveData = activeTab === 'Destinations' ? setDestinations : setActivities;

  const filteredData = activeData
    .sort((a, b) => {
      // Try to sort by creation date/time if available, otherwise fall back to ID
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (a.dateCreated && b.dateCreated) {
        return new Date(b.dateCreated) - new Date(a.dateCreated);
      } else if (a.created_at && b.created_at) {
        return new Date(b.created_at) - new Date(a.created_at);
      } else {
        // Fall back to ID sorting (most recent ID first)
        return b.id - a.id;
      }
    })
    .filter((item) => {
      const matchRegion =
        selectedRegion === 'All Regions' || item.region === selectedRegion;
      const matchSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchRegion && matchSearch;
    });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (item) => {
    setEditType(activeTab === 'Destinations' ? 'destination' : 'activity');
    setEditData(item);
    setShowModal(true);
  };

  const handleDelete = (item) => {
    setDeleteType(activeTab === 'Destinations' ? 'destination' : 'activity');
    setDeleteTarget(item);
    setShowDeleteConfirm(true);
  };

  // DELETE endpoint
  const confirmDelete = async (item) => {
    try {
      if (deleteType === 'destination') {
        await fetch(`${PLACE_API}/deletePlace/${item.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        toast.success('Destination deleted successfully!');
        await fetchDestinations();
      } else {
        await fetch(`${ACTIVITY_API}/deleteActivity/${item.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        toast.success('Activity deleted successfully!');
        await fetchActivities();
      }
    } catch (err) {
      toast.error('Delete failed!');
      console.error('Delete failed:', err);
    }
    setDeleteTarget(null);
    setShowDeleteConfirm(false);
  };

  // ADD/UPDATE endpoint
  const handleAddOrUpdate = async (updatedItem) => {
    try {
      if (editType === 'destination') {
        if (editData && editData.id) {
          // Update
          await fetch(`${PLACE_API}/updatePlace/${editData.id}`, {
            method: 'PUT',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedItem),
          });
          toast.success('Destination updated successfully!');
        } else {
          // Add
          await fetch(`${PLACE_API}/addPlace`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedItem),
          });
          toast.success('Destination added successfully!');
        }
        await fetchDestinations();
      } else {
        if (editData && editData.id) {
          // Update
          await fetch(`${ACTIVITY_API}/updateActivity/${editData.id}`, {
            method: 'PUT',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedItem),
          });
          toast.success('Activity updated successfully!');
        } else {
          // Add
          await fetch(`${ACTIVITY_API}/addActivity`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedItem),
          });
          toast.success('Activity added successfully!');
        }
        await fetchActivities();
      }
    } catch (err) {
      toast.error('Operation failed!');
      console.error('Add/Update failed:', err);
    }
    setShowModal(false);
    setEditData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="p-6 space-y-8">
        {/* Header */}
        <PageHeader
          title="Places Management"
          subtitle="Manage destinations and activities across Sri Lanka"
          icon={({ className }) => (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <StatsCard
            title="Total Destinations"
            value={destinations.length.toString()}
            color="blue"
            icon={({ className }) => (
              <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          />
          <StatsCard
            title="Total Activities"
            value={activities.length.toString()}
            color="green"
            icon={({ className }) => (
              <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          />
          <StatsCard
            title="Popular Regions"
            value="5"
            color="purple"
            icon={({ className }) => (
              <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            )}
          />
          <StatsCard
            title="Recent Updates"
            value="12"
            color="yellow"
            icon={({ className }) => (
              <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          />
        </div>

        {/* Tabs */}
        <ContentCard noPadding>
          <div className="p-8">
            <Tabs activeTab={activeTab} onChange={setActiveTab} />
          </div>
        </ContentCard>

        {/* Controls */}
        <ContentCard>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Search & Filter</h3>
            </div>
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <RegionFilter
              selectedRegion={selectedRegion}
              onChange={setSelectedRegion}
            />
            <div className="flex-1 w-full sm:w-auto">
              <SearchBar searchTerm={searchTerm} onChange={setSearchTerm} />
            </div>
            <NewDestinationButton
              onClick={() => {
                setEditType(activeTab === 'Destinations' ? 'destination' : 'activity');
                setEditData(null);
                setShowModal(true);
              }}
            >
              {activeTab === 'Destinations' ? '+ New Destination' : '+ New Activity'}
            </NewDestinationButton>
          </div>
        </ContentCard>

        {/* Table */}
        <ContentCard noPadding>
          <PlacesTable
            data={paginatedData}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </ContentCard>

        {/* Pagination */}
        <div className="flex justify-center">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevious={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            onNext={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Modals */}
        <DestinationFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditData(null);
          }}
          onSubmit={handleAddOrUpdate}
          initialData={editData}
          type={editType}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          item={deleteTarget}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          type={deleteType}
        />
      </div>
    </div>
  );
};

export default Places;
