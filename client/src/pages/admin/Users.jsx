import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus, HiOutlineTrash, HiOutlineUserGroup, HiOutlineX,
  HiOutlineUsers,
} from 'react-icons/hi';

const ROLE_FILTERS = [
  { id: '',        label: 'All' },
  { id: 'admin',   label: 'Admin' },
  { id: 'teacher', label: 'Faculty' },
  { id: 'student', label: 'Student' },
];

const ROLE_STYLES = {
  admin:   'bg-cardinal-50 text-cardinal-700 border-cardinal-100',
  teacher: 'bg-gold-50 text-gold-700 border-gold-100',
  student: 'bg-ink-50 text-ink-700 border-ink-100',
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [bulkForm, setBulkForm] = useState({
    startEmail: '', endEmail: '', password: 'sret@321', role: 'student', batch_id: '',
  });
  const [batches, setBatches] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkPreview, setBulkPreview] = useState(null);

  useEffect(() => { fetchUsers(); /* eslint-disable-next-line */ }, [filter]);

  const fetchUsers = async () => {
    try {
      const url = filter ? `/admin/users?role=${filter}` : '/admin/users';
      const { data } = await API.get(url);
      setUsers(data.data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const fetchBatches = async () => {
    try {
      const { data } = await API.get('/admin/batches');
      setBatches(data.data);
    } catch { /* ignore */ }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/users', form);
      toast.success('User created');
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'student' });
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try { await API.delete(`/admin/users/${id}`); toast.success('Deleted'); fetchUsers(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const computeBulkPreview = (start, end) => {
    const parseEmail = (email) => {
      const match = email.trim().toLowerCase().match(/^([a-zA-Z]*)(\d+)(@.+)$/);
      if (!match) return null;
      return { prefix: match[1], number: match[2], suffix: match[3] };
    };
    const s = parseEmail(start);
    const e = parseEmail(end);
    if (!s || !e || s.prefix !== e.prefix || s.suffix !== e.suffix) return null;
    const startNum = parseInt(s.number, 10);
    const endNum = parseInt(e.number, 10);
    if (startNum > endNum || endNum - startNum > 500) return null;
    const count = endNum - startNum + 1;
    const firstName = `${s.prefix.toUpperCase()}${String(startNum).padStart(s.number.length, '0')}`;
    const lastName = `${s.prefix.toUpperCase()}${String(endNum).padStart(s.number.length, '0')}`;
    return { count, firstName, lastName };
  };

  const openBulkForm = async () => {
    await fetchBatches();
    setBulkForm({ startEmail: '', endEmail: '', password: 'sret@321', role: 'student', batch_id: '' });
    setBulkPreview(null);
    setShowBulk(true);
  };

  const handleBulkEmailChange = (field, value) => {
    const updated = { ...bulkForm, [field]: value };
    setBulkForm(updated);
    setBulkPreview(computeBulkPreview(updated.startEmail, updated.endEmail));
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setBulkLoading(true);
    try {
      const { data } = await API.post('/admin/users/bulk', bulkForm);
      toast.success(data.message);
      if (data.data.skippedEmails?.length > 0) {
        toast(`Skipped: ${data.data.skippedEmails.slice(0, 5).join(', ')}${data.data.skippedEmails.length > 5 ? '…' : ''}`, { icon: '⚠️' });
      }
      setShowBulk(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk create failed');
    } finally {
      setBulkLoading(false);
    }
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
          <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">Users</h1>
          <div className="divider-gold mt-3 max-w-[120px]" />
          <p className="text-sm text-gray-500 mt-3">Manage students, faculty, and administrators.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openBulkForm}
            className="bg-white hover:bg-cardinal-50 text-cardinal-700 px-4 py-2.5 rounded-md
                       font-semibold text-sm uppercase tracking-wide border border-cardinal-300
                       flex items-center gap-2 transition-colors"
          >
            <HiOutlineUserGroup className="w-5 h-5" /> Bulk Add
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                       px-4 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                       border border-cardinal-800 flex items-center gap-2 transition-colors"
          >
            <HiOutlinePlus className="w-5 h-5" /> Add User
          </button>
        </div>
      </div>

      {/* ── Role filter ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="surface-card p-2 inline-flex gap-1">
          {ROLE_FILTERS.map(r => (
            <button
              key={r.id}
              onClick={() => { setFilter(r.id); setLoading(true); }}
              className={`px-4 py-2 rounded-md text-sm font-semibold tracking-wide transition-colors ${
                filter === r.id
                  ? 'bg-cardinal-700 text-white'
                  : 'text-gray-600 hover:bg-cardinal-50 hover:text-cardinal-700'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <span className="ml-auto label-inst text-gray-400">{users.length} total</span>
      </div>

      {/* ── Table ── */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left label-inst text-gray-500">Name</th>
                <th className="px-6 py-3 text-left label-inst text-gray-500">Email</th>
                <th className="px-6 py-3 text-left label-inst text-gray-500">Role</th>
                <th className="px-6 py-3 text-left label-inst text-gray-500">Batch</th>
                <th className="px-6 py-3 text-right label-inst text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u._id || u.id} className="hover:bg-cardinal-50/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`label-inst text-[10px] px-2 py-0.5 rounded-full border ${ROLE_STYLES[u.role] || ROLE_STYLES.student}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{u.batch_id?.name || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(u._id || u.id)}
                      className="p-2 text-gray-400 hover:text-cardinal-700 rounded-md hover:bg-cardinal-50 transition-colors"
                      title="Delete"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <HiOutlineUsers className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Single user modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="surface-card max-w-md w-full p-7">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="label-inst text-cardinal-700">Create</p>
                <h2 className="font-serif text-2xl font-semibold text-gray-900 mt-0.5">New user</h2>
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
                <label className="label-inst text-gray-600">Full name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                />
              </div>
              <div>
                <label className="label-inst text-gray-600">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                />
              </div>
              <div>
                <label className="label-inst text-gray-600">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                />
              </div>
              <div>
                <label className="label-inst text-gray-600">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Faculty</option>
                  <option value="admin">Admin</option>
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Bulk create modal ── */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="surface-card max-w-lg w-full p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="label-inst text-cardinal-700">Bulk Import</p>
                <h2 className="font-serif text-2xl font-semibold text-gray-900 mt-0.5">Bulk add users</h2>
                <p className="text-sm text-gray-500 mt-1">Create multiple users from a sequential email range.</p>
              </div>
              <button
                onClick={() => setShowBulk(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-inst text-gray-600">Start email *</label>
                  <input
                    type="text"
                    placeholder="e0324001@sriher.edu.in"
                    value={bulkForm.startEmail}
                    onChange={e => handleBulkEmailChange('startEmail', e.target.value)}
                    required
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800 text-sm
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
                <div>
                  <label className="label-inst text-gray-600">End email *</label>
                  <input
                    type="text"
                    placeholder="e0324051@sriher.edu.in"
                    value={bulkForm.endEmail}
                    onChange={e => handleBulkEmailChange('endEmail', e.target.value)}
                    required
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800 text-sm
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-inst text-gray-600">Default password</label>
                  <input
                    type="text"
                    value={bulkForm.password}
                    onChange={e => setBulkForm({ ...bulkForm, password: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800 text-sm
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  />
                </div>
                <div>
                  <label className="label-inst text-gray-600">Role</label>
                  <select
                    value={bulkForm.role}
                    onChange={e => setBulkForm({ ...bulkForm, role: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800 text-sm
                               focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Faculty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-inst text-gray-600">Assign to batch (optional)</label>
                <select
                  value={bulkForm.batch_id}
                  onChange={e => setBulkForm({ ...bulkForm, batch_id: e.target.value })}
                  className="w-full mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800 text-sm
                             focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
                >
                  <option value="">No batch</option>
                  {batches.map(b => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
                </select>
              </div>

              {bulkPreview && (
                <div className="bg-cardinal-50/50 border border-cardinal-100 rounded-md p-4">
                  <p className="label-inst text-cardinal-700 mb-2">Preview</p>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><span className="font-serif font-semibold text-cardinal-800 text-base">{bulkPreview.count}</span> users will be created</p>
                    <p>Names: <span className="font-mono text-xs">{bulkPreview.firstName}</span> → <span className="font-mono text-xs">{bulkPreview.lastName}</span></p>
                    <p>Password: <span className="font-mono text-xs">{bulkForm.password}</span></p>
                    <p className="text-xs text-gray-500 mt-1">Existing emails are skipped automatically.</p>
                  </div>
                </div>
              )}

              {!bulkPreview && bulkForm.startEmail && bulkForm.endEmail && (
                <div className="bg-cardinal-50 border border-cardinal-200 rounded-md p-3">
                  <p className="text-sm text-cardinal-800">
                    Invalid email range. Both emails must have the same prefix and domain, e.g.
                    <span className="font-mono"> e0324001@sriher.edu.in</span> →
                    <span className="font-mono"> e0324051@sriher.edu.in</span>.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowBulk(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md font-semibold text-sm
                             uppercase tracking-wide text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!bulkPreview || bulkLoading}
                  className="flex-1 bg-cardinal-700 hover:bg-cardinal-800 active:bg-cardinal-900 text-white
                             px-4 py-2.5 rounded-md font-semibold text-sm uppercase tracking-wide
                             border border-cardinal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {bulkLoading ? 'Creating…' : `Create ${bulkPreview?.count || 0} users`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
