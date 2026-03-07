// Profile page functionality
lucide.createIcons();

// Avatar preview
const avatarInput = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');

avatarInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(ev) {
      avatarPreview.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Form submissions (demo)
document.getElementById('profileForm').addEventListener('submit', e => {
  e.preventDefault();
  alert('Profile updated successfully! (demo)');
});

document.getElementById('passwordForm').addEventListener('submit', e => {
  e.preventDefault();
  alert('Password changed successfully! (demo)');
});
