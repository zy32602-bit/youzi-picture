/**
 * 柚子成长记录 - Main Application
 * PWA Cat Growth Tracker
 */

(function() {
  'use strict';

  // =========================================
  // Constants & Config
  // =========================================
  const DB_NAME = 'yozi_cat_db';
  const DB_VERSION = 1;
  const STORE_RECORDS = 'records';
  const STORE_PROFILE = 'profile';

  // =========================================
  // State
  // =========================================
  let db = null;
  let profileData = null;
  let recordsData = [];
  let editingRecordId = null;
  let deletingRecordId = null;
  let viewerPhotos = [];
  let viewerIndex = 0;
  let photoFiles = [];

  // =========================================
  // IndexedDB
  // =========================================
  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const database = event.target.result;

        if (!database.objectStoreNames.contains(STORE_RECORDS)) {
          const recordsStore = database.createObjectStore(STORE_RECORDS, { keyPath: 'id' });
          recordsStore.createIndex('date', 'date', { unique: false });
          recordsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!database.objectStoreNames.contains(STORE_PROFILE)) {
          database.createObjectStore(STORE_PROFILE, { keyPath: 'id' });
        }
      };
    });
  }

  function dbGet(storeName) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function dbPut(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function dbDelete(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // =========================================
  // Utilities
  // =========================================
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }

  function formatRelativeDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365)}年前`;
  }

  function calculateMonths(birthdayStr) {
    if (!birthdayStr) return null;
    const birthday = new Date(birthdayStr);
    const now = new Date();
    let months = (now.getFullYear() - birthday.getFullYear()) * 12;
    months += now.getMonth() - birthday.getMonth();
    if (now.getDate() < birthday.getDate()) months--;
    return Math.max(0, months);
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  // =========================================
  // Toast Notifications
  // =========================================
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 200);
    }, 2500);
  }

  // =========================================
  // Modal Management
  // =========================================
  function openModal(modalId) {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('hidden');
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeAllModals() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    document.body.style.overflow = '';

    // Reset record form
    const form = document.getElementById('record-form');
    form.reset();
    document.getElementById('record-date').value = new Date().toISOString().split('T')[0];
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.type-btn[data-type="daily"]').classList.add('active');
    document.getElementById('weight-group').classList.add('hidden');
    document.getElementById('photo-preview-grid').innerHTML = '';
    document.getElementById('photo-placeholder').classList.remove('hidden');
    photoFiles = [];
    editingRecordId = null;
  }

  // =========================================
  // Photo Viewer
  // =========================================
  function openPhotoViewer(photos, index) {
    viewerPhotos = photos;
    viewerIndex = index;
    const viewer = document.getElementById('photo-viewer');
    viewer.classList.remove('hidden');
    updateViewerImage();
    document.body.style.overflow = 'hidden';
  }

  function closePhotoViewer() {
    document.getElementById('photo-viewer').classList.add('hidden');
    document.body.style.overflow = '';
    viewerPhotos = [];
  }

  function updateViewerImage() {
    const img = document.getElementById('viewer-image');
    img.src = viewerPhotos[viewerIndex];
    document.getElementById('viewer-counter').textContent =
      `${viewerIndex + 1} / ${viewerPhotos.length}`;

    const prevBtn = document.getElementById('viewer-prev');
    const nextBtn = document.getElementById('viewer-next');
    prevBtn.style.visibility = viewerPhotos.length > 1 ? 'visible' : 'hidden';
    nextBtn.style.visibility = viewerPhotos.length > 1 ? 'visible' : 'hidden';
  }

  function viewerNav(direction) {
    viewerIndex = (viewerIndex + direction + viewerPhotos.length) % viewerPhotos.length;
    updateViewerImage();
  }

  // =========================================
  // Profile
  // =========================================
  function getDefaultProfile() {
    return {
      id: 'profile',
      name: '柚子',
      breed: '中华田园猫',
      birthday: '',
      arrival: '',
      avatar: null
    };
  }

  async function loadProfile() {
    const profiles = await dbGet(STORE_PROFILE);
    profileData = profiles.find(p => p.id === 'profile') || getDefaultProfile();
    renderProfile();
  }

  function renderProfile() {
    if (!profileData) return;

    document.getElementById('cat-birthday-display').textContent =
      profileData.birthday ? formatDate(profileData.birthday) : '未设置';
    document.getElementById('cat-arrival-display').textContent =
      profileData.arrival ? formatDate(profileData.arrival) : '未设置';

    const avatarEl = document.getElementById('profile-avatar');
    if (profileData.avatar) {
      avatarEl.innerHTML = `<img src="${profileData.avatar}" alt="${profileData.name}"/>`;
    } else {
      avatarEl.innerHTML = `
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"></path>
          <path d="M8 14v.5"></path>
          <path d="M16 14v.5"></path>
          <path d="M11.25 16.25h1.5L12 17l-.75-.75Z"></path>
        </svg>`;
    }

    updateStats();
  }

  function updateStats() {
    const months = profileData?.birthday ? calculateMonths(profileData.birthday) : null;
    document.getElementById('stat-months').textContent = months !== null ? `${months}个月` : '--';

    const weightRecords = recordsData.filter(r => r.weight != null).sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );
    document.getElementById('stat-weight').textContent =
      weightRecords.length > 0 ? `${weightRecords[0].weight} kg` : '--';

    document.getElementById('stat-records').textContent = recordsData.length;

    if (recordsData.length > 0) {
      const sorted = [...recordsData].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      document.getElementById('stat-last-update').textContent =
        formatRelativeDate(sorted[0].date);
    } else {
      document.getElementById('stat-last-update').textContent = '--';
    }
  }

  // =========================================
  // Timeline
  // =========================================
  async function loadRecords() {
    recordsData = await dbGet(STORE_RECORDS);
    recordsData.sort((a, b) => new Date(b.date) - new Date(a.date));
    renderTimeline();
    updateStats();
  }

  function getTypeLabel(type) {
    const labels = { daily: '日常', photo: '照片', weight: '体重', milestone: '里程碑' };
    return labels[type] || '日常';
  }

  function getTypeIcon(type) {
    const icons = {
      daily: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>',
      photo: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>',
      weight: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"></circle><path d="M12 8v8"></path><path d="M5 21a7 7 0 0 1 14 0"></path></svg>',
      milestone: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'
    };
    return icons[type] || icons.daily;
  }

  function renderTimeline() {
    const timeline = document.getElementById('timeline');
    const emptyState = document.getElementById('empty-state');

    if (recordsData.length === 0) {
      timeline.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    timeline.innerHTML = recordsData.map((record, index) => {
      const photos = record.photos || [];
      const photoGridClass = photos.length === 1 ? 'cols-1' :
                            photos.length === 2 ? 'cols-2' : 'cols-3';

      let photoHtml = '';
      if (photos.length > 0) {
        const visiblePhotos = photos.slice(0, 3);
        const extraCount = photos.length - 3;

        photoHtml = `<div class="timeline-photo-grid ${photoGridClass}">
          ${visiblePhotos.map((photo, i) => `
            <div class="timeline-photo-thumb" data-index="${i}" data-photos='${JSON.stringify(photos)}'>
              <img src="${photo}" alt="照片${i + 1}"/>
            </div>
          `).join('')}
          ${extraCount > 0 ? `<div class="timeline-photo-more">+${extraCount}</div>` : ''}
        </div>`;
      }

      return `
        <div class="timeline-item" style="animation-delay: ${index * 60}ms" data-id="${record.id}">
          <div class="timeline-dot type-${record.type}"></div>
          <div class="timeline-card">
            <div class="timeline-card-header">
              <span class="timeline-card-title">${escapeHtml(record.title)}</span>
              <span class="timeline-card-date">${formatRelativeDate(record.date)}</span>
            </div>
            ${record.description ? `<p class="timeline-card-body">${escapeHtml(record.description)}</p>` : ''}
            <div class="timeline-card-meta">
              ${record.weight ? `<span class="timeline-weight-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"></circle><path d="M12 8v8"></path><path d="M5 21a7 7 0 0 1 14 0"></path></svg>
                ${record.weight} kg
              </span>` : ''}
              <span class="timeline-type-badge">
                ${getTypeIcon(record.type)}
                ${getTypeLabel(record.type)}
              </span>
            </div>
            ${photoHtml}
            <div class="timeline-card-actions">
              <button class="timeline-action-btn edit-record" data-id="${record.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                编辑
              </button>
              <button class="timeline-action-btn delete" data-id="${record.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                删除
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind click events
    timeline.querySelectorAll('.edit-record').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        editRecord(btn.dataset.id);
      });
    });

    timeline.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmDeleteRecord(btn.dataset.id);
      });
    });

    timeline.querySelectorAll('.timeline-photo-thumb').forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        const photos = JSON.parse(thumb.dataset.photos);
        const index = parseInt(thumb.dataset.index, 10);
        openPhotoViewer(photos, index);
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // =========================================
  // Record CRUD
  // =========================================
  async function saveRecord() {
    const title = document.getElementById('record-title').value.trim();
    const date = document.getElementById('record-date').value;
    const description = document.getElementById('record-description').value.trim();
    const type = document.querySelector('.type-btn.active').dataset.type;
    const weight = document.getElementById('record-weight').value ?
      parseFloat(document.getElementById('record-weight').value) : null;

    if (!title) {
      showToast('请输入标题', 'error');
      return;
    }

    if (!date) {
      showToast('请选择日期', 'error');
      return;
    }

    if (new Date(date) > new Date()) {
      showToast('日期不能是未来', 'error');
      return;
    }

    // Convert photos to base64
    let photos = [];
    if (photoFiles.length > 0) {
      try {
        photos = await Promise.all(photoFiles.map(f => fileToBase64(f)));
      } catch (err) {
        showToast('照片上传失败', 'error');
        return;
      }
    }

    const record = {
      id: editingRecordId || generateId(),
      date,
      type,
      title,
      description: description || null,
      weight,
      photos: photos.length > 0 ? photos : null,
      createdAt: editingRecordId ?
        (recordsData.find(r => r.id === editingRecordId)?.createdAt || new Date().toISOString()) :
        new Date().toISOString()
    };

    try {
      await dbPut(STORE_RECORDS, record);
      await loadRecords();
      closeAllModals();
      showToast(editingRecordId ? '记录已更新' : '记录已保存', 'success');
    } catch (err) {
      showToast('保存失败', 'error');
      console.error(err);
    }
  }

  function editRecord(id) {
    const record = recordsData.find(r => r.id === id);
    if (!record) return;

    editingRecordId = id;
    document.getElementById('modal-title').textContent = '编辑记录';
    document.getElementById('record-date').value = record.date;
    document.getElementById('record-title').value = record.title;
    document.getElementById('record-description').value = record.description || '';
    document.getElementById('record-weight').value = record.weight || '';

    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === record.type);
    });
    document.getElementById('weight-group').classList.toggle('hidden', record.type !== 'weight');

    // Show existing photos
    photoFiles = [];
    const grid = document.getElementById('photo-preview-grid');
    grid.innerHTML = '';
    if (record.photos && record.photos.length > 0) {
      document.getElementById('photo-placeholder').classList.add('hidden');
      record.photos.forEach((photo, i) => {
        const item = document.createElement('div');
        item.className = 'photo-preview-item';
        item.innerHTML = `
          <img src="${photo}" alt="照片${i + 1}"/>
          <button type="button" class="photo-remove-btn" data-index="${i}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        `;
        grid.appendChild(item);
      });
    } else {
      document.getElementById('photo-placeholder').classList.remove('hidden');
    }

    openModal('record-modal');
  }

  function confirmDeleteRecord(id) {
    deletingRecordId = id;
    openModal('delete-modal');
  }

  async function deleteRecord() {
    if (!deletingRecordId) return;

    try {
      await dbDelete(STORE_RECORDS, deletingRecordId);
      await loadRecords();
      closeAllModals();
      showToast('记录已删除', 'success');
    } catch (err) {
      showToast('删除失败', 'error');
      console.error(err);
    }
  }

  // =========================================
  // Profile Save
  // =========================================
  async function saveProfile() {
    profileData = {
      ...profileData,
      id: 'profile',
      name: document.getElementById('profile-name').value.trim() || '柚子',
      breed: document.getElementById('profile-breed').value.trim() || '中华田园猫',
      birthday: document.getElementById('profile-birthday').value,
      arrival: document.getElementById('profile-arrival').value
    };

    try {
      await dbPut(STORE_PROFILE, profileData);
      renderProfile();
      closeAllModals();
      showToast('档案已更新', 'success');
    } catch (err) {
      showToast('保存失败', 'error');
      console.error(err);
    }
  }

  // =========================================
  // Avatar Upload
  // =========================================
  async function handleAvatarUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('请选择图片文件', 'error');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      profileData.avatar = base64;
      await dbPut(STORE_PROFILE, profileData);
      renderProfile();
      showToast('头像已更新', 'success');
    } catch (err) {
      showToast('上传失败', 'error');
      console.error(err);
    }
  }

  // =========================================
  // PWA
  // =========================================
  async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('[App] SW registered:', registration.scope);
      } catch (err) {
        console.log('[App] SW registration failed:', err);
      }
    }
  }

  function updateOfflineStatus() {
    const banner = document.getElementById('offline-banner');
    banner.classList.toggle('hidden', navigator.onLine);
  }

  // =========================================
  // Event Bindings
  // =========================================
  function bindEvents() {
    // FAB - open add modal
    document.getElementById('add-record-btn').addEventListener('click', () => {
      document.getElementById('modal-title').textContent = '添加记录';
      openModal('record-modal');
    });

    // Modal close buttons
    document.getElementById('modal-close').addEventListener('click', closeAllModals);
    document.getElementById('modal-cancel').addEventListener('click', closeAllModals);
    document.getElementById('profile-modal-close').addEventListener('click', closeAllModals);
    document.getElementById('profile-cancel').addEventListener('click', closeAllModals);
    document.getElementById('delete-cancel').addEventListener('click', closeAllModals);

    // Overlay click to close
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeAllModals();
    });

    // Modal save buttons
    document.getElementById('modal-save').addEventListener('click', saveRecord);
    document.getElementById('profile-save').addEventListener('click', saveProfile);
    document.getElementById('delete-confirm').addEventListener('click', deleteRecord);

    // Edit profile button
    document.getElementById('edit-profile-btn').addEventListener('click', () => {
      document.getElementById('profile-name').value = profileData?.name || '柚子';
      document.getElementById('profile-breed').value = profileData?.breed || '中华田园猫';
      document.getElementById('profile-birthday').value = profileData?.birthday || '';
      document.getElementById('profile-arrival').value = profileData?.arrival || '';
      openModal('profile-modal');
    });

    // Edit avatar button
    document.getElementById('edit-avatar-btn').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        if (e.target.files[0]) handleAvatarUpload(e.target.files[0]);
      };
      input.click();
    });

    // Type selector
    document.getElementById('type-selector').addEventListener('click', (e) => {
      const btn = e.target.closest('.type-btn');
      if (!btn) return;

      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const weightGroup = document.getElementById('weight-group');
      weightGroup.classList.toggle('hidden', btn.dataset.type !== 'weight');
    });

    // Photo upload area
    const photoUploadArea = document.getElementById('photo-upload-area');
    const photoInput = document.getElementById('photo-input');

    photoUploadArea.addEventListener('click', () => photoInput.click());
    photoUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      photoUploadArea.style.borderColor = 'var(--color-primary)';
    });
    photoUploadArea.addEventListener('dragleave', () => {
      photoUploadArea.style.borderColor = '';
    });
    photoUploadArea.addEventListener('drop', async (e) => {
      e.preventDefault();
      photoUploadArea.style.borderColor = '';
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      await handlePhotoFiles(files);
    });

    photoInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      await handlePhotoFiles(files);
      e.target.value = '';
    });

    // Photo preview remove
    document.getElementById('photo-preview-grid').addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.photo-remove-btn');
      if (!removeBtn) return;

      const index = parseInt(removeBtn.dataset.index, 10);
      photoFiles.splice(index, 1);
      renderPhotoPreviews();

      if (photoFiles.length === 0 && (!editingRecordId || !(recordsData.find(r => r.id === editingRecordId)?.photos?.length))) {
        document.getElementById('photo-placeholder').classList.remove('hidden');
      }
    });

    // Photo viewer
    document.getElementById('viewer-close').addEventListener('click', closePhotoViewer);
    document.getElementById('viewer-prev').addEventListener('click', () => viewerNav(-1));
    document.getElementById('viewer-next').addEventListener('click', () => viewerNav(1));

    document.getElementById('photo-viewer').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closePhotoViewer();
    });

    document.addEventListener('keydown', (e) => {
      if (!document.getElementById('photo-viewer').classList.contains('hidden')) {
        if (e.key === 'Escape') closePhotoViewer();
        if (e.key === 'ArrowLeft') viewerNav(-1);
        if (e.key === 'ArrowRight') viewerNav(1);
      }
    });

    // Offline status
    window.addEventListener('online', updateOfflineStatus);
    window.addEventListener('offline', updateOfflineStatus);
  }

  async function handlePhotoFiles(files) {
    photoFiles.push(...files);
    renderPhotoPreviews();
  }

  function renderPhotoPreviews() {
    const grid = document.getElementById('photo-preview-grid');
    const placeholder = document.getElementById('photo-placeholder');

    placeholder.classList.toggle('hidden', photoFiles.length > 0);
    grid.innerHTML = '';

    photoFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'photo-preview-item';
      item.innerHTML = `
        <img src="${URL.createObjectURL(file)}" alt="照片${index + 1}"/>
        <button type="button" class="photo-remove-btn" data-index="${index}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;
      grid.appendChild(item);
    });
  }

  // =========================================
  // Initialize
  // =========================================
  async function init() {
    try {
      await openDB();
      await loadProfile();
      await loadRecords();
      bindEvents();
      updateOfflineStatus();

      // Set default date for record form
      document.getElementById('record-date').value = new Date().toISOString().split('T')[0];

      console.log('[App] Initialized');
    } catch (err) {
      console.error('[App] Init failed:', err);
      showToast('应用加载失败', 'error');
    }
  }

  // Start app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      await registerServiceWorker();
      await init();
    });
  } else {
    (async () => {
      await registerServiceWorker();
      await init();
    })();
  }

})();
