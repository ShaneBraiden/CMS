import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash, HiUserGroup, HiSearch } from 'react-icons/hi';

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', year: '', department: '', teacher_id: '' });
  const [teachers, setTeachers] = useState([]);
  const [showStudents, setShowStudents] = useState(null);
  const [batchStudents, setBatchStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  // Bulk add/remove state
  const [selectedToAdd, setSelectedToAdd] = useState(new Set());
  const [selectedToRemove, setSelectedToRemove] = useState(new Set());
  const [searchAvailable, setSearchAvailable] = useState('');
  const [searchCurrent, setSearchCurrent] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  // Range assign state
  const [rangeForm, setRangeForm] = useState({ startEmail: '', endEmail: '' });
  const [rangeLoading, setRangeLoading] = useState(false);

  useEffect(() => { fetchBatches(); }, []);

  const fetchBatches = async () => {
    try { const { data } = await API.get('/admin/batches'); setBatches(data.data); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const openForm = async (batch = null) => {
    try { const { data } = await API.get('/admin/users?role=teacher'); setTeachers(data.data); } catch { /* ignore */ }
    if (batch) {
      setEditing(batch);
      setForm({ name: batch.name, year: batch.year || '', department: batch.department || '', teacher_id: batch.teacher_id?._id || '' });
    } else {
      setEditing(null);
      setForm({ name: '', year: '', department: '', teacher_id: '' });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await API.put(`/admin/batches/${editing._id}`, form); toast.success('Updated'); }
      else { await API.post('/admin/batches', form); toast.success('Created'); }
      setShowForm(false); fetchBatches();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    try { await API.delete(`/admin/batches/${id}`); toast.success('Deleted'); fetchBatches(); }
    catch { toast.error('Failed'); }
  };

  const manageStudents = async (batch) => {
    try {
      const [bRes, aRes] = await Promise.all([
        API.get(`/admin/batches/${batch._id}/students`),
        API.get('/admin/users?role=student'),
      ]);
      setBatchStudents(bRes.data.data);
      setAllStudents(aRes.data.data);
      setShowStudents(batch);
      setSelectedToAdd(new Set());
      setSelectedToRemove(new Set());
      setSearchAvailable('');
      setSearchCurrent('');
      setRangeForm({ startEmail: '', endEmail: '' });
    } catch { toast.error('Failed'); }
  };

  // Bulk assign by email range
  const bulkAssignByRange = async () => {
    if (!rangeForm.startEmail || !rangeForm.endEmail) {
      toast.error('Enter both start and end emails');
      return;
    }
    setRangeLoading(true);
    try {
      const { data } = await API.post(`/admin/batches/${showStudents._id}/students/range`, rangeForm);
      toast.success(data.message);
      setRangeForm({ startEmail: '', endEmail: '' });
      await manageStudents(showStudents);
      fetchBatches();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setRangeLoading(false); }
  };

  // Filtered lists for search
  const currentBatchIds = useMemo(() => new Set(batchStudents.map(s => s._id)), [batchStudents]);

  const filteredAvailable = useMemo(() => {
    return allStudents
      .filter(s => !currentBatchIds.has(s._id))
      .filter(s => {
        if (!searchAvailable) return true;
        const q = searchAvailable.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      });
  }, [allStudents, currentBatchIds, searchAvailable]);

  const filteredCurrent = useMemo(() => {
    return batchStudents.filter(s => {
      if (!searchCurrent) return true;
      const q = searchCurrent.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    });
  }, [batchStudents, searchCurrent]);

  // Toggle helpers
  const toggleAddSelection = useCallback((id) => {
    setSelectedToAdd(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleRemoveSelection = useCallback((id) => {
    setSelectedToRemove(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAllAvailable = () => {
    const ids = filteredAvailable.map(s => s._id);
    setSelectedToAdd(prev => {
      const allSelected = ids.every(id => prev.has(id));
      if (allSelected) return new Set(); // deselect all
      return new Set([...prev, ...ids]);
    });
  };

  const selectAllCurrent = () => {
    const ids = filteredCurrent.map(s => s._id);
    setSelectedToRemove(prev => {
      const allSelected = ids.every(id => prev.has(id));
      if (allSelected) return new Set();
      return new Set([...prev, ...ids]);
    });
  };

  // Bulk add
  const bulkAddStudents = async () => {
    if (selectedToAdd.size === 0) return;
    setBulkLoading(true);
    try {
      await API.post(`/admin/batches/${showStudents._id}/students`, { add: [...selectedToAdd] });
      toast.success(`${selectedToAdd.size} student(s) added`);
      setSelectedToAdd(new Set());
      await manageStudents(showStudents);
      fetchBatches();
    } catch { toast.error('Failed to add students'); }
    finally { setBulkLoading(false); }
  };

  // Bulk remove
  const bulkRemoveStudents = async () => {
    if (selectedToRemove.size === 0) return;
    if (!confirm(`Remove ${selectedToRemove.size} student(s) from batch?`)) return;
    setBulkLoading(true);
    try {
      await API.post(`/admin/batches/${showStudents._id}/students`, { remove: [...selectedToRemove] });
      toast.success(`${selectedToRemove.size} student(s) removed`);
      setSelectedToRemove(new Set());
      await manageStudents(showStudents);
      fetchBatches();
    } catch { toast.error('Failed to remove students'); }
    finally { setBulkLoading(false); }
  };

  // Single add/remove (kept for UX convenience)
  const addStudent = async (studentId) => {
    try {
      await API.post(`/admin/batches/${showStudents._id}/students`, { add: [studentId] });
      toast.success('Added');
      manageStudents(showStudents);
      fetchBatches();
    } catch { toast.error('Failed'); }
  };

  const removeStudent = async (studentId) => {
    try {
      await API.post(`/admin/batches/${showStudents._id}/students`, { remove: [studentId] });
      toast.success('Removed');
      manageStudents(showStudents);
      fetchBatches();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Batches</h1>
        <button onClick={() => openForm()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <HiPlus className="w-5 h-5" /> Add Batch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map(batch => (
          <div key={batch._id} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">{batch.name}</h3>
                {batch.department && <p className="text-sm text-gray-500">{batch.department}</p>}
                {batch.year && <p className="text-sm text-gray-500">Year: {batch.year}</p>}
                <p className="text-sm text-gray-500 mt-1">Students: {batch.studentCount || 0}</p>
                {batch.teacher_id && <p className="text-sm text-gray-500">Advisor: {batch.teacher_id.name}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => manageStudents(batch)} className="text-gray-400 hover:text-purple-600" title="Manage Students">
                  <HiUserGroup className="w-5 h-5" />
                </button>
                <button onClick={() => openForm(batch)} className="text-gray-400 hover:text-blue-600"><HiPencil className="w-5 h-5" /></button>
                <button onClick={() => handleDelete(batch._id)} className="text-gray-400 hover:text-red-600"><HiTrash className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Batch' : 'Add Batch'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Batch Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-3 py-2 border rounded-lg outline-none" />
              <input type="text" placeholder="Year" value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none" />
              <input type="text" placeholder="Department" value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none" />
              <select value={form.teacher_id} onChange={e => setForm({...form, teacher_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none">
                <option value="">Select advisor (optional)</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Students Modal – Bulk Add/Remove */}
      {showStudents && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Students in {showStudents.name}</h2>
              <button onClick={() => setShowStudents(null)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>

            {/* ── Bulk Assign by Email Range ── */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-700 mb-2 text-sm">Assign Students by Email Range</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="From: e0324001@sriher.edu.in"
                  value={rangeForm.startEmail}
                  onChange={e => setRangeForm({ ...rangeForm, startEmail: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg outline-none focus:ring-1 focus:ring-blue-400"
                />
                <span className="hidden sm:flex items-center text-gray-400 text-sm">→</span>
                <input
                  type="text"
                  placeholder="To: e0324060@sriher.edu.in"
                  value={rangeForm.endEmail}
                  onChange={e => setRangeForm({ ...rangeForm, endEmail: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg outline-none focus:ring-1 focus:ring-blue-400"
                />
                <button
                  onClick={bulkAssignByRange}
                  disabled={rangeLoading || !rangeForm.startEmail || !rangeForm.endEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {rangeLoading ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : null}
                  Assign Range
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">
              {/* ── Current Students ── */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-700">Current ({batchStudents.length})</h3>
                  {filteredCurrent.length > 0 && (
                    <button onClick={selectAllCurrent} className="text-xs text-red-500 hover:underline">
                      {filteredCurrent.every(s => selectedToRemove.has(s._id)) ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>
                {/* Search */}
                <div className="relative mb-2">
                  <HiSearch className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search current students..."
                    value={searchCurrent}
                    onChange={e => setSearchCurrent(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                  {filteredCurrent.map(s => (
                    <div key={s._id} className={`flex items-center gap-2 p-2 rounded-lg text-sm cursor-pointer transition-colors ${selectedToRemove.has(s._id) ? 'bg-red-100 ring-1 ring-red-300' : 'bg-green-50 hover:bg-green-100'}`} onClick={() => toggleRemoveSelection(s._id)}>
                      <input type="checkbox" checked={selectedToRemove.has(s._id)} onChange={() => {}} className="accent-red-500 pointer-events-none" />
                      <span className="flex-1 truncate">{s.name} <span className="text-gray-400">({s.email})</span></span>
                      <button onClick={(e) => { e.stopPropagation(); removeStudent(s._id); }} className="text-red-500 text-xs hover:underline shrink-0">Remove</button>
                    </div>
                  ))}
                  {filteredCurrent.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No students found</p>}
                </div>
                {/* Bulk remove button */}
                {selectedToRemove.size > 0 && (
                  <button onClick={bulkRemoveStudents} disabled={bulkLoading} className="mt-2 w-full py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {bulkLoading ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : null}
                    Remove Selected ({selectedToRemove.size})
                  </button>
                )}
              </div>

              {/* ── Available Students ── */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-700">Available ({filteredAvailable.length})</h3>
                  {filteredAvailable.length > 0 && (
                    <button onClick={selectAllAvailable} className="text-xs text-blue-600 hover:underline">
                      {filteredAvailable.every(s => selectedToAdd.has(s._id)) ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>
                {/* Search */}
                <div className="relative mb-2">
                  <HiSearch className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search available students..."
                    value={searchAvailable}
                    onChange={e => setSearchAvailable(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
                <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                  {filteredAvailable.map(s => (
                    <div key={s._id} className={`flex items-center gap-2 p-2 rounded-lg text-sm cursor-pointer transition-colors ${selectedToAdd.has(s._id) ? 'bg-blue-100 ring-1 ring-blue-300' : 'bg-gray-50 hover:bg-gray-100'}`} onClick={() => toggleAddSelection(s._id)}>
                      <input type="checkbox" checked={selectedToAdd.has(s._id)} onChange={() => {}} className="accent-blue-600 pointer-events-none" />
                      <span className="flex-1 truncate">{s.name} <span className="text-gray-400">({s.email})</span></span>
                      <button onClick={(e) => { e.stopPropagation(); addStudent(s._id); }} className="text-blue-600 text-xs hover:underline shrink-0">Add</button>
                    </div>
                  ))}
                  {filteredAvailable.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No students found</p>}
                </div>
                {/* Bulk add button */}
                {selectedToAdd.size > 0 && (
                  <button onClick={bulkAddStudents} disabled={bulkLoading} className="mt-2 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {bulkLoading ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : null}
                    Add Selected ({selectedToAdd.size})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Batches;
