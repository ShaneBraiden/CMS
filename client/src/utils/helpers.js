import dayjs from 'dayjs';

export const formatDate = (date) => dayjs(date).format('DD MMM YYYY');
export const formatDateTime = (date) => dayjs(date).format('DD MMM YYYY, hh:mm A');
export const formatDateInput = (date) => dayjs(date).format('YYYY-MM-DD');

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getAttendanceColor = (percentage) => {
  if (percentage >= 75) return 'text-green-600 bg-green-50';
  if (percentage >= 50) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

export const getStatusColor = (status) => {
  const colors = {
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    od: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    submitted: 'bg-blue-100 text-blue-800',
    graded: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};
