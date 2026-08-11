import { useState, useRef, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { useProfile } from '../../contexts/ProfileContext';
import { useNavigate } from 'react-router-dom';

const EditProfileModal = () => {
  const { profile, updateProfile, editModalOpen, setEditModalOpen } = useProfile();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    nic: '',
    studentId: '',
    avatar: ''
  });

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'AJ';

  useEffect(() => {
    if (editModalOpen) {
      setEditForm({
        name: profile?.name || '',
        email: profile?.email || '',
        nic: profile?.nic || '',
        studentId: profile?.studentId || '',
        avatar: profile?.avatar || ''
      });
    }
  }, [editModalOpen, profile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: editForm.name,
        email: editForm.email,
        nic: editForm.nic
      };

      if (editForm.avatar !== profile?.avatar) {
        payload.avatar = editForm.avatar;
      }

      const response = await fetch(`http://${window.location.hostname}:5000/api/user/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        updateProfile(data.user);
        setEditModalOpen(false);
        alert('Profile updated successfully!');
      } else {
        let errMsg = 'Failed to update profile';
        try {
          const data = await response.json();
          errMsg = data.error || errMsg;
        } catch (parseErr) {
          errMsg = `Server Error (Status ${response.status})`;
        }
        alert(errMsg);
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('studentProfile');
          localStorage.removeItem('studentAvatar');
          navigate('/login');
        }
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('An error occurred while saving profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setEditForm(prev => ({ ...prev, avatar: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  if (!editModalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[32px] max-w-md w-full shadow-2xl border border-white relative text-left overflow-hidden">
          {/* Close Button */}
          <button
            onClick={() => setEditModalOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="p-8">
            {/* Header */}
            <h2 className="text-2xl font-extrabold text-gray-900 leading-none">Edit Profile</h2>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              Make changes to your profile information here. Click save when you're done.
            </p>

            <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
              {/* Profile Picture */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Profile Picture</label>
                <div className="flex items-center gap-4">
                  {editForm.avatar ? (
                    <img
                      src={editForm.avatar}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-white ring-2 ring-red-100"
                    />
                  ) : profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-white ring-2 ring-red-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#800000] to-[#4d0000] flex items-center justify-center text-white text-xl font-black shadow-md">
                      {initials}
                    </div>
                  )}
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 text-sm font-bold text-gray-700 transition-colors cursor-pointer"
                    >
                      <Upload size={14} /> Upload Photo
                    </button>
                    <p className="text-[10px] text-gray-400 mt-1.5 ml-1">JPG, PNG or GIF (max. 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[#800000] text-sm font-semibold text-gray-800"
                  placeholder="Full Name"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[#800000] text-sm font-semibold text-gray-800"
                  placeholder="Email Address"
                  required
                />
              </div>

              {/* NIC Number */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">NIC Number</label>
                <input
                  type="text"
                  value={editForm.nic}
                  onChange={(e) => setEditForm({ ...editForm, nic: e.target.value })}
                  className="w-full bg-[#F3F6FF] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[#800000] text-sm font-semibold text-gray-800"
                  placeholder="NIC Number"
                  required
                />
              </div>

              {/* Student ID */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Student ID</label>
                <input
                  type="text"
                  value={editForm.studentId}
                  className="w-full bg-[#ECEEF2] border-none rounded-xl py-3 px-4 outline-none text-sm font-semibold text-gray-500 cursor-not-allowed"
                  disabled
                />
                <p className="text-[10px] text-gray-400 italic ml-1 mt-1">Student ID cannot be changed</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="border border-gray-200 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-[#800000] hover:bg-[#660000] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-red-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />
    </>
  );
};

export default EditProfileModal;
