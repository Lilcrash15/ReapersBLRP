// --- DEVELOPER BACKDOOR ---
// Set to 'true' to bypass Firebase and see the UI immediately for styling.
// Set to 'false' for normal operation with a live database.
const DEV_MODE = false;
// ---

document.addEventListener('DOMContentLoaded', () => {
    // --- Constant Data & Elements ---
    const loadingOverlay = document.getElementById('loading-overlay');
    const employeeContent = document.getElementById('employee-content');
    
    if (!employeeContent) {
        console.error("FATAL ERROR: The '#employee-content' div was not found in the HTML. The script cannot continue.");
        if(loadingOverlay) hideLoadingScreen();
        return;
    }

    const itemData = [
            { name: "AA Battery", buyPrice: 5, sellPrice: 10, crewPrice: 8 },
            { name: "Aluminum", buyPrice: 40, sellPrice: 50, crewPrice: 45 },
            { name: "Angle Grinder", buyPrice: 15000, sellPrice: 20000, crewPrice: 18000 },
            { name: "Car Battery", buyPrice: 2000, sellPrice: 2500, crewPrice: 2300 },
            { name: "Cat Converter", buyPrice: 4500, sellPrice: 0, crewPrice: 0 },
            { name: "Charcoal", buyPrice: 1, sellPrice: 2, crewPrice: 2 },
            { name: "Circuit Board", buyPrice: 5000, sellPrice: 6000, crewPrice: 5500 },
            { name: "Copper", buyPrice: 10, sellPrice: 20, crewPrice: 15 },
            { name: "Copper Coils", buyPrice: 75, sellPrice: 90, crewPrice: 85 },
            { name: "Duct Tape", buyPrice: 30, sellPrice: 40, crewPrice: 35 },
            { name: "Electronic Parts", buyPrice: 15, sellPrice: 20, crewPrice: 18 },
            { name: "Gadgets", buyPrice: 150, sellPrice: 200, crewPrice: 175 },
            { name: "Gears", buyPrice: 125, sellPrice: 135, crewPrice: 130 },
            { name: "Glass Shards", buyPrice: 15, sellPrice: 20, crewPrice: 18 },
            { name: "Glue", buyPrice: 30, sellPrice: 40, crewPrice: 35 },
            { name: "Gold Ingot", buyPrice: 65, sellPrice: 75, crewPrice: 70 },
            { name: "Gold Nugget", buyPrice: 32, sellPrice: 0, crewPrice: 0 },
            { name: "Gold Rolex", buyPrice: 1200, sellPrice: 0, crewPrice: 0 },
            { name: "Gunoil", buyPrice: 90, sellPrice: 110, crewPrice: 100 },
            { name: "Iron", buyPrice: 60, sellPrice: 70, crewPrice: 65 },
            { name: "Nitrate", buyPrice: 60, sellPrice: 70, crewPrice: 65 },
            { name: "Non-Act Phones", buyPrice: 250, sellPrice: 300, crewPrice: 275 },
            { name: "Oil", buyPrice: 66, sellPrice: 0, crewPrice: 0 },
            { name: "Plastic", buyPrice: 75, sellPrice: 85, crewPrice: 80 },
            { name: "Platinum", buyPrice: 125, sellPrice: 150, crewPrice: 140 },
            { name: "Raw Aluminum", buyPrice: 20, sellPrice: 0, crewPrice: 0 },
            { name: "Raw Cobalt", buyPrice: 500, sellPrice: 750, crewPrice: 650 },
            { name: "Raw Iron", buyPrice: 30, sellPrice: 0, crewPrice: 0 },
            { name: "Raw Platinum", buyPrice: 62, sellPrice: 0, crewPrice: 0 },
            { name: "Raw Steel", buyPrice: 32, sellPrice: 0, crewPrice: 0 },
            { name: "Raw Titanium", buyPrice: 37, sellPrice: 0, crewPrice: 0 },
            { name: "Refined Oil", buyPrice: 200, sellPrice: 300, crewPrice: 250 },
            { name: "Springs", buyPrice: 80, sellPrice: 90, crewPrice: 85 },
            { name: "Steel", buyPrice: 65, sellPrice: 75, crewPrice: 70 },
            { name: "Steel Pipes", buyPrice: 100, sellPrice: 110, crewPrice: 105 },
            { name: "Titanium", buyPrice: 75, sellPrice: 85, crewPrice: 80 },
            { name: "Trash Bags", buyPrice: 175, sellPrice: 0, crewPrice: 0 },
            { name: "USB", buyPrice: 2000, sellPrice: 2500, crewPrice: 2250 },
            { name: "Wood", buyPrice: 15, sellPrice: 20, crewPrice: 18 }
        ];

    // Sort the item data alphabetically on page load
    itemData.sort((a, b) => a.name.localeCompare(b.name));

    let db, firestoreFunctions;
    let currentClockInId = null;
    let employeePassword = "changeme";

    const loginContainer = document.getElementById('employee-login-container');
    const loginForm = document.getElementById('employee-login-form');
    const passwordInput = document.getElementById('employee-password');
    const loginError = document.getElementById('login-error');
    const employeeSelect = document.getElementById('employee-select');
    const timeClockInterface = document.getElementById('time-clock-interface');
    const statusBox = document.getElementById('time-clock-status');
    const clockInBtn = document.getElementById('clock-in-btn');
    const clockOutBtn = document.getElementById('clock-out-btn');
    const clockOutMessage = document.getElementById('clock-out-message');
    
    const buyTotalDisplay = document.getElementById('buy-total-display');
    const sellTotalDisplay = document.getElementById('sell-total-display');
    const netTotalDisplay = document.getElementById('net-total-display');
    const netTotalLabel = document.getElementById('net-total-label');
    
    const posBuyGrid = document.getElementById('pos-buy-grid');
    const posSellGrid = document.getElementById('pos-sell-grid');
    
    const clearPosBtn = document.getElementById('clear-pos-btn');
    const checkoutPosBtn = document.getElementById('checkout-pos-btn');
    const posStatusMessage = document.getElementById('pos-status-message');
    
    const cartContainer = document.getElementById('cart-container');
    const cartItemsDiv = document.getElementById('cart-items');
    const crewDiscountCheckbox = document.getElementById('crew-discount-checkbox');

    const hideLoadingScreen = () => {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            setTimeout(() => { if (loadingOverlay.parentNode) { loadingOverlay.parentNode.removeChild(loadingOverlay); } }, 500);
        }
    };

    const updateView = (isLoggedIn) => {
        loginContainer.style.display = isLoggedIn ? 'none' : 'block';
        employeeContent.style.display = isLoggedIn ? 'block' : 'none';
        if (isLoggedIn && typeof addLogoutButton === 'function') {
            addLogoutButton();
        }
    };

    const loadEmployees = async () => {
        try {
            const q = firestoreFunctions.query(firestoreFunctions.collection(db, "employees"), firestoreFunctions.orderBy("name"));
            const snapshot = await firestoreFunctions.getDocs(q);
            employeeSelect.innerHTML = '<option value="">-- Please Select --</option>';
            snapshot.forEach(doc => {
                const emp = doc.data();
                const option = new Option(`${emp.name} (ID: ${emp.idNumber})`, doc.id);
                employeeSelect.appendChild(option);
            });
        } catch (error) { console.error("Error loading employees:", error); alert("Could not load employees from the database."); }
    };

    const checkClockInStatus = async (employeeId) => {
        if (!employeeId) { timeClockInterface.style.display = 'none'; return; }
        timeClockInterface.style.display = 'block';
        clockOutMessage.style.display = 'none';
        const q = firestoreFunctions.query(firestoreFunctions.collection(db, "timeEntries"), firestoreFunctions.where("employeeId", "==", employeeId), firestoreFunctions.where("status", "==", "Active"));
        const snapshot = await firestoreFunctions.getDocs(q);
        if (!snapshot.empty) {
            const activeEntry = snapshot.docs[0];
            const clockInTime = activeEntry.data().clockInTime.toDate();
            currentClockInId = activeEntry.id;
            statusBox.innerHTML = `You are currently <strong>clocked in</strong> since ${clockInTime.toLocaleTimeString()}`;
            clockInBtn.style.display = 'none';
            clockOutBtn.style.display = 'inline-block';
        } else {
            currentClockInId = null;
            statusBox.innerHTML = `You are currently <strong>clocked out</strong>.`;
            clockInBtn.style.display = 'inline-block';
            clockOutBtn.style.display = 'none';
        }
        clockInBtn.disabled = false;
    };

    const clockIn = async () => {
        const employeeId = employeeSelect.value;
        if (!employeeId) return;
        try {
            await firestoreFunctions.addDoc(firestoreFunctions.collection(db, "timeEntries"), { employeeId: employeeId, employeeName: employeeSelect.options[employeeSelect.selectedIndex].text, clockInTime: firestoreFunctions.serverTimestamp(), status: "Active" });
            checkClockInStatus(employeeId);
        } catch (error) { console.error("Error clocking in:", error); }
    };

    const clockOut = async () => {
        if (!currentClockInId) return;
        try {
            const docRef = firestoreFunctions.doc(db, "timeEntries", currentClockInId);
            await firestoreFunctions.updateDoc(docRef, { clockOutTime: firestoreFunctions.serverTimestamp(), status: "Completed" });
            if (typeof showStatusMessage === 'function') showStatusMessage(clockOutMessage, "Successfully clocked out!", true);
            checkClockInStatus(employeeSelect.value);
        } catch (error) { console.error("Error clocking out:", error); }
    };

    const createPosItem = (item, type) => {
        const isDiscounted = crewDiscountCheckbox?.checked && type === 'sell' && item.crewPrice > 0;
        let price;
        if (type === 'buy') {
            price = item.buyPrice;
        } else {
            price = isDiscounted ? item.crewPrice : item.sellPrice;
        }

        const itemEl = document.createElement('div');
        itemEl.className = 'pos-item'; 
        
        itemEl.innerHTML = `
            <span class="item-name">${item.name}</span>
            <span class="item-price">$${price.toLocaleString()}</span>
            <input type="number" class="pos-quantity item-qty-input" min="0" placeholder="0" data-name="${item.name}" data-type="${type}">
        `;
        
        return itemEl;
    };

    const renderGrids = () => {
        if (!posBuyGrid || !posSellGrid) return;

        const quantities = new Map();
        document.querySelectorAll('.pos-quantity').forEach(input => {
            if(input.value && parseInt(input.value) > 0){
                quantities.set(input.dataset.name + '-' + input.dataset.type, input.value);
            }
        });

        posBuyGrid.innerHTML = '';
        posSellGrid.innerHTML = '';

        itemData.forEach(item => {
            if (item.buyPrice > 0) {
                const buyItemEl = createPosItem(item, 'buy');
                const savedQty = quantities.get(item.name + '-buy');
                if(savedQty) buyItemEl.querySelector('.pos-quantity').value = savedQty;
                posBuyGrid.appendChild(buyItemEl);
            }
        });

        itemData.forEach(item => {
            if (item.sellPrice > 0) {
                const sellItemEl = createPosItem(item, 'sell');
                const savedQty = quantities.get(item.name + '-sell');
                if(savedQty) sellItemEl.querySelector('.pos-quantity').value = savedQty;
                posSellGrid.appendChild(sellItemEl);
            }
        });
    };

    const calculateTotals = () => {
        let buyTotal = 0;
        let sellTotal = 0;
        const isCrewDiscountActive = crewDiscountCheckbox?.checked;

        document.querySelectorAll('#pos-buy-grid .pos-quantity').forEach(input => {
            const item = itemData.find(i => i.name === input.dataset.name);
            if (item) {
                buyTotal += (parseInt(input.value) || 0) * item.buyPrice;
            }
        });

        document.querySelectorAll('#pos-sell-grid .pos-quantity').forEach(input => {
            const item = itemData.find(i => i.name === input.dataset.name);
            if (item) {
                const price = (isCrewDiscountActive && item.crewPrice > 0) ? item.crewPrice : item.sellPrice;
                sellTotal += (parseInt(input.value) || 0) * price;
            }
        });

        const netTotal = sellTotal - buyTotal;

        buyTotalDisplay.textContent = `$${buyTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        sellTotalDisplay.textContent = `$${sellTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        netTotalDisplay.textContent = `$${Math.abs(netTotal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

        if (netTotal < 0) {
            netTotalLabel.textContent = "You Pay Customer";
            netTotalDisplay.style.color = "#e74c3c";
        } else {
            netTotalLabel.textContent = "Customer Pays You";
            netTotalDisplay.style.color = "#2ecc71";
        }
        
        updateCartDisplay();
    };

    const updateCartDisplay = () => {
        if (!cartItemsDiv || !cartContainer) return;
        cartItemsDiv.innerHTML = '';
        let itemsInCart = 0;
        const isCrewDiscountActive = crewDiscountCheckbox?.checked;
        
        document.querySelectorAll('.pos-quantity').forEach(input => {
            const quantity = parseInt(input.value) || 0;
            if (quantity > 0) {
                itemsInCart++;
                const itemName = input.dataset.name;
                const type = input.dataset.type;
                const item = itemData.find(i => i.name === itemName);

                if (item) {
                    let price;
                    if (type === 'sell') {
                        price = (isCrewDiscountActive && item.crewPrice > 0) ? item.crewPrice : item.sellPrice;
                    } else {
                        price = item.buyPrice;
                    }
                    const lineTotal = quantity * price;

                    const cartItemEl = document.createElement('div');
                    cartItemEl.className = 'cart-item';
                    cartItemEl.classList.add(type === 'buy' ? 'cart-item-buy' : 'cart-item-sell');
                    const formattedLineTotal = `$${lineTotal.toLocaleString('en-US')}`;
                    cartItemEl.textContent = `(${type.toUpperCase()}) ${quantity}x ${itemName} - ${formattedLineTotal}`;
                    cartItemEl.addEventListener('click', () => cartItemEl.classList.toggle('checked-off'));
                    cartItemsDiv.appendChild(cartItemEl);
                }
            }
        });
        cartContainer.style.display = (itemsInCart > 0) ? 'block' : 'none';
    };

    const clearPos = () => {
        document.querySelectorAll('.pos-quantity').forEach(input => input.value = '');
        if (crewDiscountCheckbox) crewDiscountCheckbox.checked = false;
        renderGrids();
        calculateTotals();
    };

    const logTransaction = async () => {
        const employeeId = employeeSelect.value;
        if (!employeeId) { if(typeof showStatusMessage === 'function') showStatusMessage(posStatusMessage, "Please select an employee.", false); return; }

        const isCrewDiscountActive = crewDiscountCheckbox?.checked;
        const buyItems = Array.from(document.querySelectorAll('#pos-buy-grid .pos-quantity')).map(i => ({ name: i.dataset.name, quantity: parseInt(i.value) || 0 })).filter(i => i.quantity > 0);
        const sellItems = Array.from(document.querySelectorAll('#pos-sell-grid .pos-quantity')).map(i => ({ name: i.dataset.name, quantity: parseInt(i.value) || 0 })).filter(i => i.quantity > 0);

        if (buyItems.length === 0 && sellItems.length === 0) { if(typeof showStatusMessage === 'function') showStatusMessage(posStatusMessage, "Cart is empty.", false); return; }

        const buyTotal = parseFloat(buyTotalDisplay.textContent.replace(/[$,]/g, ''));
        const sellTotal = parseFloat(sellTotalDisplay.textContent.replace(/[$,]/g, ''));
        const netTotal = sellTotal - buyTotal;
        
        try {
            await firestoreFunctions.addDoc(firestoreFunctions.collection(db, "transactions"), {
                employeeId,
                employeeName: employeeSelect.options[employeeSelect.selectedIndex].text,
                createdAt: firestoreFunctions.serverTimestamp(),
                buyTotal,
                sellTotal,
                netTotal,
                buyItems,
                sellItems,
                crewDiscountApplied: isCrewDiscountActive
            });
            if(typeof showStatusMessage === 'function') showStatusMessage(posStatusMessage, "Transaction logged successfully!", true);
            clearPos();
        } catch (error) {
            console.error("Error logging transaction:", error);
            if(typeof showStatusMessage === 'function') showStatusMessage(posStatusMessage, "Error logging transaction.", false);
        }
    };

    const executeMainAppLogic = async (firebaseDetail) => {
        if (DEV_MODE) {
            console.warn("DEV_MODE is ACTIVE. Bypassing Firebase.");
            updateView(true);
            renderGrids();
            calculateTotals();
            hideLoadingScreen();
            return;
        }
        db = firebaseDetail.db;
        firestoreFunctions = firebaseDetail.functions;
        if (typeof checkEmployeeSession === 'function' && checkEmployeeSession()) {
            updateView(true);
            await loadEmployees();
        } else {
            updateView(false);
            try {
                const docRef = firestoreFunctions.doc(db, "siteSettings", "passwords");
                const docSnap = await firestoreFunctions.getDoc(docRef);
                if (docSnap.exists() && docSnap.data().employee) employeePassword = docSnap.data().employee;
            } catch (e) { console.warn("Could not fetch password, using default."); }
        }
        renderGrids();
        calculateTotals();
        hideLoadingScreen();
    };

    const mainContainer = document.querySelector('#pos-main-container');
    if(mainContainer) mainContainer.addEventListener('input', calculateTotals);
    
    if(crewDiscountCheckbox) {
        crewDiscountCheckbox.addEventListener('change', () => {
            renderGrids();
            calculateTotals();
        });
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (passwordInput.value === employeePassword) {
            if (typeof grantEmployeeSession === 'function') grantEmployeeSession();
            window.location.reload();
        } else {
            loginError.style.display = 'block';
        }
    });

    clearPosBtn.addEventListener('click', clearPos);
    checkoutPosBtn.addEventListener('click', logTransaction);
    employeeSelect.addEventListener('change', (e) => checkClockInStatus(e.target.value));
    clockInBtn.addEventListener('click', clockIn);
    clockOutBtn.addEventListener('click', clockOut);
    
    let appHasInitialized = false;
    const initializeApp = () => {
        if (appHasInitialized) return;
        appHasInitialized = true;

        if (DEV_MODE) {
            executeMainAppLogic();
            return;
        }
        
        const firebaseReadyHandler = (e) => {
            executeMainAppLogic(e ? e.detail : { db: window.db, functions: window.firestoreFunctions });
        };
        
        if (window.isFirebaseReady) {
            firebaseReadyHandler();
        } else {
            document.addEventListener('firebaseReady', firebaseReadyHandler);
        }
    };

    document.addEventListener('firebaseError', (e) => {
        if (!appHasInitialized) {
            alert("Critical Error: Firebase failed to load. " + e.detail?.error?.message);
            hideLoadingScreen();
        }
    });
    
    initializeApp();

    setTimeout(() => {
        if (!appHasInitialized) {
            console.warn("Firebase event listener may have failed. Forcing app initialization.");
            initializeApp();
        }
    }, 3000);
});