import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BandMember } from '../types';
import { Plus, Trash2, Edit2, Loader2, X, Check } from 'lucide-react';
import { handleSupabaseError, OperationType } from '../lib/error-handler';

interface BandMembersManagerProps {
  bandId: string;
}

export default function BandMembersManager({ bandId }: BandMembersManagerProps) {
  const [members, setMembers] = useState<BandMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<BandMember> | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (bandId && bandId !== 'new') {
      fetchMembers();
    } else {
      setLoading(false);
    }
  }, [bandId]);

  async function fetchMembers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('band_members')
        .select('*')
        .eq('band_id', bandId)
        .order('first_name');
        
      if (error) throw error;
      if (data) setMembers(data);
    } catch (error) {
      console.error('Error fetching band members:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveMember(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMember?.email || !editingMember?.first_name || !editingMember?.last_name) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      let personId = editingMember.person_id;

      // If no person_id, search by email
      if (!personId) {
        const { data: existingPerson, error: searchError } = await supabase
          .from('people')
          .select('id, roles')
          .eq('email', editingMember.email.toLowerCase().trim())
          .maybeSingle();

        if (searchError) throw searchError;

        if (existingPerson) {
          personId = existingPerson.id;
          // Update role to include musician if not already
          if (!existingPerson.roles.includes('musician')) {
            const newRoles = [...existingPerson.roles, 'musician'];
            await supabase.from('people').update({ roles: newRoles }).eq('id', personId);
          }
        } else {
          // Create new person
          const { data: newPerson, error: createError } = await supabase
            .from('people')
            .insert({
              first_name: editingMember.first_name,
              last_name: editingMember.last_name,
              email: editingMember.email.toLowerCase().trim(),
              roles: ['musician'],
              band_ids: [bandId],
              venue_ids: []
            })
            .select()
            .single();

          if (createError) throw createError;
          if (newPerson) personId = newPerson.id;
        }
      }

      if (!personId) {
        throw new Error('Failed to resolve or create a User ID for this member.');
      }

      const memberData = {
        band_id: bandId,
        person_id: personId,
        first_name: editingMember.first_name,
        last_name: editingMember.last_name,
        email: editingMember.email.toLowerCase().trim(),
        instrument_description: editingMember.instrument_description || '',
        is_active: editingMember.is_active !== undefined ? editingMember.is_active : true,
      };

      if (editingMember.id) {
        // Update existing
        const { error } = await supabase
          .from('band_members')
          .update(memberData)
          .eq('id', editingMember.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('band_members')
          .insert(memberData);
        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Band member saved successfully!' });
      fetchMembers();
      setTimeout(() => {
        setIsModalOpen(false);
        setEditingMember(null);
        setMessage(null);
      }, 1500);

    } catch (error: any) {
      console.error('Error saving band member:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save band member.' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(member: BandMember) {
    try {
      const { error } = await supabase
        .from('band_members')
        .update({ is_active: !member.is_active })
        .eq('id', member.id);
      
      if (error) throw error;
      fetchMembers();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  }

  if (bandId === 'new') {
    return (
      <div className="max-w-4xl mx-auto mt-12 pt-8 border-t border-neutral-800">
        <h3 className="text-2xl font-bold mb-6">Band Members</h3>
        <p className="text-neutral-500">Please save the band profile first before adding members.</p>
      </div>
    );
  }

  return (
    <div id="band-members-section" className="max-w-4xl mx-auto mt-12 pt-8 border-t border-neutral-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Band Members</h3>
        <button
          type="button"
          onClick={() => {
            setEditingMember({ is_active: true });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-red-600" size={32} />
        </div>
      ) : members.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
          <p className="text-neutral-500">No members added yet.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-950 border-b border-neutral-800">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Instrument</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{member.first_name} {member.last_name}</td>
                    <td className="px-6 py-4 text-neutral-400">{member.email}</td>
                    <td className="px-6 py-4 text-neutral-400">{member.instrument_description}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(member)}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                          member.is_active 
                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' 
                            : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
                        }`}
                      >
                        {member.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditingMember(member);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">{editingMember?.id ? 'Edit Member' : 'Add Band Member'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            {message && (
              <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
                <p className="font-medium">{message.text}</p>
              </div>
            )}

            <form onSubmit={handleSaveMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-400">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editingMember?.first_name || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, first_name: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-400">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editingMember?.last_name || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, last_name: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400">Email *</label>
                <input
                  type="email"
                  required
                  value={editingMember?.email || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                />
                <p className="text-xs text-neutral-500 mt-1">We will use this to link to an existing user or create a new one.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400">Instrument Description</label>
                <input
                  type="text"
                  value={editingMember?.instrument_description || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, instrument_description: e.target.value })}
                  placeholder="e.g., Lead Guitar, Vocals"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-400">User ID (Read Only)</label>
                <input
                  type="text"
                  readOnly
                  value={editingMember?.person_id || 'Will be generated/linked on save'}
                  className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl px-4 py-3 text-neutral-500 outline-none cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingMember?.is_active !== false}
                  onChange={(e) => setEditingMember({ ...editingMember, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-neutral-600 text-red-600 focus:ring-red-600 bg-neutral-900"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-white cursor-pointer">
                  Active Member
                </label>
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
