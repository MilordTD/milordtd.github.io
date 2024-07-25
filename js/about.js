document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.section');
    const menuIcon = document.querySelector('.menu-icon');
    const popupMenu = document.querySelector('.popup-menu');
    
    const images = {
        K: '/images/k.png',
        A: '/images/a.png',
        R: '/images/r.png',
        H: '/images/h.png',
        A2: '/images/a2.png',
        T: '/images/t.png'
    };

    sections.forEach(section => {
    const id = section.id;
    section.addEventListener('mouseover', () => {
        section.style.backgroundImage = `url(${images[id]})`;
        createFairyDust(section);
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

    function createFairyDust(section) {
    const letter = section.querySelector('h2');
    const rect = letter.getBoundingClientRect();

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.classList.add('fairy-dust');
        
        const size = Math.random() * 8 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        const startX = rect.left + rect.width * Math.random();
        const startY = rect.top + rect.height * Math.random();
        
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;
        
        const endX = (Math.random() - 0.5) * 100;
        particle.style.setProperty('--endX', `${endX}px`);
        
        const duration = Math.random() * 2 + 1;
        particle.style.animation = `fairyDustAnimation ${duration}s ease-out`;
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            document.body.removeChild(particle);
        }, duration * 1000);
    }
}
});