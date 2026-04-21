/**
 * 柚子成长记录 - 纯本地版
 */

(function() {
  'use strict';

  // =========================================
  // IndexedDB
  // =========================================
  const DB_NAME = 'yozi_cat_v3';
  const DB_VERSION = 1;

  let db = null;
  let profileData = null;
  let recordsData = [];

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };
      request.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains('profile')) {
          database.createObjectStore('profile', { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains('records')) {
          database.createObjectStore('records', { keyPath: 'id' });
        }
      };
    });
  }

  function dbGetAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function dbPut(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function dbDelete(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // =========================================
  // 工具函数
  // =========================================
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
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

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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
  // UI
  // =========================================
  function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 200);
    }, 2500);
  }

  function openModal(id) {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById(id).classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeAllModals() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    document.body.style.overflow = '';

    document.getElementById('record-form').reset();
    document.getElementById('record-date').value = new Date().toISOString().split('T')[0];
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.type-btn[data-type="daily"]').classList.add('active');
    document.getElementById('weight-group').classList.add('hidden');
    document.getElementById('photo-preview-grid').innerHTML = '';
    document.getElementById('photo-placeholder').classList.remove('hidden');
  }

  // =========================================
  // 数据
  // =========================================
  function getDefaultProfile() {
    return { id: 'profile', name: '柚子', breed: '中华田园猫', birthday: '', arrival: '', avatar: null };
  }

  async function loadProfile() {
    const profiles = await dbGetAll('profile');
    profileData = profiles.find(p => p.id === 'profile') || getDefaultProfile();
  }

  async function loadRecords() {
    recordsData = await dbGetAll('records');
    recordsData.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async function saveProfileToDB() {
    const data = {
      id: 'profile',
      name: document.getElementById('profile-name').value.trim() || '柚子',
      breed: document.getElementById('profile-breed').value.trim() || '中华田园猫',
      birthday: document.getElementById('profile-birthday').value,
      arrival: document.getElementById('profile-arrival').value,
      avatar: profileData?.avatar || null
    };
    await dbPut('profile', data);
    profileData = data;
    renderProfile();
    closeAllModals();
    showToast('档案已更新', 'success');
  }

  // =========================================
  // 渲染
  // =========================================
  function renderProfile() {
    if (!profileData) return;

    document.getElementById('profile-name-display').textContent = profileData.name || '柚子';
    document.getElementById('profile-breed-display').textContent = profileData.breed || '中华田园猫';
    document.getElementById('cat-birthday-display').textContent = profileData.birthday ? formatDate(profileData.birthday) : '未设置';
    document.getElementById('cat-arrival-display').textContent = profileData.arrival ? formatDate(profileData.arrival) : '未设置';

    const avatarEl = document.getElementById('profile-avatar');
    if (profileData.avatar) {
      avatarEl.innerHTML = `<img src="${profileData.avatar}" alt="${profileData.name}"/>`;
    } else {
      avatarEl.innerHTML = `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z"></path><path d="M8 14v.5"></path><path d="M16 14v.5"></path><path d="M11.25 16.25h1.5L12 17l-.75-.75Z"></path></svg>`;
    }

    updateStats();
  }

  function updateStats() {
    const months = profileData?.birthday ? calculateMonths(profileData.birthday) : null;
    document.getElementById('stat-months').textContent = months !== null ? `${months}个月` : '--';

    const weightRecords = recordsData.filter(r => r.weight != null).sort((a, b) => new Date(b.date) - new Date(a.date));
    document.getElementById('stat-weight').textContent = weightRecords.length > 0 ? `${weightRecords[0].weight} kg` : '--';
    document.getElementById('stat-records').textContent = recordsData.length;

    if (recordsData.length > 0) {
      const sorted = [...recordsData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      document.getElementById('stat-last-update').textContent = formatRelativeDate(sorted[0].date);
    } else {
      document.getElementById('stat-last-update').textContent = '--';
    }
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
    timeline.innerHTML = recordsData.map((record, i) => {
      const photos = record.photos || [];
      const photoClass = photos.length === 1 ? 'cols-1' : photos.length === 2 ? 'cols-2' : 'cols-3';

      let photoHtml = '';
      if (photos.length > 0) {
        const visible = photos.slice(0, 3);
        const extra = photos.length - 3;
        photoHtml = `<div class="timeline-photo-grid ${photoClass}">${visible.map((p, idx) => `<div class="timeline-photo-thumb" data-idx="${idx}" data-photos='${JSON.stringify(photos)}'><img src="${p}" alt="照片${idx+1}"/></div>`).join('')}${extra > 0 ? `<div class="timeline-photo-more">+${extra}</div>` : ''}</div>`;
      }

      return `<div class="timeline-item" style="animation-delay:${i*60}ms"><div class="timeline-dot type-${record.type}"></div><div class="timeline-card"><div class="timeline-card-header"><span class="timeline-card-title">${escapeHtml(record.title)}</span><span class="timeline-card-date">${formatRelativeDate(record.date)}</span></div>${record.description ? `<p class="timeline-card-body">${escapeHtml(record.description)}</p>` : ''}<div class="timeline-card-meta">${record.weight ? `<span class="timeline-weight-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"></circle><path d="M12 8v8"></path><path d="M5 21a7 7 0 0 1 14 0"></path></svg>${record.weight} kg</span>` : ''}<span class="timeline-type-badge">${getTypeIcon(record.type)}${getTypeLabel(record.type)}</span></div>${photoHtml}<div class="timeline-card-actions"><button class="timeline-action-btn edit-record" data-id="${record.id}"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>编辑</button><button class="timeline-action-btn delete-record" data-id="${record.id}"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>删除</button></div></div></div>`;
    }).join('');

    timeline.querySelectorAll('.edit-record').forEach(b => {
      b.addEventListener('click', e => { e.stopPropagation(); openEditRecord(b.dataset.id); });
    });
    timeline.querySelectorAll('.delete-record').forEach(b => {
      b.addEventListener('click', e => { e.stopPropagation(); confirmDelete(b.dataset.id); });
    });
    timeline.querySelectorAll('.timeline-photo-thumb').forEach(t => {
      t.addEventListener('click', e => { e.stopPropagation(); openViewer(JSON.parse(t.dataset.photos), parseInt(t.dataset.idx)); });
    });
  }

  // =========================================
  // 记录操作
  // =========================================
  let editingRecordId = null;
  let deletingRecordId = null;
  let photoFiles = [];

  async function saveRecord() {
    const title = document.getElementById('record-title').value.trim();
    const date = document.getElementById('record-date').value;
    const desc = document.getElementById('record-description').value.trim();
    const type = document.querySelector('.type-btn.active').dataset.type;
    const weight = document.getElementById('record-weight').value ? parseFloat(document.getElementById('record-weight').value) : null;

    if (!title) { showToast('请输入标题', 'error'); return; }
    if (!date) { showToast('请选择日期', 'error'); return; }
    if (new Date(date) > new Date()) { showToast('日期不能是未来', 'error'); return; }

    let photos = [];
    if (photoFiles.length > 0) {
      try {
        photos = await Promise.all(photoFiles.map(f => fileToBase64(f)));
      } catch (err) { showToast('照片上传失败', 'error'); return; }
    }

    const isEdit = !!editingRecordId;
    const record = {
      id: isEdit ? editingRecordId : generateId(),
      date, type, title,
      description: desc || null,
      weight,
      photos: photos.length > 0 ? photos : null,
      createdAt: isEdit ? (recordsData.find(r => r.id === editingRecordId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    await dbPut('records', record);
    await loadRecords();
    renderTimeline();
    updateStats();
    closeAllModals();
    showToast(isEdit ? '记录已更新' : '记录已保存', 'success');
  }

  async function deleteRecord() {
    if (!deletingRecordId) return;
    await dbDelete('records', deletingRecordId);
    await loadRecords();
    renderTimeline();
    updateStats();
    closeAllModals();
    showToast('记录已删除', 'success');
    deletingRecordId = null;
  }

  function openEditRecord(id) {
    const r = recordsData.find(x => x.id === id);
    if (!r) return;
    editingRecordId = id;

    document.getElementById('modal-title').textContent = '编辑记录';
    document.getElementById('record-date').value = r.date;
    document.getElementById('record-title').value = r.title;
    document.getElementById('record-description').value = r.description || '';
    document.getElementById('record-weight').value = r.weight || '';

    document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === r.type));
    document.getElementById('weight-group').classList.toggle('hidden', r.type !== 'weight');

    photoFiles = [];
    const grid = document.getElementById('photo-preview-grid');
    grid.innerHTML = '';
    if (r.photos && r.photos.length > 0) {
      document.getElementById('photo-placeholder').classList.add('hidden');
      r.photos.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = 'photo-preview-item';
        div.innerHTML = `<img src="${p}" alt="照片${i+1}"/><button type="button" class="photo-remove-btn" data-idx="${i}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>`;
        grid.appendChild(div);
      });
    } else {
      document.getElementById('photo-placeholder').classList.remove('hidden');
    }
    openModal('record-modal');
  }

  function confirmDelete(id) {
    deletingRecordId = id;
    openModal('delete-modal');
  }

  // =========================================
  // 照片查看器
  // =========================================
  let viewerPhotos = [], viewerIdx = 0;

  function openViewer(photos, idx) {
    viewerPhotos = photos;
    viewerIdx = idx;
    document.getElementById('photo-viewer').classList.remove('hidden');
    updateViewer();
    document.body.style.overflow = 'hidden';
  }

  function closeViewer() {
    document.getElementById('photo-viewer').classList.add('hidden');
    document.body.style.overflow = '';
    viewerPhotos = [];
  }

  function updateViewer() {
    document.getElementById('viewer-image').src = viewerPhotos[viewerIdx];
    document.getElementById('viewer-counter').textContent = `${viewerIdx + 1} / ${viewerPhotos.length}`;
    document.getElementById('viewer-prev').style.visibility = viewerPhotos.length > 1 ? 'visible' : 'hidden';
    document.getElementById('viewer-next').style.visibility = viewerPhotos.length > 1 ? 'visible' : 'hidden';
  }

  function viewerNav(dir) {
    viewerIdx = (viewerIdx + dir + viewerPhotos.length) % viewerPhotos.length;
    updateViewer();
  }

  // =========================================
  // 事件绑定
  // =========================================
  function bindEvents() {
    // FAB
    document.getElementById('add-record-btn').addEventListener('click', () => {
      editingRecordId = null;
      document.getElementById('modal-title').textContent = '添加记录';
      photoFiles = [];
      openModal('record-modal');
    });

    // Close buttons
    ['modal-close', 'modal-cancel', 'profile-modal-close', 'profile-cancel', 'delete-cancel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', closeAllModals);
    });

    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target === e.currentTarget) closeAllModals();
    });

    // Save buttons
    document.getElementById('modal-save').addEventListener('click', saveRecord);
    document.getElementById('profile-save').addEventListener('click', saveProfileToDB);
    document.getElementById('delete-confirm').addEventListener('click', deleteRecord);

    // Edit profile
    document.getElementById('edit-profile-btn').addEventListener('click', () => {
      document.getElementById('profile-name').value = profileData?.name || '柚子';
      document.getElementById('profile-breed').value = profileData?.breed || '中华田园猫';
      document.getElementById('profile-birthday').value = profileData?.birthday || '';
      document.getElementById('profile-arrival').value = profileData?.arrival || '';
      openModal('profile-modal');
    });

    // Avatar upload
    document.getElementById('edit-avatar-btn').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async e => {
        if (!e.target.files[0]) return;
        try {
          const base64 = await fileToBase64(e.target.files[0]);
          profileData.avatar = base64;
          await dbPut('profile', profileData);
          renderProfile();
          showToast('头像已更新', 'success');
        } catch (err) { showToast('上传失败', 'error'); }
      };
      input.click();
    });

    // Type selector
    document.getElementById('type-selector').addEventListener('click', e => {
      const btn = e.target.closest('.type-btn');
      if (!btn) return;
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('weight-group').classList.toggle('hidden', btn.dataset.type !== 'weight');
    });

    // Photo upload
    const uploadArea = document.getElementById('photo-upload-area');
    const photoInput = document.getElementById('photo-input');

    uploadArea.addEventListener('click', () => photoInput.click());
    uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.style.borderColor = 'var(--color-primary)'; });
    uploadArea.addEventListener('dragleave', () => uploadArea.style.borderColor = '');
    uploadArea.addEventListener('drop', async e => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      photoFiles.push(...files);
      renderPhotoPreviews();
    });
    photoInput.addEventListener('change', e => {
      const files = Array.from(e.target.files);
      photoFiles.push(...files);
      renderPhotoPreviews();
      e.target.value = '';
    });

    // Photo remove
    document.getElementById('photo-preview-grid').addEventListener('click', e => {
      const btn = e.target.closest('.photo-remove-btn');
      if (!btn) return;
      photoFiles.splice(parseInt(btn.dataset.idx), 1);
      renderPhotoPreviews();
    });

    // Viewer
    document.getElementById('viewer-close').addEventListener('click', closeViewer);
    document.getElementById('viewer-prev').addEventListener('click', () => viewerNav(-1));
    document.getElementById('viewer-next').addEventListener('click', () => viewerNav(1));
    document.getElementById('photo-viewer').addEventListener('click', e => { if (e.target === e.currentTarget) closeViewer(); });
    document.addEventListener('keydown', e => {
      if (document.getElementById('photo-viewer').classList.contains('hidden')) return;
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowLeft') viewerNav(-1);
      if (e.key === 'ArrowRight') viewerNav(1);
    });

    // Offline status
    window.addEventListener('online', () => document.getElementById('offline-banner').classList.add('hidden'));
    window.addEventListener('offline', () => document.getElementById('offline-banner').classList.remove('hidden'));
  }

  function renderPhotoPreviews() {
    const grid = document.getElementById('photo-preview-grid');
    const placeholder = document.getElementById('photo-placeholder');
    placeholder.classList.toggle('hidden', photoFiles.length > 0);
    grid.innerHTML = '';
    photoFiles.forEach((f, i) => {
      const div = document.createElement('div');
      div.className = 'photo-preview-item';
      div.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="照片${i+1}"/><button type="button" class="photo-remove-btn" data-idx="${i}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>`;
      grid.appendChild(div);
    });
  }

  // =========================================
  // 初始化
  // =========================================
  async function init() {
    try {
      await openDB();
      await loadProfile();
      await loadRecords();
      renderProfile();
      renderTimeline();
      bindEvents();

      document.getElementById('record-date').value = new Date().toISOString().split('T')[0];
      console.log('[App] 初始化完成');
    } catch (err) {
      console.error('[App] 初始化失败:', err);
      showToast('应用加载失败，请刷新页面', 'error');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
