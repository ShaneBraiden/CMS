import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX,
  HiOutlineFilter, HiOutlineBookOpen,
} from 'react-icons/hi';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const YEARS = [1, 2, 3, 4];

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', code: '', description: '', credits: '', department: '', semester: '', year: '', regulation: '',
  });
  const [batchAssignments, setBatchAssignments] = useState([]);
  const [allBatches, setAllBatches] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);

  const [filterSem, setFilterSem] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDept, setFilterDept] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => { fetchCourses(); /* eslint-disable-next-line */ }, [filterSem, filterYear, filterDept]);

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams();
      if (filterSem) params.append('semester', filterSem);
      if (filterYear) params.append('year', filterYear);
      if (filterDept) params.append('department', filterDept);
      const { data } = await API.get(`/courses?${params.toString()}`);
      setCourses(data.data);
    } catch { toast.error('Failed to load courses'); }
    finally { setLoading(false); }
  };

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
          batch_id: b.batch_id?._id || b.batch_id?.id || b.batch_id || '',
          teacher_id: b.teacher_id?._id || b.teacher_id?.id || b.teacher_id || '',
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
        await API.put(`/courses/${editing._id || editing.id}`, payload);
        toast.success('Course updated');
      } else {
        await API.post('/courses', payload);
        toast.success('Course created');
      }
      setShowForm(false);
      fetchCourses();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this course and all related data?')) return;
    try {
      await API.delete(`/courses/${id}`);
      toast.success('Course deleted');
      fetchCourses();
    } catch { toast.error('Failed to delete'); }
  };

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
          <p className="label-inst text-cardinal-700">Curriculum</p>
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">Courses</h1>
          <div className="divider-gold mt-3 max-w-[120px]" />
          <p className="text-sm text-gray-500 mt-3">Programme of study across all semesters.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => openForm()}
            className="bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                       px-5 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                       border border-cardinal-800 flex items-center gap-2 transition-colors"
          >
            <HiOutlinePlus className="w-5 h-5" /> Add Course
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      {isAdmin && (
        <div className="surface-card p-4 flex flex-wrap items-center gap-3">
          <HiOutlineFilter className="w-5 h-5 text-cardinal-700" />
          <select
            value={filterSem}
            onChange={e => { setFilterSem(e.target.value); setLoading(true); }}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800
                       focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
          >
            <option value="">All Semesters</option>
            {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
          <select
            value={filterYear}
            onChange={e => { setFilterYear(e.target.value); setLoading(true); }}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800
                       focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
          >
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
          </select>
          <select
            value={filterDept}
            onChange={e => { setFilterDept(e.target.value); setLoading(true); }}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-800
                       focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {(filterSem || filterYear || filterDept) && (
            <button
              onClick={() => { setFilterSem(''); setFilterYear(''); setFilterDept(''); setLoading(true); }}
              className="text-xs font-semibold text-cardinal-700 hover:text-cardinal-900 uppercase tracking-wide"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Grouped courses ── */}
      {groupKeys.map(group => (
        <section key={group} className="space-y-4">
          <div>
            <p className="label-inst text-cardinal-700">Group</p>
            <h2 className="font-serif text-xl font-semibold text-gray-900 mt-0.5 flex items-center gap-2">
              {group}
              <span className="text-sm font-sans font-normal text-gray-400">({grouped[group].length})</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {grouped[group].map((course) => (
              <article key={course._id || course.id} className="surface-card p-5 hover:border-cardinal-300 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-base font-semibold text-gray-900 leading-tight">{course.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {course.code && (
                        <span className="text-[10px] font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                          {course.code}
                        </span>
                      )}
                      {course.semester && (
                        <span className="label-inst text-[10px] bg-cardinal-50 text-cardinal-700 px-2 py-0.5 rounded-full border border-cardinal-100">
                          Sem {course.semester}
                        </span>
                      )}
                      {course.year && (
                        <span className="label-inst text-[10px] bg-gold-50 text-gold-700 px-2 py-0.5 rounded-full border border-gold-100">
                          Year {course.year}
                        </span>
                      )}
                      {course.regulation && (
                        <span className="label-inst text-[10px] bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                          {course.regulation}
                        </span>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => openForm(course)}
                        className="p-1.5 text-gray-400 hover:text-cardinal-700 rounded-md hover:bg-cardinal-50 transition-colors"
                        title="Edit"
                      >
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(course._id || course.id)}
                        className="p-1.5 text-gray-400 hover:text-cardinal-700 rounded-md hover:bg-cardinal-50 transition-colors"
                        title="Delete"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {course.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">{course.description}</p>
                )}

                {course.batches?.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                    <p className="label-inst text-gray-400">Batches & faculty</p>
                    {course.batches.map((b, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="bg-cardinal-50 text-cardinal-800 px-2 py-0.5 rounded font-medium truncate max-w-[130px]">
                          {b.batch_id?.name || 'Unknown'}
                        </span>
                        <span className="text-gray-300">→</span>
                        <span className="text-gray-600 truncate">{b.teacher_id?.name || 'Unassigned'}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex gap-3 text-[11px] text-gray-400">
                  {course.credits > 0 && <span>{course.credits} credits</span>}
                  {course.department && <span>· {course.department}</span>}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {courses.length === 0 && (
        <div className="surface-card p-12 text-center">
          <HiOutlineBookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="font-serif text-lg text-gray-700">No courses found</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting filters or add a new course.</p>
        </div>
      )}

      {/* ── Form modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="surface-card max-w-2xl w-full p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="label-inst text-cardinal-700">{editing ? 'Edit' : 'Create'}</p>
                <h2 className="font-serif text-2xl font-semibold text-gray-900 mt-0.5">
                  {editing ? 'Edit course' : 'New course'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-inst text-gray-600">Course name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
                <div>
                  <label className="label-inst text-gray-600">Course code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
                <div>
                  <label className="label-inst text-gray-600">Semester</label>
                  <select
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  >
                    <option value="">Select semester</option>
                    {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-inst text-gray-600">Year</label>
                  <select
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  >
                    <option value="">Select year</option>
                    {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-inst text-gray-600">Regulation</label>
                  <input
                    type="text"
                    value={form.regulation}
                    onChange={(e) => setForm({ ...form, regulation: e.target.value })}
                    placeholder="e.g. R2024"
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
                <div>
                  <label className="label-inst text-gray-600">Credits</label>
                  <input
                    type="number"
                    value={form.credits}
                    onChange={(e) => setForm({ ...form, credits: e.target.value })}
                    min="0"
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-inst text-gray-600">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="label-inst text-gray-600">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows="2"
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none resize-none"
                />
              </div>

              {/* Batch → Faculty Assignments */}
              {isAdmin && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="label-inst text-cardinal-700">Batch & faculty assignments</p>
                    <button
                      type="button"
                      onClick={addBatchRow}
                      className="flex items-center gap-1 text-xs font-semibold text-cardinal-700 hover:text-cardinal-900 uppercase tracking-wide"
                    >
                      <HiOutlinePlus className="w-4 h-4" /> Add batch
                    </button>
                  </div>
                  {batchAssignments.length === 0 && (
                    <p className="text-sm text-gray-400 italic py-4 text-center border border-dashed border-gray-300 rounded-md">
                      No batches assigned.
                    </p>
                  )}
                  <div className="space-y-2">
                    {batchAssignments.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-2.5 rounded-md">
                        <select
                          value={row.batch_id}
                          onChange={(e) => updateBatchRow(idx, 'batch_id', e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white
                                     focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                        >
                          <option value="">Select batch</option>
                          {allBatches.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
                        </select>
                        <span className="text-gray-400 text-sm">→</span>
                        <select
                          value={row.teacher_id}
                          onChange={(e) => updateBatchRow(idx, 'teacher_id', e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white
                                     focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                        >
                          <option value="">Select faculty</option>
                          {allTeachers.map(t => <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeBatchRow(idx)}
                          className="p-1.5 text-gray-400 hover:text-cardinal-700 rounded-md hover:bg-cardinal-50 transition-colors"
                        >
                          <HiOutlineX className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
    </div>
  );
};

export default Courses;
