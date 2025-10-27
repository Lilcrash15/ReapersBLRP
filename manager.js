// --- DEVELOPER BACKDOOR ---
const DEV_MODE = false;
// ---

document.addEventListener('DOMContentLoaded', () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    const managerContent = document.getElementById('manager-content');
    if (!managerContent) {
        if(loadingOverlay) hideLoadingScreen();
        return;
    }

    let db, firestoreFunctions;
    let employees = [];
    let editingEmployeeId = null;
    let managerPassword = "changeme_manager";

    const loginContainer = document.getElementById('manager-login-container');
    const loginForm = document.getElementById('manager-login-form');
    const passwordInput = document.getElementById('manager-password');
    const loginError = document.getElementById('manager-login-error');
    const employeeForm = document.getElementById('employee-form');
    const employeeFormTitle = document.querySelector('#employee-form h3');
    const employeeNameInput = document.getElementById('employee-name');
    const employeeIdNumberInput = document.getElementById('employee-id-number');
    const employeeDlNumberInput = document.getElementById('employee-dl-number');
    const employeeBankInfoInput = document.getElementById('employee-bank-info');
    const saveEmployeeBtn = document.getElementById('save-employee-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const employeeListDiv = document.getElementById('employee-list');
    const transactionLogDisplayDiv = document.getElementById('transaction-log-display');
    const exportTransactionsBtn = document.getElementById('export-transactions-btn');
    const timeLogDisplayDiv = document.getElementById('time-log-display');
    const exportTimeLogsBtn = document.getElementById('export-time-logs-btn');
    const employeePasswordForm = document.getElementById('employee-password-form');
    const newEmployeePasswordInput = document.getElementById('new-employee-password');
    const employeePasswordStatus = document.getElementById('employee-password-status');
    const managerPasswordForm = document.getElementById('manager-password-form');
    const newManagerPasswordInput = document.getElementById('new-manager-password');
    const managerPasswordStatus = document.getElementById('manager-password-status');

    const hideLoadingScreen = () => {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            setTimeout(() => { if (loadingOverlay.parentNode) { loadingOverlay.parentNode.removeChild(loadingOverlay); } }, 500);
        }
    };

    const updateView = (isManager) => {
        loginContainer.style.display = isManager ? 'none' : 'block';
        managerContent.style.display = isManager ? 'block' : 'none';
        if (isManager && typeof addLogoutButton === 'function') {
            addLogoutButton();
        }
    };

    const renderEmployeeList = () => {
        employeeListDiv.innerHTML = '';
        employees.sort((a, b) => a.name.localeCompare(b.name));
        if (employees.length === 0) {
            employeeListDiv.innerHTML = '<p><i>No employees found.</i></p>';
            return;
        }
        employees.forEach(emp => {
            const item = document.createElement('div');
            item.className = 'employee-item';
            item.innerHTML = `
                <div class="employee-details">
                    <strong class="employee-name">${emp.name}</strong>
                    <div class="employee-info-block">
                        <span>ID: ${emp.idNumber || 'N/A'}</span>
                        <span>DL: ${emp.dlNumber || 'N/A'}</span>
                        <span>Bank: ${emp.bankInfo || 'N/A'}</span>
                    </div>
                </div>
                <div class="employee-actions">
                    <button class="action-button edit-btn" data-id="${emp.id}">Edit</button>
                    <button class="action-button clear-button remove-btn" data-id="${emp.id}">Remove</button>
                </div>`;
            employeeListDiv.appendChild(item);
        });
    };

    const loadAllEmployees = async () => {
        try {
            const q = firestoreFunctions.query(firestoreFunctions.collection(db, "employees"), firestoreFunctions.orderBy("name"));
            const snapshot = await firestoreFunctions.getDocs(q);
            employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderEmployeeList();
        } catch (error) { console.error("Error loading employees:", error); }
    };
    
    const resetEmployeeForm = () => {
        employeeForm.reset();
        editingEmployeeId = null;
        if (employeeFormTitle) employeeFormTitle.textContent = 'Add New Employee';
        saveEmployeeBtn.textContent = 'Add Employee';
        cancelEditBtn.style.display = 'none';
    };

    const prepareEditEmployee = (id) => {
        const employee = employees.find(e => e.id === id);
        if (employee) {
            editingEmployeeId = id;
            employeeNameInput.value = employee.name;
            employeeIdNumberInput.value = employee.idNumber;
            employeeDlNumberInput.value = employee.dlNumber || '';
            employeeBankInfoInput.value = employee.bankInfo || '';
            if (employeeFormTitle) employeeFormTitle.textContent = 'Edit Employee';
            saveEmployeeBtn.textContent = 'Update Employee';
            cancelEditBtn.style.display = 'inline-block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const saveEmployee = async (e) => {
        e.preventDefault();
        const name = employeeNameInput.value.trim();
        const idNumber = employeeIdNumberInput.value.trim();
        const dlNumber = employeeDlNumberInput.value.trim();
        const bankInfo = employeeBankInfoInput.value.trim();
        if (!name || !idNumber || !dlNumber || !bankInfo) { alert("All employee fields are required."); return; }
        const employeeData = { name, idNumber, dlNumber, bankInfo };
        try {
            if (editingEmployeeId) {
                await firestoreFunctions.updateDoc(firestoreFunctions.doc(db, "employees", editingEmployeeId), employeeData);
            } else {
                await firestoreFunctions.addDoc(firestoreFunctions.collection(db, "employees"), employeeData);
            }
            resetEmployeeForm();
            await loadAllEmployees();
        } catch (error) { console.error("Error saving employee:", error); }
    };

    const deleteEmployee = async (id) => {
        if (confirm('Are you sure you want to remove this employee? This cannot be undone.')) {
            try {
                await firestoreFunctions.deleteDoc(firestoreFunctions.doc(db, "employees", id));
                await loadAllEmployees();
            } catch (error) { console.error("Error deleting employee:", error); }
        }
    };
    
    const loadAllTransactions = async () => {
        transactionLogDisplayDiv.innerHTML = `<p><i>Loading transactions...</i></p>`;
        try {
            const q = firestoreFunctions.query(firestoreFunctions.collection(db, "transactions"), firestoreFunctions.orderBy("createdAt", "desc"));
            const snapshot = await firestoreFunctions.getDocs(q);
            if (snapshot.empty) {
                transactionLogDisplayDiv.innerHTML = `<p><i>No transactions logged yet.</i></p>`;
                return;
            }
            let tableHtml = '<table id="transactions-table"><thead><tr><th>Employee</th><th>Date</th><th>Buy Total</th><th>Sell Total</th><th>Net Total</th><th>Items</th></tr></thead><tbody>';
            snapshot.forEach(doc => {
                const entry = doc.data();
                const buyTotal = entry.buyTotal || 0;
                const sellTotal = entry.sellTotal || 0;
                const netTotal = entry.netTotal ?? (entry.totalAmount ?? (sellTotal - buyTotal));
                const buyItems = (entry.buyItems || []).map(i => `${i.name}(x${i.quantity})`).join(', ');
                const sellItems = (entry.sellItems || []).map(i => `${i.name}(x${i.quantity})`).join(', ');
                const oldItems = (entry.items || []).map(i => `${i.itemName}(x${i.quantity})`).join(', ');
                let itemsStr = '';
                if (buyItems) itemsStr += `BUY: ${buyItems}`;
                if (sellItems) itemsStr += `${buyItems ? ' || ' : ''}SELL: ${sellItems}`;
                if (!itemsStr && oldItems) itemsStr = oldItems;
                tableHtml += `<tr>
                    <td>${entry.employeeName || 'N/A'}</td>
                    <td>${entry.createdAt ? entry.createdAt.toDate().toLocaleString() : 'N/A'}</td>
                    <td>$${buyTotal.toLocaleString()}</td>
                    <td>$${sellTotal.toLocaleString()}</td>
                    <td>$${netTotal.toLocaleString()}</td>
                    <td>${itemsStr || 'N/A'}</td>
                </tr>`;
            });
            tableHtml += '</tbody></table>';
            transactionLogDisplayDiv.innerHTML = tableHtml;
        } catch (error) {
            console.error("Error processing transaction logs:", error);
            transactionLogDisplayDiv.innerHTML = `<p class="error-message">Error loading logs. A record may be corrupt. See console.</p>`;
        }
    };
    
    const loadAllTimeEntries = async () => {
        timeLogDisplayDiv.innerHTML = `<p><i>Loading time logs...</i></p>`;
        try {
            const q = firestoreFunctions.query(firestoreFunctions.collection(db, "timeEntries"), firestoreFunctions.orderBy("clockInTime", "desc"));
            const snapshot = await firestoreFunctions.getDocs(q);
            if (snapshot.empty) { timeLogDisplayDiv.innerHTML = `<p><i>No time entries logged yet.</i></p>`; return; }
            let tableHtml = '<table id="timelogs-table"><thead><tr><th>Employee</th><th>Clock In</th><th>Clock Out</th><th>Duration</th></tr></thead><tbody>';
            snapshot.forEach(doc => {
                const entry = doc.data();
                const clockIn = entry.clockInTime.toDate();
                let clockOutStr = '<i>Active</i>', durationStr = '<i>N/A</i>';
                if (entry.clockOutTime) {
                    const clockOut = entry.clockOutTime.toDate();
                    clockOutStr = clockOut.toLocaleString();
                    const durationMinutes = Math.round((clockOut - clockIn) / 60000);
                    durationStr = `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;
                }
                tableHtml += `<tr><td>${entry.employeeName}</td><td>${clockIn.toLocaleString()}</td><td>${clockOutStr}</td><td>${durationStr}</td></tr>`;
            });
            tableHtml += '</tbody></table>';
            timeLogDisplayDiv.innerHTML = tableHtml;
        } catch (error) { timeLogDisplayDiv.innerHTML = `<p class="error-message">Error loading time logs.</p>`; console.error(error); }
    };
    
    const updatePassword = async (type, newPassword, statusElement) => {
        if (!newPassword || newPassword.length < 4) { if (typeof showStatusMessage === 'function') showStatusMessage(statusElement, "Password must be >= 4 characters.", false); return; }
        try {
            await firestoreFunctions.setDoc(firestoreFunctions.doc(db, "siteSettings", "passwords"), { [type]: newPassword }, { merge: true });
            if (type === 'manager') managerPassword = newPassword;
            if (typeof showStatusMessage === 'function') showStatusMessage(statusElement, `${type.charAt(0).toUpperCase() + type.slice(1)} password updated!`, true);
        } catch (error) { console.error(`Error updating ${type} password:`, error); if (typeof showStatusMessage === 'function') showStatusMessage(statusElement, `Error updating password.`, false); }
    };

    const executeManagerAppLogic = async (firebaseDetail) => {
        if (DEV_MODE) { console.warn("DEV_MODE ACTIVE."); updateView(true); hideLoadingScreen(); return; }
        db = firebaseDetail.db;
        firestoreFunctions = firebaseDetail.functions;
        if (typeof checkManagerSession === 'function' && checkManagerSession()) {
            updateView(true);
            await Promise.all([loadAllEmployees(), loadAllTransactions(), loadAllTimeEntries()]);
        } else {
            updateView(false);
            try {
                const docRef = firestoreFunctions.doc(db, "siteSettings", "passwords");
                const docSnap = await firestoreFunctions.getDoc(docRef);
                if (docSnap.exists() && docSnap.data().manager) {
                    managerPassword = docSnap.data().manager;
                }
            } catch (e) { console.warn("Could not fetch manager password."); }
        }
        hideLoadingScreen();
    };
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (passwordInput.value === managerPassword) {
            if (typeof grantManagerSession === 'function') grantManagerSession();
            window.location.reload();
        } else {
            loginError.style.display = 'block';
        }
    });

    employeeForm.addEventListener('submit', saveEmployee);
    cancelEditBtn.addEventListener('click', resetEmployeeForm);
    employeeListDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) prepareEditEmployee(e.target.dataset.id); 
        else if (e.target.classList.contains('remove-btn')) deleteEmployee(e.target.dataset.id);
    });

    exportTransactionsBtn.addEventListener('click', () => exportTableToCSV('transactions.csv', 'transactions-table'));
    exportTimeLogsBtn.addEventListener('click', () => exportTableToCSV('time_logs.csv', 'timelogs-table'));

    employeePasswordForm.addEventListener('submit', (e) => { e.preventDefault(); updatePassword('employee', newEmployeePasswordInput.value.trim(), employeePasswordStatus); });
    managerPasswordForm.addEventListener('submit', (e) => { e.preventDefault(); updatePassword('manager', newManagerPasswordInput.value.trim(), managerPasswordStatus); });

    let appHasInitialized = false;
    const initializeApp = () => {
        if (appHasInitialized) return;
        appHasInitialized = true;
        if (DEV_MODE) { executeManagerAppLogic(); return; }
        const firebaseReadyHandler = (e) => {
            executeManagerAppLogic(e ? e.detail : { db: window.db, functions: window.firestoreFunctions });
        };
        if (window.isFirebaseReady) { firebaseReadyHandler(); }
        else { document.addEventListener('firebaseReady', firebaseReadyHandler); }
    };
    document.addEventListener('firebaseError', (e) => { if (!appHasInitialized) { alert("Firebase failed to load. " + e.detail?.error?.message); hideLoadingScreen(); }});
    initializeApp();
    setTimeout(() => { if (!appHasInitialized) { console.warn("Forcing app initialization."); initializeApp(); } }, 3000);
});