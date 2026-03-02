import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash, HiX, HiFilter } from 'react-icons/hi';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const YEARS = [1, 2, 3, 4];

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', credits: '', department: '', semester: '', year: '', regulation: '' });
  const [batchAssignments, setBatchAssignments] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);

  // Filters
  const [filterSem, setFilterSem] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDept, setFilterDept] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => { fetchCourses(); }, [filterSem, filterYear, filterDept]);

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams();
      if (filterSem) params.append('semester', filterSem);
      if (filterYear) params.append('year', filterYear);
      if (filterDept) params.append('department', filterDept);
      const { data } = await API.get(`/courses?${params.toString()}`);
      setCourses(data.data);
    } catch (err) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  // Get unique departments from courses for filter
  const departments = [...new Set(courses.map(c => c.department).filter(Boolean))];

  const openForm = async (course = null) => {
    if (isAdmin) {
      try {
        const [bRes, tRes] = await Promise.all([
          API.get('/admin/batches'),
          API.get('/admin/users?role=teacher'),
        ]);
        setAllBatches(bRes.data.data);
        setAllTeachers(tRes.data.data);
      } catch { /* ignore */ }
    }
    if (course) {
      setEditing(course);
      setForm({
        name: course.name,
        code: course.code || '',
        description: course.description || '',
        credits: course.credits || '',
        department: course.department || '',
        semester: course.semester || '',
        year: course.year || '',
        regulation: course.regulation || '',
      });
      setBatchAssignments(
        (course.batches || []).map(b => ({
          batch_id: b.batch_id?._id || b.batch_id || '',
          teacher_id: b.teacher_id?._id || b.teacher_id || '',
        }))
      );
    } else {
      setEditing(null);
      setForm({ name: '', code: '', description: '', credits: '', department: '', semester: '', year: '', regulation: '' });
      setBatchAssignments([]);
    }
    setShowForm(true);
  };

  const addBatchRow = () => setBatchAssignments([...batchAssignments, { batch_id: '', teacher_id: '' }]);
  const removeBatchRow = (idx) => setBatchAssignments(batchAssignments.filter((_, i) => i !== idx));
  const updateBatchRow = (idx, field, value) => {
    const updated = [...batchAssignments];
    updated[idx] = { ...updated[idx], [field]: value };
    setBatchAssignments(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validBatches = batchAssignments.filter(b => b.batch_id && b.teacher_id);
    const payload = {
      ...form,
      credits: form.credits ? Number(form.credits) : 0,
      semester: form.semester ? Number(form.semester) : null,
      year: form.year ? Number(form.year) : null,
      batches: validBatches,
    };
    try {
      if (editing) {
        await API.put(`/courses/${editing._id}`, payload);
        toast.success('Course updated');
      } else {
        await API.post('/courses', payload);
        toast.success('Course created');
      }
      setShowForm(false);
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this course and all related data?')) return;
    try {
      await API.delete(`/courses/${id}`);
      toast.success('Course deleted');
      fetchCourses();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  // Group courses by semester for display
  const grouped = {};
  courses.forEach(c => {
    const key = c.semester ? `Semester ${c.semester}` : 'Ungrouped';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });
  const groupKeys = Object.keys(grouped).sort((a, b) => {
    if (a === 'Ungrouped') return 1;
    if (b === 'Ungrouped') return -1;
    return a.localeCompare(b, undefined, { numeric: true });
  });

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Courses</h1>
        {isAdmin && (
          <button onClick={() => openForm()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <HiPlus className="w-5 h-5" /> Add Course
          </button>
        )}
      </div>

      {/* Filters */}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-white rounded-xl border p-4">
          <HiFilter className="w-5 h-5 text-gray-400" />
          <select value={filterSem} onChange={e => { setFilterSem(e.target.value); setLoading(true); }}
            className="px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Semesters</option>
            {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
          <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setLoading(true); }}
            className="px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
          </select>
          <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setLoading(true); }}
            className="px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {(filterSem || filterYear || filterDept) && (
            <button onClick={() => { setFilterSem(''); setFilterYear(''); setFilterDept(''); setLoading(true); }}
              className="text-xs text-red-500 hover:text-red-700 font-medium">Clear filters</button>
          )}
        </div>
      )}

      {/* Grouped courses */}
      {groupKeys.map(group => (
        <div key={group} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> {group}
            <span className="text-sm font-normal text-gray-400">({grouped[group].length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {grouped[group].map((course) => (
              <div key={course._id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-base truncate">{course.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {course.code && <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{course.code}</span>}
                      {course.semester && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">Sem {course.semester}</span>}
                      {course.year && <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">Year {course.year}</span>}
                      {course.regulation && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">{course.regulation}</span>}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1.5 ml-2">
                      <button onClick={() => openForm(course)} className="text-gray-400 hover:text-blue-600"><HiPencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(course._id)} className="text-gray-400 hover:text-red-600"><HiTrash className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>

                {course.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{course.description}</p>}

                {course.batches?.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Batches & Faculty</p>
                    {course.batches.map((b, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium truncate max-w-[140px]">
                          {b.batch_id?.name || 'Unknown'}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-600 truncate">{b.teacher_id?.name || 'Unassigned'}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex gap-3 text-xs text-gray-400">
                  {course.credits > 0 && <span>{course.credits} credits</span>}
                  {course.department && <span>{course.department}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {courses.length === 0 && <p className="text-gray-500 text-center py-8">No courses found</p>}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Course' : 'Add Course'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                  <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select Semester</option>
                    {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select Year</option>
                    {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regulation</label>
                  <input type="text" value={form.regulation} onChange={(e) => setForm({ ...form, regulation: e.target.value })}
                    placeholder="e.g. R2024" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                  <input type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" min="0" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="2"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>

              {/* Batch → Faculty Assignments */}
              {isAdmin && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Batch & Faculty Assignments</label>
                    <button type="button" onClick={addBatchRow}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                      <HiPlus className="w-4 h-4" /> Add Batch
                    </button>
                  </div>
                  {batchAssignments.length === 0 && (
                    <p className="text-sm text-gray-400 italic py-3 text-center border border-dashed rounded-lg">
                      No batches assigned. Click "Add Batch" to assign.
                    </p>
                  )}
                  <div className="space-y-2">
                    {batchAssignments.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                        <div className="flex-1">
                          <select value={row.batch_id} onChange={(e) => updateBatchRow(idx, 'batch_id', e.target.value)}
                            className="w-full px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="">Select Batch</option>
                            {allBatches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                          </select>
                        </div>
                        <span className="text-gray-400 text-sm">→</span>
                        <div className="flex-1">
                          <select value={row.teacher_id} onChange={(e) => updateBatchRow(idx, 'teacher_id', e.target.value)}
                            className="w-full px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="">Select Faculty</option>
                            {allTeachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                          </select>
                        </div>
                        <button type="button" onClick={() => removeBatchRow(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <HiX className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
