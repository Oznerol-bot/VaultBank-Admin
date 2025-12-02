const API_BASE_URL = 'https://vaultbank-7i3m.onrender.com';
const ADMIN_TOKEN_KEY = 'vaultBankAdminToken';

function showToast(areaId, message, type = 'alert-info') {
    const area = document.getElementById(areaId);
    if (area) {
        area.textContent = message;
        area.className = `alert ${type}`;
        area.style.display = 'block';
        setTimeout(() => area.style.display = 'none', 5000);
    }
}

async function makeApiCall(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });

    const data = await res.json();

    if (!res.ok) {
        if (res.status === 401) {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            window.location.href = 'adminLogin.html'; 
        }
        throw new Error(data.message || 'Request failed');
    }
    return data;
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        return showToast('loginMessageArea', 'Please fill all fields', 'alert-danger');
    }

    showToast('loginMessageArea', 'Signing in...', 'alert-info');

    try {
        const response = await makeApiCall('/api/v1/admin/login', 'POST', { username, password });
        localStorage.setItem(ADMIN_TOKEN_KEY, response.token);
        window.location.href ='adminDashboard.html';
    } catch (err) {
        showToast('loginMessageArea', err.message || 'Login failed', 'alert-danger');
    }
}

async function handleAdminRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const messageArea = 'registerMessageArea';

    if (!username || !email || !password || !confirmPassword) {
        return showToast(messageArea, 'Please fill all required fields.', 'alert-danger');
    }

    if (password !== confirmPassword) {
        return showToast(messageArea, 'Passwords do not match.', 'alert-danger');
    }
    
    showToast(messageArea, 'Processing registration...', 'alert-info');

    try {
        const body = { username, email, password };
        
        // This targets the endpoint you provided: /api/v1/admin/register
        await makeApiCall('/api/v1/admin/register', 'POST', body); 
        
        // Success: Redirect to login with success message
        sessionStorage.setItem('registerSuccess', 'Admin account registered! You can now sign in.');
        window.location.href = 'adminLogin.html';
        
    } catch (err) {
        showToast(messageArea, err.message || 'Registration failed. Check your network or credentials.', 'alert-danger');
    }
}

async function handleUserSignup(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const contactNumber = document.getElementById('contactNumber').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const messageArea = 'signupMessageArea';

    if (!firstName || !lastName || !email || !username || !contactNumber || !password || !confirmPassword) {
        return showToast(messageArea, 'Please fill all required fields.', 'alert-danger');
    }

    if (password !== confirmPassword) {
        return showToast(messageArea, 'Passwords do not match.', 'alert-danger');
    }
    
    showToast(messageArea, 'Processing registration...', 'alert-info');

    try {
        const body = { firstName, lastName, email, username, contactNumber, password };
        
        await makeApiCall('/api/v1/users/register', 'POST', body); 
        
        sessionStorage.setItem('signupSuccess', 'Your account was registered successfully! Please wait for admin approval to log in.');
        window.location.href = 'adminLogin.html';
        
    } catch (err) {
        showToast(messageArea, err.message || 'Registration failed. Please try again.', 'alert-danger');
    }
}


async function fetchPendingUsers() {
    const pendingUsersList = document.getElementById('pendingUsersList');
    const msg = document.getElementById('messageArea');
    
    if (!pendingUsersList || !msg) return; 

    msg.style.display = 'none';
    try {
        const response = await makeApiCall('/api/v1/users?status=pending');
        const pendingUsers = response.filter(user => user.status === 'pending');

        if (pendingUsers.length === 0) {
          pendingUsersList.innerHTML = '<tr><td colspan="6" style="text-align:center;">No users awaiting approval.</td></tr>';
          return;
        }

        pendingUsersList.innerHTML = pendingUsers.map(user => `
          <tr>
            <td><strong>${user.firstName} ${user.lastName}</strong></td>
            <td>${user.email}</td>
            <td>${user.username}</td>
            <td>${user.contactNumber}</td>
            <td>${new Date(user.createdAt).toLocaleDateString('en-PH')}</td>
            <td>
              <button class="btn-approve" onclick="approveUser('${user._id}')">
                <i class="fas fa-check"></i> Approve
              </button>
              <button class="btn-reject" onclick="rejectUser('${user._id}')">
                <i class="fas fa-times"></i> Reject
              </button>
            </td>
          </tr>
        `).join('');
    } catch (err) {
        msg.textContent = err.message || 'Failed to load users';
        msg.className = 'alert alert-danger';
        msg.style.display = 'block';
        pendingUsersList.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Error loading data</td></tr>';
    }
}


async function approveUser(userId) {
    if (!confirm('Approve this user account?')) return;
    try {
        await makeApiCall(`/api/v1/users/${userId}/approve`, 'PATCH'); 
        showToast('messageArea', 'User approved!', 'alert-success');
        fetchPendingUsers();
    } catch (err) {
        showToast('messageArea', err.message || 'Approval failed', 'alert-danger');
    }
}


async function rejectUser(userId) {
    if (!confirm('Reject this user account? They will not be able to log in.')) return;
    try {
        await makeApiCall(`/api/v1/users/${userId}/reject`, 'PATCH'); 
        showToast('messageArea', 'User rejected!', 'alert-success');
        fetchPendingUsers();
    } catch (err) {
        showToast('messageArea', err.message || 'Rejection failed', 'alert-danger');
    }
}

function adminLogout(e) {
    e?.preventDefault();
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    window.location.href = 'adminLogin.html';
}


document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop();

    if (page === 'adminDashboard.html') {
        if (!localStorage.getItem(ADMIN_TOKEN_KEY)) {
            window.location.href = 'adminLogin.html';
            return;
        }
        fetchPendingUsers(); 
        document.getElementById('logoutLink')?.addEventListener('click', adminLogout);
        document.querySelector('.btn-refresh')?.addEventListener('click', fetchPendingUsers);
    }


    if (page === 'adminLogin.html') {

        const signupSuccess = sessionStorage.getItem('signupSuccess');
        if (signupSuccess) {
            showToast('loginMessageArea', signupSuccess, 'alert-success');
            sessionStorage.removeItem('signupSuccess'); 
        }

        const registerSuccess = sessionStorage.getItem('registerSuccess');
        if (registerSuccess) {
            showToast('loginMessageArea', registerSuccess, 'alert-success');
            sessionStorage.removeItem('registerSuccess'); 
        }

        if (localStorage.getItem(ADMIN_TOKEN_KEY)) {
            window.location.href = 'adminDashboard.html';
            return;
        }
        
        document.getElementById('adminLoginForm')?.addEventListener('submit', handleAdminLogin);
    }
    
    // 3. USER SIGNUP PAGE LOGIC (Existing)
    if (page === 'signup.html') {
        if (localStorage.getItem(ADMIN_TOKEN_KEY)) {
            window.location.href = 'adminDashboard.html';
            return;
        }
        document.getElementById('userSignupForm')?.addEventListener('submit', handleUserSignup);
    }

    if (page === 'adminRegister.html') {
        // Prevent logged-in admin from accessing register page
        if (localStorage.getItem(ADMIN_TOKEN_KEY)) {
            window.location.href = 'adminDashboard.html';
            return;
        }

        // Attach admin register form listener
        document.getElementById('adminRegisterForm')?.addEventListener('submit', handleAdminRegister);
    }
});