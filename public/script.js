// Import Firebase (this would be handled differently in a real project)
// In a real project, you would use modules or a bundler
// For this example, we'll assume Firebase is loaded via CDN in HTML

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
        // RFID input simulation (in a real app, this would come from an RFID reader)
        rfidInput.addEventListener('change', function() {
            // Simulate finding a member when RFID is scanned
            findMemberByRfid(this.value);
        });
        
        // Form inputs - update preview card
        nameInput.addEventListener('input', updatePreview);
        phoneInput.addEventListener('input', updatePreview);
        pointsInput.addEventListener('input', updatePreview);
        rfidInput.addEventListener('input', updatePreview);
        
        // Button clicks
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
            const members = await response.json();
            
            if (members) {
                renderMembersList(members);
            } else {
                membersList.innerHTML = '<p class="no-members">Tidak ada member terdaftar</p>';
            }
        } catch (error) {
            console.error('Error loading members:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Gagal memuat data member',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
    
    function renderMembersList(members) {
        membersList.innerHTML = '';
        
        if (Object.keys(members).length === 0) {
            membersList.innerHTML = '<p class="no-members">Tidak ada member terdaftar</p>';
            return;
        }
        
        Object.entries(members).forEach(([rfid, member]) => {
            const memberItem = document.createElement('div');
            memberItem.className = 'member-item';
            memberItem.dataset.rfid = rfid;
            
            memberItem.innerHTML = `
                <div class="member-info">
                    <h3>${member.name || 'N/A'}</h3>
                    <p>RFID: ${rfid} | Telp: ${member.phone || 'N/A'} | Poin: ${member.points || 0}</p>
                </div>
                <div class="member-actions">
                    <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="Hapus"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            membersList.appendChild(memberItem);
            
            // Add event listeners to the new buttons
            memberItem.querySelector('.edit-btn').addEventListener('click', () => editMember(rfid, member));
            memberItem.querySelector('.delete-btn').addEventListener('click', () => confirmDeleteMember(rfid, member.name));
        });
    }
    
    async function findMemberByRfid(rfid) {
        try {
            const response = await fetch(`/api/getMember?rfid=${encodeURIComponent(rfid)}`);
            const member = await response.json();
            
            if (member) {
                // Member found, populate form
                selectedMember = { rfid, ...member };
                nameInput.value = member.name || '';
                phoneInput.value = member.phone || '';
                emailInput.value = member.email || '';
                pointsInput.value = member.points || 0;
                
                // Enable update and delete buttons
                updateBtn.disabled = false;
                deleteBtn.disabled = false;
                addBtn.disabled = true;
                
                // Update preview
                updatePreview();
                
                // Show success message
                Swal.fire({
                    title: 'Member Ditemukan!',
                    text: `Member ${member.name} ditemukan`,
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                // No member found, prepare for new member
                selectedMember = null;
                nameInput.value = '';
                phoneInput.value = '';
                emailInput.value = '';
                pointsInput.value = 0;
                
                // Disable update and delete buttons
                updateBtn.disabled = true;
                deleteBtn.disabled = true;
                addBtn.disabled = false;
                
                // Focus on name input for quick entry
                nameInput.focus();
                
                // Update preview with just RFID
                updatePreview();
                
                // Show info message
                Swal.fire({
                    title: 'Member Baru',
                    text: 'RFID tidak terdaftar, silahkan isi data member baru',
                    icon: 'info',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error finding member:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Gagal mencari member',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
    
    async function addMember() {
        const rfid = rfidInput.value.trim();
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();
        const points = parseInt(pointsInput.value) || 0;
        
        if (!rfid) {
            Swal.fire({
                title: 'Error!',
                text: 'RFID tidak boleh kosong',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            rfidInput.focus();
            return;
        }
        
        if (!name) {
            Swal.fire({
                title: 'Error!',
                text: 'Nama tidak boleh kosong',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            nameInput.focus();
            return;
        }
        
        try {
            const response = await fetch('/api/addMember', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rfid,
                    name,
                    phone,
                    email,
                    points
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                Swal.fire({
                    title: 'Sukses!',
                    text: 'Member berhasil ditambahkan',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                
                // Reload members list
                loadMembers();
                
                // Clear form
                clearForm();
            } else {
                throw new Error(result.error || 'Gagal menambahkan member');
            }
        } catch (error) {
            console.error('Error adding member:', error);
            Swal.fire({
                title: 'Error!',
                text: error.message,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
    
    function editMember(rfid, member) {
        selectedMember = { rfid, ...member };
        rfidInput.value = rfid;
        nameInput.value = member.name || '';
        phoneInput.value = member.phone || '';
        emailInput.value = member.email || '';
        pointsInput.value = member.points || 0;
        
        // Enable update and delete buttons
        updateBtn.disabled = false;
        deleteBtn.disabled = false;
        addBtn.disabled = true;
        
        // Update preview
        updatePreview();
        
        // Scroll to form
        rfidInput.scrollIntoView({ behavior: 'smooth' });
    }
    
    async function updateMember() {
        if (!selectedMember) return;
        
        const rfid = rfidInput.value.trim();
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();
        const points = parseInt(pointsInput.value) || 0;
        
        if (!name) {
            Swal.fire({
                title: 'Error!',
                text: 'Nama tidak boleh kosong',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            nameInput.focus();
            return;
        }
        
        try {
            const response = await fetch('/api/updateMember', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rfid,
                    name,
                    phone,
                    email,
                    points
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                Swal.fire({
                    title: 'Sukses!',
                    text: 'Member berhasil diperbarui',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                
                // Reload members list
                loadMembers();
                
                // Clear form
                clearForm();
            } else {
                throw new Error(result.error || 'Gagal memperbarui member');
            }
        } catch (error) {
            console.error('Error updating member:', error);
            Swal.fire({
                title: 'Error!',
                text: error.message,
                icon: 'error',
                confirmButtonText: 'OK'
            });
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
            
            const result = await response.json();
            
            if (result.success) {
                Swal.fire({
                    title: 'Dihapus!',
                    text: 'Member berhasil dihapus',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                
                // Reload members list
                loadMembers();
                
                // Clear form
                clearForm();
            } else {
                throw new Error(result.error || 'Gagal menghapus member');
            }
        } catch (error) {
            console.error('Error deleting member:', error);
            Swal.fire({
                title: 'Error!',
                text: error.message,
                icon: 'error',
                confirmButtonText: 'OK'
            });
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
        
        updatePreview();
        
        // Focus on RFID input for next scan
        rfidInput.focus();
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
            Swal.fire({
                title: 'Error!',
                text: 'Gagal mencari member',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }
    
    // Animation for barcode lines
    const barcodeLines = document.querySelectorAll('.barcode-line');
    barcodeLines.forEach((line, index) => {
        // Random delay for each line
        line.style.animationDelay = `${index * 0.1}s`;
    });
});