import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { getAttendanceColor } from '../../utils/helpers';

const AdminAttendance = () => {
  const [view, setView] = useState('by-course');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => { fetchData(); }, [view, dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/admin/attendance/${view}`;
      if (view === 'by-date' && dateFilter) url += `?date=${dateFilter}`;
      const { data: res } = await API.get(url);
      setData(res.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Attendance Reports</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['by-course', 'by-date', 'by-student'].map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${view === v ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {v.replace('-', ' ')}
          </button>
        ))}
      </div>

      {view === 'by-date' && (
        <div className="mb-4">
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg outline-none" />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {view === 'by-course' && (
                    <>
                      <th className="px-6 py-3 text-left font-medium text-gray-500">Course</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500">Total</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500">Present</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500">%</th>
                    </>
                  )}
                  {view === 'by-date' && (
                    <>
                      <th className="px-6 py-3 text-left font-medium text-gray-500">Student</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500">Course</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                    </>
                  )}
                  {view === 'by-student' && (
                    <>
                      <th className="px-6 py-3 text-left font-medium text-gray-500">Student</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500">Email</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500">Total</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500">Present</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500">%</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {view === 'by-course' && (
                      <>
                        <td className="px-6 py-4 font-medium">{item.course_name || 'N/A'}</td>
                        <td className="px-6 py-4">{item.total}</td>
                        <td className="px-6 py-4">{item.present}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded ${getAttendanceColor(item.percentage)}`}>{item.percentage}%</span></td>
                      </>
                    )}
                    {view === 'by-date' && (
                      <>
                        <td className="px-6 py-4 font-medium">{item.student_id?.name || 'N/A'}</td>
                        <td className="px-6 py-4">{item.course_id?.name || 'N/A'}</td>
                        <td className="px-6 py-4 capitalize">{item.status}</td>
                      </>
                    )}
                    {view === 'by-student' && (
                      <>
                        <td className="px-6 py-4 font-medium">{item.name}</td>
                        <td className="px-6 py-4 text-gray-500">{item.email}</td>
                        <td className="px-6 py-4">{item.totalClasses}</td>
                        <td className="px-6 py-4">{item.presentClasses}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded ${getAttendanceColor(item.percentage)}`}>{item.percentage}%</span></td>
                      </>
                    )}
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No data found</td></tr>
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
