document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.section');
    const menuIcon = document.querySelector('.menu-icon');
    const popupMenu = document.querySelector('.popup-menu');
    
    const images = {
        K: '/images/pin_photo_1.png',
        A: '/images/pin_photo_2.png',
        R: '/images/pin_photo_3.png',
        H: '/images/pin_photo_4.png',
        A2: '/images/pin_photo_1.png',
        T: '/images/pin_photo_2.png'
    };

    sections.forEach(section => {
        const id = section.id;
        section.addEventListener('mouseover', () => {
            section.style.backgroundImage = `url(${images[id]})`;
        });
        section.addEventListener('mouseout', () => {
            section.style.backgroundImage = 'none';
        });
    });

    // Toggle popup menu
    menuIcon.addEventListener('click', () => {
        popupMenu.style.display = popupMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Close popup menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!menuIcon.contains(event.target) && !popupMenu.contains(event.target)) {
            popupMenu.style.display = 'none';
        }
    });
});