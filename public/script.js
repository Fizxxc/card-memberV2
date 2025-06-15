document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const rfidInput = document.getElementById('rfid');
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const pointsInput = document.getElementById('points');
    const addBtn = document.getElementById('addBtn');
    const updateBtn = document.getElementById('updateBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const clearBtn = document.getElementById('clearBtn');
    const searchInput = document.getElementById('search');
    const searchBtn = document.getElementById('searchBtn');
    const membersList = document.getElementById('membersList');
    
    // Preview Elements
    const previewRfid = document.getElementById('previewRfid');
    const previewName = document.getElementById('previewName');
    const previewPhone = document.getElementById('previewPhone');
    const previewPoints = document.getElementById('previewPoints');
    
    // Current selected member
    let selectedMember = null;
    
    // Initialize
    loadMembers();
    setupEventListeners();
    
    function setupEventListeners() {
        rfidInput.addEventListener('change', function() {
            findMemberByRfid(this.value);
        });
        
        nameInput.addEventListener('input', updatePreview);
        phoneInput.addEventListener('input', updatePreview);
        pointsInput.addEventListener('input', updatePreview);
        rfidInput.addEventListener('input', updatePreview);
        
        addBtn.addEventListener('click', addMember);
        updateBtn.addEventListener('click', updateMember);
        deleteBtn.addEventListener('click', deleteMember);
        clearBtn.addEventListener('click', clearForm);
        searchBtn.addEventListener('click', searchMembers);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchMembers();
        });
    }
    
    function updatePreview() {
        previewRfid.textContent = rfidInput.value || '-';
        previewName.textContent = nameInput.value || '-';
        previewPhone.textContent = phoneInput.value || '-';
        previewPoints.textContent = pointsInput.value || '0';
    }
    
    async function loadMembers() {
        try {
            const response = await fetch('/api/getMembers');
            
            // Check if response is OK (status 200-299)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Check content type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Expected JSON but got: ${contentType}`);
            }
            
            const members = await response.json();
            
            if (members && Object.keys(members).length > 0) {
                renderMembersList(members);
            } else {
                membersList.innerHTML = '<p class="no-members">Tidak ada member terdaftar</p>';
            }
        } catch (error) {
            console.error('Error loading members:', error);
            showError('Gagal memuat data member', error.message);
        }
    }
    
    function renderMembersList(members) {
        membersList.innerHTML = '';
        
        if (!members || Object.keys(members).length === 0) {
            membersList.innerHTML = '<p class="no-members">Tidak ada member terdaftar</p>';
            return;
        }
        
        Object.entries(members).forEach(([rfid, member]) => {
            const memberItem = document.createElement('div');
            memberItem.className = 'member-item';
            memberItem.dataset.rfid = rfid;
            
            memberItem.innerHTML = `
                <div class="member-info">
                    <h3>${escapeHtml(member.name || 'N/A')}</h3>
                    <p>RFID: ${escapeHtml(rfid)} | Telp: ${escapeHtml(member.phone || 'N/A')} | Poin: ${member.points || 0}</p>
                </div>
                <div class="member-actions">
                    <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="Hapus"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            membersList.appendChild(memberItem);
            
            memberItem.querySelector('.edit-btn').addEventListener('click', () => editMember(rfid, member));
            memberItem.querySelector('.delete-btn').addEventListener('click', () => confirmDeleteMember(rfid, member.name));
        });
    }
    
    async function findMemberByRfid(rfid) {
        if (!rfid) return;
        
        try {
            const response = await fetch(`/api/getMember?rfid=${encodeURIComponent(rfid)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Expected JSON but got: ${contentType}`);
            }
            
            const member = await response.json();
            
            if (member) {
                selectedMember = { rfid, ...member };
                populateForm(member);
                
                updateBtn.disabled = false;
                deleteBtn.disabled = false;
                addBtn.disabled = true;
                
                updatePreview();
                
                showSuccess(`Member ${member.name} ditemukan`);
            } else {
                prepareForNewMember();
                showInfo('RFID tidak terdaftar, silahkan isi data member baru');
            }
        } catch (error) {
            console.error('Error finding member:', error);
            showError('Gagal mencari member', error.message);
        }
    }
    
    function populateForm(member) {
        nameInput.value = member.name || '';
        phoneInput.value = member.phone || '';
        emailInput.value = member.email || '';
        pointsInput.value = member.points || 0;
    }
    
    function prepareForNewMember() {
        selectedMember = null;
        nameInput.value = '';
        phoneInput.value = '';
        emailInput.value = '';
        pointsInput.value = 0;
        
        updateBtn.disabled = true;
        deleteBtn.disabled = true;
        addBtn.disabled = false;
        
        nameInput.focus();
    }
    
    async function addMember() {
        const memberData = validateMemberInput();
        if (!memberData) return;
        
        try {
            const response = await fetch('/api/addMember', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(memberData)
            });
            
            await handleApiResponse(response, 'Member berhasil ditambahkan');
            loadMembers();
            clearForm();
        } catch (error) {
            console.error('Error adding member:', error);
            showError('Gagal menambahkan member', error.message);
        }
    }
    
    function validateMemberInput() {
        const rfid = rfidInput.value.trim();
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();
        const points = parseInt(pointsInput.value) || 0;
        
        if (!rfid) {
            showError('RFID tidak boleh kosong');
            rfidInput.focus();
            return null;
        }
        
        if (!name) {
            showError('Nama tidak boleh kosong');
            nameInput.focus();
            return null;
        }
        
        return { rfid, name, phone, email, points };
    }
    
    async function updateMember() {
        if (!selectedMember) return;
        
        const memberData = validateMemberInput();
        if (!memberData) return;
        
        try {
            const response = await fetch('/api/updateMember', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(memberData)
            });
            
            await handleApiResponse(response, 'Member berhasil diperbarui');
            loadMembers();
            clearForm();
        } catch (error) {
            console.error('Error updating member:', error);
            showError('Gagal memperbarui member', error.message);
        }
    }
    
    function confirmDeleteMember(rfid, name) {
        Swal.fire({
            title: 'Hapus Member?',
            text: `Anda yakin ingin menghapus member ${name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteMember(rfid);
            }
        });
    }
    
    async function deleteMember(rfid = null) {
        const memberRfid = rfid || selectedMember?.rfid;
        if (!memberRfid) return;
        
        try {
            const response = await fetch('/api/deleteMember', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ rfid: memberRfid })
            });
            
            await handleApiResponse(response, 'Member berhasil dihapus');
            loadMembers();
            clearForm();
        } catch (error) {
            console.error('Error deleting member:', error);
            showError('Gagal menghapus member', error.message);
        }
    }
    
    async function handleApiResponse(response, successMessage) {
        if (!response.ok) {
            const error = await response.json().catch(() => ({ 
                error: `HTTP error! status: ${response.status}`
            }));
            throw new Error(error.error || 'Request failed');
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Expected JSON but got: ${contentType}`);
        }
        
        const result = await response.json();
        
        if (result && result.success) {
            showSuccess(successMessage);
            return result;
        } else {
            throw new Error(result.error || 'Operation failed');
        }
    }
    
    function clearForm() {
        rfidInput.value = '';
        nameInput.value = '';
        phoneInput.value = '';
        emailInput.value = '';
        pointsInput.value = '0';
        
        selectedMember = null;
        
        updateBtn.disabled = true;
        deleteBtn.disabled = true;
        addBtn.disabled = false;
        
        rfidInput.focus();
        updatePreview();
    }
    
    async function searchMembers() {
        const query = searchInput.value.trim().toLowerCase();
        
        if (!query) {
            loadMembers();
            return;
        }
        
        try {
            const response = await fetch('/api/getMembers');
            const members = await response.json();
            
            if (members) {
                const filteredMembers = Object.entries(members).reduce((acc, [rfid, member]) => {
                    if (
                        member.name?.toLowerCase().includes(query) ||
                        member.phone?.includes(query) ||
                        member.email?.toLowerCase().includes(query) ||
                        rfid.includes(query)
                    ) {
                        acc[rfid] = member;
                    }
                    return acc;
                }, {});
                
                renderMembersList(filteredMembers);
            }
        } catch (error) {
            console.error('Error searching members:', error);
            showError('Gagal mencari member', error.message);
        }
    }
    
    // Helper functions
    function showError(title, message = '') {
        Swal.fire({
            title: title,
            text: message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
    
    function showSuccess(message) {
        Swal.fire({
            title: 'Sukses!',
            text: message,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
    }
    
    function showInfo(message) {
        Swal.fire({
            title: 'Info',
            text: message,
            icon: 'info',
            timer: 2000,
            showConfirmButton: false
        });
    }
    
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Animation for barcode lines
    const barcodeLines = document.querySelectorAll('.barcode-line');
    barcodeLines.forEach((line, index) => {
        line.style.animationDelay = `${index * 0.1}s`;
    });
});
