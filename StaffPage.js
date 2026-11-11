/* Student Note: Run scripts when DOM tree is ready */
document.addEventListener('DOMContentLoaded', () => {

    // Initialize Lucide Vector Icons
    lucide.createIcons();

    // ================= 1. SIDEBAR MAIN VIEW SWITCHING =================
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const contentViews = document.querySelectorAll('.content-view');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const targetViewId = link.getAttribute('data-view');

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            contentViews.forEach(view => {
                view.classList.remove('active');
                if (view.id === targetViewId) {
                    view.classList.add('active');
                }
            });
        });
    });

    // ================= 2. PROFILE SETTINGS INNER TAB SWITCHING =================
    const settingsTabBtns = document.querySelectorAll('.settings-tab-btn');
    const settingsPanes = document.querySelectorAll('.settings-pane');

    settingsTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            settingsTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            settingsPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === targetTab) {
                    pane.classList.add('active');
                }
            });
        });
    });

    // ================= 3. MENU MODALS INTERACTIVITY =================
    const editItemModal = document.getElementById('editItemModal');
    const addItemModal = document.getElementById('addItemModal');

    // Open Edit Modal
    const btnSmEdits = document.querySelectorAll('.btn-sm-edit');
    btnSmEdits.forEach(btn => {
        btn.addEventListener('click', () => {
            editItemModal.classList.add('active');
        });
    });

    // Open Add Item Modal
    const btnOpenAddModal = document.getElementById('btnOpenAddModal');
    btnOpenAddModal.addEventListener('click', () => {
        addItemModal.classList.add('active');
    });

    // Close Modals
    document.getElementById('btnCloseEditModal').addEventListener('click', () => {
        editItemModal.classList.remove('active');
    });

    document.getElementById('btnCancelEdit').addEventListener('click', () => {
        editItemModal.classList.remove('active');
    });

    document.getElementById('btnCloseAddModal').addEventListener('click', () => {
        addItemModal.classList.remove('active');
    });

    document.getElementById('btnCancelAdd').addEventListener('click', () => {
        addItemModal.classList.remove('active');
    });

});