/* Student Note: Attach event listeners once DOM content is ready */
document.addEventListener('DOMContentLoaded', () => {

    // Student Comment: Primary switcher element references (Customer vs Staff)
    const btnCustomerRole = document.getElementById('btnCustomerRole');
    const btnStaffRole = document.getElementById('btnStaffRole');
    const customerCard = document.getElementById('customerCard');
    const staffCard = document.getElementById('staffCard');

    // Student Comment: Secondary switcher element references (M365 vs ID & Password)
    const btnM365Option = document.getElementById('btnM365Option');
    const btnIdPassOption = document.getElementById('btnIdPassOption');
    const m365View = document.getElementById('m365View');
    const idPassView = document.getElementById('idPassView');

    // Footer dynamically updated text reference
    const footerDynamicNote = document.getElementById('footerDynamicNote');

    /*
      Student Note: Switch view to 'Customer'
      Hides staff card and shows customer login options
    */
    btnCustomerRole.addEventListener('click', () => {
        btnCustomerRole.classList.add('active');
        btnStaffRole.classList.remove('active');

        customerCard.style.display = 'block';
        staffCard.style.display = 'none';
        
        // Show redirect notice if on M365 tab
        if (m365View.classList.contains('active')) {
            footerDynamicNote.style.display = 'block';
        }
    });

    /*
      Student Note: Switch view to 'Staff' (Image 3 state)
      Hides customer card and presents direct staff login
    */
    btnStaffRole.addEventListener('click', () => {
        btnStaffRole.classList.add('active');
        btnCustomerRole.classList.remove('active');

        staffCard.style.display = 'block';
        customerCard.style.display = 'none';

        // Hide redirected notice on staff view
        footerDynamicNote.style.display = 'none';
    });

    /*
      Student Note: Switch customer option to 'Microsoft 365' (Image 1 state)
    */
    btnM365Option.addEventListener('click', () => {
        btnM365Option.classList.add('active');
        btnIdPassOption.classList.remove('active');

        m365View.classList.add('active');
        idPassView.classList.remove('active');

        footerDynamicNote.style.display = 'block';
    });

    /*
      Student Note: Switch customer option to 'ID & Password' (Image 2 state)
    */
    btnIdPassOption.addEventListener('click', () => {
        btnIdPassOption.classList.add('active');
        btnM365Option.classList.remove('active');

        idPassView.classList.add('active');
        m365View.classList.remove('active');

        // Text dynamically changes per screenshot 2
        footerDynamicNote.style.display = 'block';
        footerDynamicNote.textContent = 'Use the Student ID and password issued by STI College Global City';
    });

    /*
      Student Note: Add visibility toggle for password fields
    */
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');
    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const input = icon.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                icon.setAttribute('data-lucide', 'eye-off');
            } else {
                input.type = 'password';
                icon.setAttribute('data-lucide', 'eye');
            }
            lucide.createIcons();
        });
    });

});