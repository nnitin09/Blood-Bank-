// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    const App = {
        // DOM Elements
        $: {
            loginView: document.getElementById('login-view'),
            mainApp: document.getElementById('main-app'),
            loginForm: document.getElementById('login-form'),
            loginError: document.getElementById('login-error'),

            sidebar: document.getElementById('sidebar'),
            mainContent: document.getElementById('main-content'),
            navLinks: document.querySelectorAll('.nav-link'),
            userNameDisplay: document.getElementById('user-name-display'),
            userRoleDisplay: document.getElementById('user-role-display'),
            logoutBtn: document.getElementById('logout-btn'),

            views: document.querySelectorAll('.view'),
            dashboard: {
                view: document.getElementById('dashboard-view'),
                cards: document.getElementById('dashboard-cards'),
            },
            inventory: {
                view: document.getElementById('inventory-view'),
                tableBody: document.getElementById('inventory-table-body'),
                addBtn: document.getElementById('add-inventory-btn'),
            },
            donations: {
                view: document.getElementById('donations-view'),
                tableBody: document.getElementById('donations-table-body'),
                addBtn: document.getElementById('add-donation-btn'),
            },
            reports: {
                view: document.getElementById('reports-view'),
                summaryCards: document.getElementById('report-summary-cards'),
                recentDonations: document.getElementById('report-recent-donations'),
            },
            
            modal: {
                container: document.getElementById('modal-container'),
                title: document.getElementById('modal-title'),
                body: document.getElementById('modal-body'),
                closeBtn: document.getElementById('modal-close-btn'),
            },
            
            toastContainer: document.getElementById('toast-container'),
        },

        // Application State
        state: {
            currentUser: null,
            currentView: 'dashboard',
        },

        // Initialization
        init() {
            this.state.currentUser = Auth.getCurrentUser();
            if (this.state.currentUser) {
                this.showMainApp();
            } else {
                this.showLoginView();
            }
            this.registerEventListeners();
        },

        // Event Listeners
        registerEventListeners() {
            this.$.loginForm.addEventListener('submit', e => {
                e.preventDefault();
                const username = e.target.username.value;
                const password = e.target.password.value;
                const user = Auth.login(username, password);
                if (user) {
                    this.state.currentUser = user;
                    this.showMainApp();
                } else {
                    this.$.loginError.textContent = 'Invalid username or password.';
                }
            });

            this.$.logoutBtn.addEventListener('click', () => {
                Auth.logout();
                window.location.reload();
            });

            this.$.navLinks.forEach(link => {
                link.addEventListener('click', e => {
                    e.preventDefault();
                    const viewName = link.getAttribute('href').substring(1);
                    this.navigateTo(viewName);
                });
            });
            
            this.$.modal.closeBtn.addEventListener('click', () => this.closeModal());
            this.$.modal.container.addEventListener('click', e => {
                if (e.target === this.$.modal.container) {
                    this.closeModal();
                }
            });
            
            this.$.inventory.addBtn.addEventListener('click', () => this.showAddInventoryModal());
            this.$.donations.addBtn.addEventListener('click', () => this.showAddDonationModal());
        },

        // View Management
        showLoginView() {
            this.$.loginView.classList.remove('hidden');
            this.$.mainApp.classList.add('hidden');
        },

        showMainApp() {
            this.$.loginView.classList.add('hidden');
            this.$.mainApp.classList.remove('hidden');
            this.setupUIForUser();
            this.navigateTo(this.state.currentView);
        },

        setupUIForUser() {
            this.$.userNameDisplay.textContent = this.state.currentUser.username;
            this.$.userRoleDisplay.textContent = this.state.currentUser.role;
            
            // Show/hide role-specific elements
            document.querySelectorAll('[data-role]').forEach(el => {
                if (Auth.hasRole(el.dataset.role)) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            });
        },
        
        navigateTo(viewName) {
            if (viewName === 'reports' && !Auth.hasRole('supervisor')) {
                this.showToast('Access denied. Supervisor role required.', 'error');
                return;
            }
            
            this.state.currentView = viewName;

            this.$.views.forEach(view => view.classList.add('hidden'));
            this.$.navLinks.forEach(link => link.classList.remove('active'));

            const currentViewEl = document.getElementById(`${viewName}-view`);
            const currentLinkEl = document.querySelector(`a[href="#${viewName}"]`);

            if (currentViewEl) currentViewEl.classList.remove('hidden');
            if (currentLinkEl) currentLinkEl.classList.add('active');

            this.renderCurrentView();
        },
        
        renderCurrentView() {
            switch(this.state.currentView) {
                case 'dashboard': this.renderDashboard(); break;
                case 'inventory': this.renderInventory(); break;
                case 'donations': this.renderDonations(); break;
                case 'reports': this.renderReports(); break;
            }
        },

        // Render Functions
        renderDashboard() {
            const inventory = DB.getInventory();
            const bloodGroups = inventory.reduce((acc, item) => {
                if (item.status === 'available') {
                    acc[item.bloodType] = (acc[item.bloodType] || 0) + item.units;
                }
                return acc;
            }, {});
            
            const totalUnits = Object.values(bloodGroups).reduce((sum, count) => sum + count, 0);
            const totalDonations = DB.getDonations().length;

            const cardsHTML = `
                <div class="card">
                    <div class="icon"><i class="fas fa-tint"></i></div>
                    <div class="info"><h4>${totalUnits}</h4><p>Total Units Available</p></div>
                </div>
                <div class="card">
                    <div class="icon"><i class="fas fa-hand-holding-heart"></i></div>
                    <div class="info"><h4>${totalDonations}</h4><p>Total Donations</p></div>
                </div>
                 ${Object.entries(bloodGroups).map(([type, count]) => `
                    <div class="card">
                        <div class="icon" style="color: #64748b; background: #e2e8f0;"><i class="fas fa-vial"></i></div>
                        <div class="info"><h4>${count}</h4><p>${type} Units</p></div>
                    </div>
                `).join('')}
            `;
            this.$.dashboard.cards.innerHTML = cardsHTML;
        },

        renderInventory() {
            const inventory = DB.getInventory();
            const rowsHTML = inventory.map(item => `
                <tr>
                    <td><strong>${item.bloodType}</strong></td>
                    <td>${item.units}</td>
                    <td>${new Date(item.donationDate).toLocaleDateString()}</td>
                    <td>${new Date(item.expiryDate).toLocaleDateString()}</td>
                    <td>
                        <span class="status-badge ${item.status === 'available' ? 'status-available' : 'status-used'}">
                            ${item.status}
                        </span>
                    </td>
                    <td class="actions-cell">
                        ${item.status === 'available' ? `<button class="btn-mark-used" data-id="${item.id}" title="Mark as Used"><i class="fas fa-check-circle"></i></button>` : ''}
                    </td>
                </tr>
            `).join('');
            this.$.inventory.tableBody.innerHTML = rowsHTML;
            
            // Add event listeners for new buttons
            document.querySelectorAll('.btn-mark-used').forEach(btn => {
                btn.addEventListener('click', e => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    DB.updateInventoryStatus(id, 'used');
                    this.renderInventory();
                    this.showToast('Unit status updated to "Used".');
                });
            });
        },
        
        renderDonations() {
            const donations = DB.getDonations();
            const rowsHTML = donations.map(d => `
                <tr>
                    <td>${d.donorName}</td>
                    <td>${d.bloodType}</td>
                    <td>${new Date(d.donationDate).toLocaleDateString()}</td>
                    <td>${d.contact}</td>
                    <td class="actions-cell">
                        <button class="btn-delete-donation" data-id="${d.id}" title="Delete Record"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `).join('');
            this.$.donations.tableBody.innerHTML = rowsHTML;
            
            document.querySelectorAll('.btn-delete-donation').forEach(btn => {
                btn.addEventListener('click', e => {
                    if (confirm('Are you sure you want to delete this donation record?')) {
                        const id = parseInt(e.currentTarget.dataset.id);
                        DB.deleteDonation(id);
                        this.renderDonations();
                        this.showToast('Donation record deleted.', 'error');
                    }
                });
            });
        },
        
        renderReports() {
            const inventory = DB.getInventory();
            const donations = DB.getDonations();
            
            const bloodGroups = inventory.reduce((acc, item) => {
                if (item.status === 'available') {
                    acc[item.bloodType] = (acc[item.bloodType] || 0) + item.units;
                }
                return acc;
            }, {});
            
            const summaryCardsHTML = Object.entries(bloodGroups).map(([type, count]) => `
                <div class="card">
                    <div class="icon"><i class="fas fa-vial"></i></div>
                    <div class="info"><h4>${count}</h4><p>${type} Units</p></div>
                </div>
            `).join('');
            this.$.reports.summaryCards.innerHTML = summaryCardsHTML;
            
            const recentDonationsHTML = `
                <h4>Recent Donations (Last 30 Days)</h4>
                <table><thead><tr><th>Donor</th><th>Type</th><th>Date</th></tr></thead><tbody>
                ${donations
                    .filter(d => new Date(d.donationDate) > new Date(new Date().setDate(new Date().getDate() - 30)))
                    .map(d => `<tr><td>${d.donorName}</td><td>${d.bloodType}</td><td>${new Date(d.donationDate).toLocaleDateString()}</td></tr>`)
                    .join('')}
                </tbody></table>
            `;
            this.$.reports.recentDonations.innerHTML = recentDonationsHTML;
        },

        // Modal Handlers
        showModal(title, formHTML) {
            this.$.modal.title.textContent = title;
            this.$.modal.body.innerHTML = formHTML;
            this.$.modal.container.classList.remove('hidden');
        },

        closeModal() {
            this.$.modal.container.classList.add('hidden');
            this.$.modal.body.innerHTML = '';
        },
        
        showAddInventoryModal() {
            const formHTML = `
                <form id="add-inventory-form" class="modal-form">
                    <div class="input-group">
                        <label for="bloodType">Blood Type</label>
                        <select id="bloodType" name="bloodType" required>
                            <option value="A+">A+</option><option value="A-">A-</option>
                            <option value="B+">B+</option><option value="B-">B-</option>
                            <option value="AB+">AB+</option><option value="AB-">AB-</option>
                            <option value="O+">O+</option><option value="O-">O-</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label for="units">Units</label>
                        <input type="number" id="units" name="units" required min="1" value="1">
                    </div>
                    <div class="input-group">
                        <label for="donationDate">Donation Date</label>
                        <input type="date" id="donationDate" name="donationDate" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <button type="submit" class="btn btn-primary">Add Unit</button>
                </form>
            `;
            this.showModal('Add New Blood Unit', formHTML);
            
            document.getElementById('add-inventory-form').addEventListener('submit', e => {
                e.preventDefault();
                const newUnit = {
                    bloodType: e.target.bloodType.value,
                    units: parseInt(e.target.units.value),
                    donationDate: e.target.donationDate.value
                };
                DB.addInventory(newUnit);
                this.renderInventory();
                this.closeModal();
                this.showToast('New blood unit added successfully!');
            });
        },
        
        showAddDonationModal() {
            const formHTML = `
                <form id="add-donation-form" class="modal-form">
                    <div class="input-group">
                        <label for="donorName">Donor Name</label>
                        <input type="text" id="donorName" name="donorName" required>
                    </div>
                    <div class="input-group">
                        <label for="bloodType">Blood Type</label>
                        <select id="bloodType" name="bloodType" required>
                            <option value="A+">A+</option><option value="A-">A-</option>
                            <option value="B+">B+</option><option value="B-">B-</option>
                            <option value="AB+">AB+</option><option value="AB-">AB-</option>
                            <option value="O+">O+</option><option value="O-">O-</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label for="contact">Contact Info (Phone/Email)</label>
                        <input type="text" id="contact" name="contact" required>
                    </div>
                     <div class="input-group">
                        <label for="donationDate">Donation Date</label>
                        <input type="date" id="donationDate" name="donationDate" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <button type="submit" class="btn btn-primary">Add Record</button>
                </form>
            `;
            this.showModal('Add New Donation Record', formHTML);

            document.getElementById('add-donation-form').addEventListener('submit', e => {
                e.preventDefault();
                const newDonation = {
                    donorName: e.target.donorName.value,
                    bloodType: e.target.bloodType.value,
                    contact: e.target.contact.value,
                    donationDate: e.target.donationDate.value
                };
                DB.addDonation(newDonation);
                
                // Also add a corresponding inventory item
                DB.addInventory({
                    bloodType: newDonation.bloodType,
                    units: 1, // Assume 1 unit per donation
                    donationDate: newDonation.donationDate
                });

                this.renderDonations();
                this.closeModal();
                this.showToast('Donation recorded and inventory updated!');
            });
        },
        
        // Toast Notifications
        showToast(message, type = 'success') {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
            this.$.toastContainer.appendChild(toast);
            setTimeout(() => {
                toast.remove();
            }, 5000);
        }
    };

    App.init();
});