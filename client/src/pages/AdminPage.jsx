import { useEffect, useState } from 'react';
import { users as usersApi } from '../lib/api';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/utils';
import PageHeader from '../components/ui/PageHeader';
import { Shield, ShieldCheck, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';

export default function AdminPage() {
  const { isAdmin, profile } = useAuth();
  const [memberList, setMemberList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMembers(); }, []);

  async function loadMembers() {
    try {
      setMemberList(await usersApi.list());
    } catch {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    const member = memberList.find(m => m.id === userId);
    const action = newRole === 'admin' ? 'Promote' : 'Demote';
    if (!confirm(`${action} ${member.characterName} to ${newRole}?`)) return;

    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      toast.success(`${member.characterName} is now ${newRole}`);
      loadMembers();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        description="Manage ranch members and their roles."
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-wood-300 border-t-wood-700 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-parchment-200 dark:border-wood-800">
                <th className="text-left py-3 px-5 font-medium text-wood-500 dark:text-wood-400">Character Name</th>
                <th className="text-left py-3 px-5 font-medium text-wood-500 dark:text-wood-400">Username</th>
                <th className="text-left py-3 px-5 font-medium text-wood-500 dark:text-wood-400">Role</th>
                <th className="text-left py-3 px-5 font-medium text-wood-500 dark:text-wood-400">Joined</th>
                <th className="py-3 px-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment-100 dark:divide-wood-800">
              {memberList.map(member => (
                <tr key={member.id} className="hover:bg-parchment-50 dark:hover:bg-wood-900/50">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      {member.role === 'admin' ? (
                        <ShieldCheck size={16} className="text-amber-600" />
                      ) : (
                        <UserCog size={16} className="text-wood-400" />
                      )}
                      <span className="font-medium">{member.characterName || member.displayName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-wood-500">{member.username || '—'}</td>
                  <td className="py-3 px-5">
                    <span className={`badge ${member.role === 'admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-parchment-200 text-wood-600 dark:bg-wood-800 dark:text-wood-300'}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-wood-400 text-xs">{formatDate(member.createdAt)}</td>
                  <td className="py-3 px-5">
                    {member.id !== profile.id && (
                      <select
                        className="input w-auto text-xs"
                        value={member.role}
                        onChange={e => handleRoleChange(member.id, e.target.value)}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                    {member.id === profile.id && (
                      <span className="text-xs text-wood-400 italic">You</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
