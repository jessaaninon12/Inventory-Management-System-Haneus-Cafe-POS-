import React, { useState } from 'react';
import { Camera } from 'lucide-react';

export default function Profile() {
  const user = JSON.parse(localStorage.getItem('haneus_user') || '{}');
  const [preview, setPreview] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <header className="bg-white p-6 rounded-xl border border-latte shadow-sm">
        <h1 className="text-2xl font-bold text-espresso">My Profile</h1>
        <p className="text-mocha text-sm mt-1">Manage your account details, avatar, and security settings</p>
      </header>

      <div className="bg-white rounded-xl shadow-lg border border-latte/30 p-8 max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
          <div className="relative group">
            <img 
              src={preview || "https://static.vecteezy.com/system/resources/previews/014/194/215/original/avatar-icon-human-a-person-s-badge-social-media-profile-symbol-the-symbol-of-a-person-vector.jpg"} 
              alt="Profile" 
              className="w-32 h-32 rounded-full border-4 border-latte object-cover"
            />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="text-white w-8 h-8" />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-espresso">{user.name || 'Admin'}</h2>
            <p className="text-mocha font-medium">Admin • Haneus Cafe Owner</p>
            <p className="text-xs text-mocha/60 mt-2">Joined: January 2024</p>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="text-lg font-bold text-espresso mb-4 pb-2 border-b border-latte">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-espresso">Full Name</label>
                <input type="text" defaultValue={user.name} className="w-full px-4 py-2.5 bg-cream border border-latte rounded-lg focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-espresso">Email Address</label>
                <input type="email" defaultValue={user.email} className="w-full px-4 py-2.5 bg-cream border border-latte rounded-lg focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-espresso">Phone Number</label>
                <input type="tel" defaultValue="+63 917 123 4567" className="w-full px-4 py-2.5 bg-cream border border-latte rounded-lg focus:outline-none focus:border-primary" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-espresso">Short Bio / Role Description</label>
                <textarea rows={3} className="w-full px-4 py-2.5 bg-cream border border-latte rounded-lg focus:outline-none focus:border-primary resize-none">Managing daily operations, menu planning, and staff at Haneus Cafe in Roxas.</textarea>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="px-6 py-2.5 bg-white border border-latte text-espresso rounded-lg font-medium hover:bg-latte/20 transition-colors">Cancel</button>
              <button className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold shadow-md hover:bg-primary-dark transition-all">Save Changes</button>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-espresso mb-4 pb-2 border-b border-latte">Change Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-espresso">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-cream border border-latte rounded-lg focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-espresso">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-cream border border-latte rounded-lg focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-espresso">Confirm New Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-cream border border-latte rounded-lg focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold shadow-md hover:bg-primary-dark transition-all">Update Password</button>
            </div>
          </section>

          <section className="pt-6 border-t border-latte">
            <h3 className="text-lg font-bold text-red-600 mb-4">Account Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-semibold shadow-md hover:bg-red-700 transition-all">Delete Account</button>
              <button className="px-6 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors">Log Out from All Devices</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
