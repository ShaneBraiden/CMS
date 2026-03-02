import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiPlus, HiTrash, HiUserGroup } from 'react-icons/hi';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [bulkForm, setBulkForm] = useState({ startEmail: '', endEmail: '', password: 'sret@321', role: 'student', batch_id: '' });
  const [batches, setBatches] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkPreview, setBulkPreview] = useState(null);

  useEffect(() => { fetchUsers(); }, [filter]);

  const fetchUsers = async () => {
    try {
      const url = filter ? `/admin/users?role=${filter}` : '/admin/users';
      const { data } = await API.get(url);
      setUsers(data.data);
    } catch { toast.error('Failed'); }
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

  // Bulk preview calculation
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
    const firstEmail = `${s.prefix}${String(startNum).padStart(s.number.length, '0')}${s.suffix}`;
    const lastName = `${s.prefix.toUpperCase()}${String(endNum).padStart(s.number.length, '0')}`;
    const firstName = `${s.prefix.toUpperCase()}${String(startNum).padStart(s.number.length, '0')}`;
    return { count, firstName, lastName, firstEmail };
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
        toast(`Skipped: ${data.data.skippedEmails.slice(0, 5).join(', ')}${data.data.skippedEmails.length > 5 ? '...' : ''}`, { icon: '⚠️' });
      }
      setShowBulk(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk create failed');
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        <div className="flex gap-2">
          <button onClick={openBulkForm} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <HiUserGroup className="w-5 h-5" /> Bulk Add
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <HiPlus className="w-5 h-5" /> Add User
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['', 'admin', 'teacher', 'student'].map(r => (
          <button key={r} onClick={() => { setFilter(r); setLoading(true); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium ${filter === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {r || 'All'}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">{users.length} users</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Email</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Role</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Batch</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{u.name}</td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4"><span className="capitalize px-2 py-0.5 rounded-full text-xs bg-gray-100">{u.role}</span></td>
                  <td className="px-6 py-4 text-gray-500">{u.batch_id?.name || '—'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDelete(u._id)} className="text-red-500 hover:text-red-700" title="Delete">
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No users found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single user modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">Add User</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option>
              </select>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk create modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-lg font-semibold mb-1">Bulk Add Users</h2>
            <p className="text-sm text-gray-500 mb-4">Create multiple users from an email range. Names are auto-generated from the email prefix.</p>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Email *</label>
                  <input type="text" placeholder="e0324001@sriher.edu.in" value={bulkForm.startEmail}
                    onChange={e => handleBulkEmailChange('startEmail', e.target.value)} required
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Email *</label>
                  <input type="text" placeholder="e0324051@sriher.edu.in" value={bulkForm.endEmail}
                    onChange={e => handleBulkEmailChange('endEmail', e.target.value)} required
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Password</label>
                  <input type="text" value={bulkForm.password}
                    onChange={e => setBulkForm({...bulkForm, password: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={bulkForm.role} onChange={e => setBulkForm({...bulkForm, role: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Batch (optional)</label>
                <select value={bulkForm.batch_id} onChange={e => setBulkForm({...bulkForm, batch_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="">No batch</option>
                  {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>

              {/* Preview */}
              {bulkPreview && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-800 mb-2">Preview</p>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><span className="font-medium">{bulkPreview.count}</span> users will be created</p>
                    <p>Names: <span className="font-mono">{bulkPreview.firstName}</span> to <span className="font-mono">{bulkPreview.lastName}</span></p>
                    <p>Password: <span className="font-mono">{bulkForm.password}</span></p>
                    <p className="text-xs text-blue-500 mt-1">Existing emails will be skipped automatically</p>
                  </div>
                </div>
              )}

              {!bulkPreview && bulkForm.startEmail && bulkForm.endEmail && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">Invalid email range. Both emails must have the same prefix and domain, e.g. <span className="font-mono">e0324001@sriher.edu.in</span> to <span className="font-mono">e0324051@sriher.edu.in</span></p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowBulk(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={!bulkPreview || bulkLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {bulkLoading ? 'Creating...' : `Create ${bulkPreview?.count || 0} Users`}
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
