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
            createParticles(section);
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

    function createParticles(section) {
        const letter = section.querySelector('h2');
        const rect = letter.getBoundingClientRect();

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            const size = Math.random() * 5 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            const startX = rect.left + rect.width * Math.random();
            const startY = rect.top + rect.height * Math.random();
            
            particle.style.left = `${startX}px`;
            particle.style.top = `${startY}px`;
            
            particle.style.animation = `particleAnimation ${Math.random() * 1 + 0.5}s ease-out`;
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                document.body.removeChild(particle);
            }, 1500);
        }
    }
});