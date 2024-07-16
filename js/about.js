document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.section');
  
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
    section.style.setProperty('--bg-image', `url(${images[id]})`);
  });
});