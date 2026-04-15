import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { getAttendanceColor } from '../../utils/helpers';
import { HiOutlineClipboardCheck } from 'react-icons/hi';

const VIEWS = [
  { id: 'by-course',  label: 'By course' },
  { id: 'by-date',    label: 'By date' },
  { id: 'by-student', label: 'By student' },
];

const AdminAttendance = () => {
  const [view, setView] = useState('by-course');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [view, dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/admin/attendance/${view}`;
      if (view === 'by-date' && dateFilter) url += `?date=${dateFilter}`;
      const { data: res } = await API.get(url);
      setData(res.data);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  const pct = (p) => (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getAttendanceColor(p)}`}>
      {p}%
    </span>
  );

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div>
        <p className="label-inst text-cardinal-700">Administration</p>
        <h1 className="font-serif text-3xl font-semibold text-gray-900 mt-1">Attendance reports</h1>
        <div className="divider-gold mt-3 max-w-[120px]" />
        <p className="text-sm text-gray-500 mt-3">Aggregate attendance across courses, dates, and students.</p>
      </div>

      {/* ── Tabs ── */}
      <div className="surface-card p-2 inline-flex gap-1">
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-4 py-2 rounded-md text-sm font-semibold tracking-wide transition-colors ${
              view === v.id
                ? 'bg-cardinal-700 text-white'
                : 'text-gray-600 hover:bg-cardinal-50 hover:text-cardinal-700'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'by-date' && (
        <div>
          <label className="label-inst text-gray-600">Filter by date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="block mt-1.5 px-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-800
                       focus:border-cardinal-600 focus:ring-2 focus:ring-cardinal-600/20 outline-none"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cardinal-700"></div>
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {view === 'by-course' && (
                    <>
                      <th className="px-6 py-3 text-left label-inst text-gray-500">Course</th>
                      <th className="px-6 py-3 text-left label-inst text-gray-500">Total</th>
                      <th className="px-6 py-3 text-left label-inst text-gray-500">Present</th>
                      <th className="px-6 py-3 text-left label-inst text-gray-500">Percentage</th>
                    </>
                  )}
                  {view === 'by-date' && (
                    <>
                      <th className="px-6 py-3 text-left label-inst text-gray-500">Student</th>
                      <th className="px-6 py-3 text-left label-inst text-gray-500">Course</th>
                      <th className="px-6 py-3 text-left label-inst text-gray-500">Status</th>
                    </>
                  )}
                  {view === 'by-student' && (
                    <>
                      <th className="px-6 py-3 text-left label-inst text-gray-500">Student</th>
                      <th className="px-6 py-3 text-left label-inst text-gray-500">Email</th>
                      <th className="px-6 py-3 text-left label-inst text-gray-500">Total</th>
                      <th className="px-6 py-3 text-left label-inst text-gray-500">Present</th>
                      <th className="px-6 py-3 text-left label-inst text-gray-500">Percentage</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item, i) => (
                  <tr key={i} className="hover:bg-cardinal-50/30 transition-colors">
                    {view === 'by-course' && (
                      <>
                        <td className="px-6 py-4 font-medium text-gray-900">{item.course_name || '—'}</td>
                        <td className="px-6 py-4 text-gray-700 tabular-nums">{item.total}</td>
                        <td className="px-6 py-4 text-gray-700 tabular-nums">{item.present}</td>
                        <td className="px-6 py-4">{pct(item.percentage)}</td>
                      </>
                    )}
                    {view === 'by-date' && (
                      <>
                        <td className="px-6 py-4 font-medium text-gray-900">{item.student_id?.name || '—'}</td>
                        <td className="px-6 py-4 text-gray-700">{item.course_id?.name || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`label-inst text-[10px] px-2 py-0.5 rounded-full border ${
                            item.status === 'present'
                              ? 'bg-green-50 text-green-700 border-green-100'
                              : 'bg-cardinal-50 text-cardinal-700 border-cardinal-100'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </>
                    )}
                    {view === 'by-student' && (
                      <>
                        <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 text-gray-500">{item.email}</td>
                        <td className="px-6 py-4 text-gray-700 tabular-nums">{item.totalClasses}</td>
                        <td className="px-6 py-4 text-gray-700 tabular-nums">{item.presentClasses}</td>
                        <td className="px-6 py-4">{pct(item.percentage)}</td>
                      </>
                    )}
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <HiOutlineClipboardCheck className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No data found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;
