import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineUserGroup,
  HiOutlineSearch, HiOutlineX, HiOutlineAcademicCap, HiOutlineUsers,
} from 'react-icons/hi';

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
  const [selectedToAdd, setSelectedToAdd] = useState(new Set());
  const [selectedToRemove, setSelectedToRemove] = useState(new Set());
  const [searchAvailable, setSearchAvailable] = useState('');
  const [searchCurrent, setSearchCurrent] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [rangeForm, setRangeForm] = useState({ startEmail: '', endEmail: '' });
  const [rangeLoading, setRangeLoading] = useState(false);

  useEffect(() => { fetchBatches(); }, []);

  const fetchBatches = async () => {
    try { const { data } = await API.get('/admin/batches'); setBatches(data.data); }
    catch { toast.error('Failed to load batches'); }
    finally { setLoading(false); }
  };

  const openForm = async (batch = null) => {
    try { const { data } = await API.get('/admin/users?role=teacher'); setTeachers(data.data); } catch { /* ignore */ }
    if (batch) {
      setEditing(batch);
      setForm({
        name: batch.name,
        year: batch.year || '',
        department: batch.department || '',
        teacher_id: batch.teacher_id?._id || batch.teacher_id?.id || batch.teacher_id || '',
      });
    } else {
      setEditing(null);
      setForm({ name: '', year: '', department: '', teacher_id: '' });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const id = editing?._id || editing?.id;
      if (editing) { await API.put(`/admin/batches/${id}`, form); toast.success('Batch updated'); }
      else { await API.post('/admin/batches', form); toast.success('Batch created'); }
      setShowForm(false); fetchBatches();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this batch?')) return;
    try { await API.delete(`/admin/batches/${id}`); toast.success('Deleted'); fetchBatches(); }
    catch { toast.error('Failed'); }
  };

  const manageStudents = async (batch) => {
    try {
      const batchId = batch._id || batch.id;
      const [bRes, aRes] = await Promise.all([
        API.get(`/admin/batches/${batchId}/students`),
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

  const bulkAssignByRange = async () => {
    if (!rangeForm.startEmail || !rangeForm.endEmail) {
      toast.error('Enter both start and end emails');
      return;
    }
    setRangeLoading(true);
    try {
      const batchId = showStudents._id || showStudents.id;
      const { data } = await API.post(`/admin/batches/${batchId}/students/range`, rangeForm);
      toast.success(data.message);
      setRangeForm({ startEmail: '', endEmail: '' });
      await manageStudents(showStudents);
      fetchBatches();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setRangeLoading(false); }
  };

  const currentBatchIds = useMemo(
    () => new Set(batchStudents.map(s => s._id || s.id)),
    [batchStudents]
  );

  const filteredAvailable = useMemo(() => {
    return allStudents
      .filter(s => !currentBatchIds.has(s._id || s.id))
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
    const ids = filteredAvailable.map(s => s._id || s.id);
    setSelectedToAdd(prev => {
      const allSelected = ids.every(id => prev.has(id));
      if (allSelected) return new Set();
      return new Set([...prev, ...ids]);
    });
  };

  const selectAllCurrent = () => {
    const ids = filteredCurrent.map(s => s._id || s.id);
    setSelectedToRemove(prev => {
      const allSelected = ids.every(id => prev.has(id));
      if (allSelected) return new Set();
      return new Set([...prev, ...ids]);
    });
  };

  const bulkAddStudents = async () => {
    if (selectedToAdd.size === 0) return;
    setBulkLoading(true);
    try {
      const batchId = showStudents._id || showStudents.id;
      await API.post(`/admin/batches/${batchId}/students`, { add: [...selectedToAdd] });
      toast.success(`${selectedToAdd.size} student(s) added`);
      setSelectedToAdd(new Set());
      await manageStudents(showStudents);
      fetchBatches();
    } catch { toast.error('Failed to add students'); }
    finally { setBulkLoading(false); }
  };

  const bulkRemoveStudents = async () => {
    if (selectedToRemove.size === 0) return;
    if (!confirm(`Remove ${selectedToRemove.size} student(s) from batch?`)) return;
    setBulkLoading(true);
    try {
      const batchId = showStudents._id || showStudents.id;
      await API.post(`/admin/batches/${batchId}/students`, { remove: [...selectedToRemove] });
      toast.success(`${selectedToRemove.size} student(s) removed`);
      setSelectedToRemove(new Set());
      await manageStudents(showStudents);
      fetchBatches();
    } catch { toast.error('Failed to remove students'); }
    finally { setBulkLoading(false); }
  };

  const addStudent = async (studentId) => {
    try {
      const batchId = showStudents._id || showStudents.id;
      await API.post(`/admin/batches/${batchId}/students`, { add: [studentId] });
      toast.success('Added');
      manageStudents(showStudents);
      fetchBatches();
    } catch { toast.error('Failed'); }
  };

  const removeStudent = async (studentId) => {
    try {
      const batchId = showStudents._id || showStudents.id;
      await API.post(`/admin/batches/${batchId}/students`, { remove: [studentId] });
      toast.success('Removed');
      manageStudents(showStudents);
      fetchBatches();
    } catch { toast.error('Failed'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cardinal-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="label-inst text-cardinal-700">Administration</p>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">Batches</h1>
          <div className="divider-gold mt-3 max-w-[120px]" />
          <p className="text-sm text-gray-500 mt-3">Cohorts, advisors, and student rosters.</p>
        </div>
        <button
          onClick={() => openForm()}
          className="bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                     px-5 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                     border border-cardinal-800 flex items-center gap-2 transition-colors"
        >
          <HiOutlinePlus className="w-5 h-5" /> Add Batch
        </button>
      </div>

      {/* ── Batch grid ── */}
      {batches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.map(batch => {
            const id = batch._id || batch.id;
            return (
              <article key={id} className="surface-card p-5 hover:border-cardinal-300 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="label-inst text-cardinal-700">Cohort</p>
                    <h3 className="font-serif text-lg font-semibold text-gray-900 mt-0.5 truncate">
                      {batch.name}
                    </h3>
                    <div className="divider-gold mt-2 max-w-[60px]" />
                  </div>
                  <div className="flex items-start gap-1 flex-shrink-0">
                    <button
                      onClick={() => manageStudents(batch)}
                      className="p-2 text-gray-400 hover:text-cardinal-700 rounded-md hover:bg-cardinal-50 transition-colors"
                      title="Manage students"
                    >
                      <HiOutlineUserGroup className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openForm(batch)}
                      className="p-2 text-gray-400 hover:text-cardinal-700 rounded-md hover:bg-cardinal-50 transition-colors"
                      title="Edit"
                    >
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(id)}
                      className="p-2 text-gray-400 hover:text-cardinal-700 rounded-md hover:bg-cardinal-50 transition-colors"
                      title="Delete"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  {batch.department && (
                    <div>
                      <p className="label-inst text-gray-500">Department</p>
                      <p className="text-gray-800 font-medium mt-0.5 truncate">{batch.department}</p>
                    </div>
                  )}
                  {batch.year && (
                    <div>
                      <p className="label-inst text-gray-500">Year</p>
                      <p className="text-gray-800 font-medium mt-0.5">{batch.year}</p>
                    </div>
                  )}
                  <div>
                    <p className="label-inst text-gray-500">Students</p>
                    <p className="text-gray-800 font-medium mt-0.5 tabular-nums">{batch.studentCount || 0}</p>
                  </div>
                  {batch.teacher_id && (
                    <div>
                      <p className="label-inst text-gray-500">Advisor</p>
                      <p className="text-gray-800 font-medium mt-0.5 truncate">{batch.teacher_id.name}</p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="surface-card p-12 text-center">
          <HiOutlineUserGroup className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="font-serif text-lg text-gray-700">No batches</p>
          <p className="text-sm text-gray-500 mt-1">Create a batch to begin grouping students.</p>
        </div>
      )}

      {/* ── Create / Edit modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="surface-card max-w-md w-full p-7">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="label-inst text-cardinal-700">{editing ? 'Edit' : 'Create'}</p>
                <h2 className="font-serif text-2xl font-semibold text-gray-900 mt-0.5">
                  {editing ? 'Edit batch' : 'New batch'}
                </h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-inst text-gray-600">Batch name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. BE CSE 2024-28"
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-inst text-gray-600">Year</label>
                  <input
                    type="text"
                    value={form.year}
                    onChange={e => setForm({ ...form, year: e.target.value })}
                    placeholder="2024"
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
                <div>
                  <label className="label-inst text-gray-600">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                    placeholder="CSE"
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="label-inst text-gray-600">Advisor (optional)</label>
                <select
                  value={form.teacher_id}
                  onChange={e => setForm({ ...form, teacher_id: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                >
                  <option value="">Select advisor</option>
                  {teachers.map(t => (
                    <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md font-semibold text-sm
                             uppercase tracking-wide text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                             px-4 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                             border border-cardinal-800 transition-colors"
                >
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Manage students modal ── */}
      {showStudents && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="surface-card max-w-4xl w-full p-7 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="label-inst text-cardinal-700">Roster</p>
                <h2 className="font-serif text-2xl font-semibold text-gray-900 mt-0.5">{showStudents.name}</h2>
                <p className="text-xs text-gray-500 mt-1">Assign or remove students from this batch.</p>
              </div>
              <button
                onClick={() => setShowStudents(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* ── Range assign ── */}
            <div className="bg-cardinal-50/50 border border-cardinal-100 rounded-md p-4 mb-5">
              <p className="label-inst text-cardinal-700">Assign by email range</p>
              <p className="text-xs text-gray-500 mt-1 mb-3">Batch-add a sequential range of student emails.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="From: e0324001@sriher.edu.in"
                  value={rangeForm.startEmail}
                  onChange={e => setRangeForm({ ...rangeForm, startEmail: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                />
                <span className="hidden sm:flex items-center text-gray-400 text-sm px-1">→</span>
                <input
                  type="text"
                  placeholder="To: e0324060@sriher.edu.in"
                  value={rangeForm.endEmail}
                  onChange={e => setRangeForm({ ...rangeForm, endEmail: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                />
                <button
                  onClick={bulkAssignByRange}
                  disabled={rangeLoading || !rangeForm.startEmail || !rangeForm.endEmail}
                  className="bg-cardinal-700 hover:bg-cardinal-800 text-white px-4 py-2 rounded-md
                             text-xs font-semibold uppercase tracking-wide border border-cardinal-800
                             disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
                >
                  {rangeLoading && <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />}
                  Assign Range
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 min-h-0 overflow-hidden">
              {/* ── Current students ── */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HiOutlineUsers className="w-4 h-4 text-gray-500" />
                    <p className="label-inst text-gray-600">Current ({batchStudents.length})</p>
                  </div>
                  {filteredCurrent.length > 0 && (
                    <button
                      onClick={selectAllCurrent}
                      className="text-[10px] label-inst text-cardinal-700 hover:text-cardinal-900"
                    >
                      {filteredCurrent.every(s => selectedToRemove.has(s._id || s.id)) ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>
                <div className="relative mb-2">
                  <HiOutlineSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search current..."
                    value={searchCurrent}
                    onChange={e => setSearchCurrent(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
                <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 border border-gray-200 rounded-md p-2 bg-gray-50/50">
                  {filteredCurrent.map(s => {
                    const sid = s._id || s.id;
                    const selected = selectedToRemove.has(sid);
                    return (
                      <div
                        key={sid}
                        onClick={() => toggleRemoveSelection(sid)}
                        className={`flex items-center gap-2 p-2 rounded-md text-sm cursor-pointer transition-colors ${
                          selected
                            ? 'bg-cardinal-100 ring-1 ring-cardinal-300'
                            : 'bg-white hover:bg-cardinal-50/50 border border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {}}
                          className="accent-cardinal-700 pointer-events-none"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium truncate">{s.name}</p>
                          <p className="text-[11px] text-gray-500 truncate">{s.email}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeStudent(sid); }}
                          className="text-[10px] label-inst text-cardinal-700 hover:text-cardinal-900 shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                  {filteredCurrent.length === 0 && (
                    <p className="text-xs text-gray-400 py-6 text-center">No students</p>
                  )}
                </div>
                {selectedToRemove.size > 0 && (
                  <button
                    onClick={bulkRemoveStudents}
                    disabled={bulkLoading}
                    className="mt-2 w-full py-2 bg-cardinal-700 hover:bg-cardinal-800 text-white rounded-md
                               text-xs font-semibold uppercase tracking-wide border border-cardinal-800
                               disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    {bulkLoading && <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />}
                    Remove Selected ({selectedToRemove.size})
                  </button>
                )}
              </div>

              {/* ── Available students ── */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HiOutlineAcademicCap className="w-4 h-4 text-gray-500" />
                    <p className="label-inst text-gray-600">Available ({filteredAvailable.length})</p>
                  </div>
                  {filteredAvailable.length > 0 && (
                    <button
                      onClick={selectAllAvailable}
                      className="text-[10px] label-inst text-cardinal-700 hover:text-cardinal-900"
                    >
                      {filteredAvailable.every(s => selectedToAdd.has(s._id || s.id)) ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>
                <div className="relative mb-2">
                  <HiOutlineSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search available..."
                    value={searchAvailable}
                    onChange={e => setSearchAvailable(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
                <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 border border-gray-200 rounded-md p-2 bg-gray-50/50">
                  {filteredAvailable.map(s => {
                    const sid = s._id || s.id;
                    const selected = selectedToAdd.has(sid);
                    return (
                      <div
                        key={sid}
                        onClick={() => toggleAddSelection(sid)}
                        className={`flex items-center gap-2 p-2 rounded-md text-sm cursor-pointer transition-colors ${
                          selected
                            ? 'bg-gold-100 ring-1 ring-gold-300'
                            : 'bg-white hover:bg-gold-50/50 border border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {}}
                          className="accent-gold-600 pointer-events-none"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium truncate">{s.name}</p>
                          <p className="text-[11px] text-gray-500 truncate">{s.email}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); addStudent(sid); }}
                          className="text-[10px] label-inst text-cardinal-700 hover:text-cardinal-900 shrink-0"
                        >
                          Add
                        </button>
                      </div>
                    );
                  })}
                  {filteredAvailable.length === 0 && (
                    <p className="text-xs text-gray-400 py-6 text-center">No students</p>
                  )}
                </div>
                {selectedToAdd.size > 0 && (
                  <button
                    onClick={bulkAddStudents}
                    disabled={bulkLoading}
                    className="mt-2 w-full py-2 bg-cardinal-700 hover:bg-cardinal-800 text-white rounded-md
                               text-xs font-semibold uppercase tracking-wide border border-cardinal-800
                               disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    {bulkLoading && <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />}
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
