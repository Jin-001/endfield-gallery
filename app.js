const gallery = document.querySelector('#gallery');
const viewer = document.querySelector('#viewer');
let photos = [...window.PHOTOS];
const hero = window.PHOTOS.find(photo => photo.name === 'ENDFIELD_SHARE_1793026161') || window.PHOTOS[0];
if (hero) document.querySelector('.hero-image').src = hero.src;
let current = 0;
let opener;
function render() {
  gallery.replaceChildren();
  document.querySelector('.hero-bottom > span:last-child').textContent = `${photos.length} FRAMES`;
  document.querySelector('.toolbar b').textContent = photos.length;
  document.querySelector('.collection-heading > p').firstChild.textContent = `${photos.length} 張影像，一段旅程。`;
  document.querySelector('footer > span:nth-child(3)').textContent = `01 — ${photos.length}`;
  photos.forEach((photo, index) => {
    const figure = document.createElement('figure');
    figure.className = 'photo';
    const button = document.createElement('button');
    button.setAttribute('aria-label', `檢視相片 ${index + 1}`);
    const img = document.createElement('img');
    img.src = photo.src; img.alt = `Endfield 探索攝影 ${photo.name}`;
    img.loading = 'lazy'; img.decoding = 'async'; img.width = 1920; img.height = 1183;
    button.append(img);
    button.addEventListener('click', () => { opener = button; current = index; showPhoto(); viewer.showModal(); });
    const caption = document.createElement('figcaption');
    const number = document.createElement('span'); number.textContent = `FRAME ${String(index + 1).padStart(2, '0')}`;
    const name = document.createElement('span'); name.textContent = photo.name.replace('ENDFIELD_SHARE_', 'ENDFIELD / ');
    caption.append(number, name); figure.append(button, caption); gallery.append(figure);
  });
}
function showPhoto() {
  const photo = photos[current];
  const img = document.querySelector('#full-photo'); img.src = photo.src; img.alt = `Endfield 攝影：${photo.name}`;
  document.querySelector('#counter').textContent = `${String(current + 1).padStart(2, '0')} / ${photos.length}`;
  document.querySelector('#photo-name').textContent = photo.name;
  document.querySelector('#original').href = photo.original || photo.src;
}
function step(delta) { current = (current + delta + photos.length) % photos.length; showPhoto(); }
document.querySelector('#previous').addEventListener('click', () => step(-1));
document.querySelector('#next').addEventListener('click', () => step(1));
document.querySelector('#close').addEventListener('click', () => viewer.close());
viewer.addEventListener('close', () => opener?.focus());
viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
document.addEventListener('keydown', event => { if (!viewer.open) return; if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); } if (event.key === 'ArrowRight') { event.preventDefault(); step(1); } });
let touchX = null;
viewer.addEventListener('touchstart', event => { touchX = event.changedTouches[0].screenX; }, {passive:true});
viewer.addEventListener('touchend', event => { if (touchX !== null) { const delta = event.changedTouches[0].screenX - touchX; if (Math.abs(delta) > 60) step(delta > 0 ? -1 : 1); touchX = null; } }, {passive:true});
document.querySelector('#sort').addEventListener('change', event => { photos = [...window.PHOTOS]; if (event.target.value === 'new') photos.reverse(); render(); });
render();
