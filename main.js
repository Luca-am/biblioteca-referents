class BibliotecaReferents {
    constructor() {
        this.container = document.getElementById('cd-container');
        this.detailPanel = document.getElementById('cd-detail');
        this.cdTitle = document.getElementById('cd-title');
        this.cdDescription = document.getElementById('cd-description');
        this.cdCoverImage = document.getElementById('cd-cover-image');
        this.activeCD = null; // track the currently expanded CD
        // Palette of bright colors to use as fallbacks when images fail
        this.palette = [
            '#ff6b6b', '#f7b267', '#ffd166', '#06d6a0', '#4ecdc4',
            '#4d96ff', '#845ef7', '#ff6fb5', '#8d99ae', '#f94144'
        ];
        this._colorIndex = 0;
        this.setupCloseButton();
        this.init();
    }

    init() {
        this.renderCDs();
        this.adjustShelfSize();
        window.addEventListener('resize', () => this.adjustShelfSize());
    }

    renderCDs() {
        referents.forEach((referent, idx) => {
            const cd = this.createCD(referent, idx);
            this.container.appendChild(cd);
        });
    }

    createCD(referent, idx) {
        const cd = document.createElement('div');
        cd.className = 'cd';
        cd.innerHTML = `
            <div class="cd-inner">
                <div class="cd-spine">${referent.nom}</div>
                <div class="cd-front" style="background-image: url('images/${referent.imatge}')"></div>
            </div>
        `;
    // assign a color from the palette (cycle)
    const color = this.palette[idx % this.palette.length] || this.palette[this._colorIndex++ % this.palette.length];
    const front = cd.querySelector('.cd-front');
    // default to the color as background; if the image loads we'll replace it
    front.style.backgroundColor = color;

    // ensure spine text is readable by picking white or black depending on color luminance
    const spine = cd.querySelector('.cd-spine');
    spine.style.color = this.getContrastColor(color);

    // give each spine a tiny random rotation to feel hand-placed
    const jitter = (Math.random() * 6) - 3; // -3deg .. 3deg
    cd.style.transform = `rotate(${jitter}deg)`;

        // Preload image; if it loads, set as background-image. If it fails, keep solid color.
        const imgUrl = `images/${referent.imatge}`;
        const img = new Image();
        img.onload = () => {
            // use background-image for the front
            front.style.backgroundImage = `url('${imgUrl}')`;
            front.style.backgroundColor = 'transparent';
            front.innerHTML = '';
        };
        img.onerror = () => {
            // keep the solid color and show initials
            front.style.backgroundImage = 'none';
            const initials = this.getInitials(referent.nom);
            front.innerHTML = `<div class="cover-initials">${initials}</div>`;
        };
        img.src = imgUrl;

        // When clicking a CD, animate it to a 'picked' fixed position (like grabbing it from a shelf)
        cd.addEventListener('click', (e) => {
            // If another CD is active, drop it back first
            if (this.activeCD && this.activeCD !== cd) {
                this.dropBack(this.activeCD);
            }

            // If this CD is already picked and detail open, do nothing
            if (this.activeCD === cd && this.detailPanel.classList.contains('active')) return;

            // If already active (expanded) but detail closed, open detail
            if (this.activeCD === cd && !this.detailPanel.classList.contains('active')) {
                this.showDetail(referent);
                return;
            }

            // Start pickup animation
            this.activeCD = cd;
            const cdInner = cd.querySelector('.cd-inner');
            // remember original inline styles to restore later
            const rect = cd.getBoundingClientRect();
            cd._orig = {
                position: cd.style.position || '',
                left: cd.style.left || '',
                top: cd.style.top || '',
                width: cd.style.width || '',
                height: cd.style.height || '',
                zIndex: cd.style.zIndex || ''
            };

            // set fixed position at same place to enable animating to center
            cd.style.position = 'fixed';
            cd.style.left = rect.left + 'px';
            cd.style.top = rect.top + 'px';
            cd.style.width = rect.width + 'px';
            cd.style.height = rect.height + 'px';
            cd.style.margin = '0';
            cd.style.zIndex = 999;

            // store original rect and transform so we can animate back
            cd._orig.rect = rect;
            cd._orig.transform = cd.style.transform || '';

            // force paint
            void cd.offsetWidth;

            // target size and position (center-left, slightly up)
            // target position: center-left "hand" area (about 35% from left)
            const shelfRect = this.container.parentElement.getBoundingClientRect();
            const shelfBasedWidth = Math.max(shelfRect.width * 0.5, 180);
            const availableInViewport = Math.max(window.innerWidth - 140, 180);
            const targetW = Math.min(400, shelfBasedWidth, availableInViewport);
            const targetH = targetW; // square cover area
            const desiredLeft = shelfRect.left + Math.min(shelfRect.width * 0.08, 80);
            const maxLeft = window.innerWidth - targetW - 40;
            const minLeft = 40;
            const targetLeft = Math.min(Math.max(desiredLeft, minLeft), maxLeft);
            const desiredTop = shelfRect.top + shelfRect.height * 0.1;
            const targetTop = Math.min(Math.max(desiredTop, 30), window.innerHeight - targetH - 40);

            // animate via transition of left/top/width/height and transform
            const durStr = getComputedStyle(document.documentElement).getPropertyValue('--animation-duration') || '0.45s';
            const dur = parseFloat(durStr.replace('s','')) * 1000 + 50;
            cd.style.transition = `left ${dur}ms ease, top ${dur}ms ease, width ${dur}ms ease, height ${dur}ms ease, transform ${dur}ms ease`;

            // start animation to center; mark as moving during animation
            requestAnimationFrame(() => {
                // reveal the front face immediately (visibility handled in CSS)
                cd.classList.add('moving');
                cd.classList.add('show-front');

                // slightly delay the flip so the front becomes visible then rotates (gives a more natural effect)
                setTimeout(() => {
                    if (cdInner) cdInner.classList.add('flipped');
                }, 45);

                // animate position/size
                cd.style.left = targetLeft + 'px';
                cd.style.top = targetTop + 'px';
                cd.style.width = targetW + 'px';
                cd.style.height = targetH + 'px';
                cd.style.transform = 'none';
            });

            // after animation ends, open detail
            setTimeout(() => this.showDetail(referent), dur + 30);
        });

        return cd;
    }

    showDetail(referent) {
        this.cdTitle.textContent = referent.nom;
        // Keep description minimal (user wanted name+image primary), but preserve available fields when present
        let html = '';
        if (referent.frase) html += `<p><em>"${referent.frase}"</em></p>`;
        if (referent.resum) html += `<p>${referent.resum}</p>`;
        if (referent.categoria) html += `<p>Categoria: ${referent.categoria}</p>`;
        if (referent.link) html += `<p><a href="${referent.link}" target="_blank">Més informació</a></p>`;
        this.cdDescription.innerHTML = html;
        this.cdCoverImage.src = `images/${referent.imatge}`;
        this.cdCoverImage.alt = referent.nom;
        this.detailPanel.classList.add('active');
    }

    setupCloseButton() {
        const closeButton = this.detailPanel.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            this.detailPanel.classList.remove('active');
            // animate active CD back into shelf if any
            if (this.activeCD) this.dropBack(this.activeCD);
        });
    }

    collapseCD(cd) {
        if (!cd) return;
        cd.classList.remove('moving');
        // wait for picked->active transform animation then remove active
        setTimeout(() => cd.classList.remove('active'), 200);
        if (this.activeCD === cd) this.activeCD = null;
    }

    dropBack(cd) {
        if (!cd) return;
        const orig = cd._orig || {};
        const origRect = orig.rect;
        const durStr = getComputedStyle(document.documentElement).getPropertyValue('--animation-duration') || '0.45s';
        const dur = parseFloat(durStr.replace('s','')) * 1000 + 50;

        // if we have the original rect, animate back to it
        if (origRect) {
            cd.style.transition = `left ${dur}ms ease, top ${dur}ms ease, width ${dur}ms ease, height ${dur}ms ease, transform ${dur}ms ease`;
            // animate to original position/size
            requestAnimationFrame(() => {
                cd.style.left = origRect.left + 'px';
                cd.style.top = origRect.top + 'px';
                cd.style.width = origRect.width + 'px';
                cd.style.height = origRect.height + 'px';
                cd.style.transform = orig.transform || '';
                cd.classList.remove('moving');
                const cdInner = cd.querySelector('.cd-inner');
                if (cdInner) cdInner.classList.remove('flipped');
            });

            // after transition, restore original styles and remove active
            setTimeout(() => {
                // restore original inline styles
                cd.style.position = orig.position || '';
                cd.style.left = orig.left || '';
                cd.style.top = orig.top || '';
                cd.style.width = orig.width || '';
                cd.style.height = orig.height || '';
                cd.style.margin = '';
                cd.style.zIndex = orig.zIndex || '';
                cd.style.transition = '';
                // restore original transform (rotation)
                cd.style.transform = orig.transform || '';
                cd.classList.remove('active');
                cd.classList.remove('show-front');
                if (this.activeCD === cd) this.activeCD = null;
            }, dur + 30);
        } else {
            // fallback: just remove classes
            cd.classList.remove('picked');
            cd.classList.remove('moving');
            cd.classList.remove('active');
            cd.classList.remove('show-front');
            cd.style.position = '';
            cd.style.left = '';
            cd.style.top = '';
            cd.style.width = '';
            cd.style.height = '';
            cd.style.zIndex = '';
            if (this.activeCD === cd) this.activeCD = null;
        }
    }

    getInitials(name) {
        if (!name) return '';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0,2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    // Simple luminance-based contrast helper: return '#fff' or '#000'
    getContrastColor(hex) {
        // remove # if present
        const h = hex.replace('#','');
        const r = parseInt(h.substring(0,2),16);
        const g = parseInt(h.substring(2,4),16);
        const b = parseInt(h.substring(4,6),16);
        // Perceived luminance
        const lum = 0.2126*r + 0.7152*g + 0.0722*b;
        return lum > 140 ? '#000' : '#fff';
    }

    adjustShelfSize() {
        const totalCDs = referents.length;
        // approximate spine width + gap to decide spacing strategy
        const cdWidth = 28 + 12; // spine plus average gap
        const containerWidth = this.container.parentElement.clientWidth || window.innerWidth;
        const requiredWidth = totalCDs * cdWidth;
        this.container.style.minWidth = '100%';
        this.container.style.justifyContent = requiredWidth < containerWidth ? 'space-evenly' : 'flex-start';
    }
}

// Inicialitzar quan es carregui la pàgina
window.addEventListener('load', () => {
    new BibliotecaReferents();
});
