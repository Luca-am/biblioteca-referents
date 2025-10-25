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
            <div class="cd-spine">${referent.nom}</div>
            <div class="cd-front" style="background-image: url('images/${referent.imatge}')"></div>
        `;
        // assign a color from the palette (cycle)
        const color = this.palette[idx % this.palette.length] || this.palette[this._colorIndex++ % this.palette.length];
        const front = cd.querySelector('.cd-front');
        // default to the color as background; if the image loads we'll replace it
        front.style.backgroundColor = color;

        // ensure spine text is readable by picking white or black depending on color luminance
        const spine = cd.querySelector('.cd-spine');
        spine.style.color = this.getContrastColor(color);

        // Preload image; if it loads, set as background-image. If it fails, keep solid color.
        const imgUrl = `images/${referent.imatge}`;
        const img = new Image();
        img.onload = () => {
            // use background-image for the front
            front.style.backgroundImage = `url('${imgUrl}')`;
            front.style.backgroundColor = 'transparent';
        };
        img.onerror = () => {
            // keep the solid color; optionally add a subtle pattern or initials
            front.style.backgroundImage = 'none';
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

            // store original rect so we can animate back
            cd._orig.rect = rect;

            // force paint
            void cd.offsetWidth;

            // target size and position (center-left, slightly up)
            const targetW = Math.min(420, window.innerWidth * 0.4);
            const targetH = targetW; // square cover area
            const targetLeft = Math.round(window.innerWidth * 0.6 - targetW / 2);
            const targetTop = Math.round(window.innerHeight * 0.25);

            // animate via transition of left/top/width/height and transform
            const durStr = getComputedStyle(document.documentElement).getPropertyValue('--animation-duration') || '0.45s';
            const dur = parseFloat(durStr.replace('s','')) * 1000 + 50;
            cd.style.transition = `left ${dur}ms ease, top ${dur}ms ease, width ${dur}ms ease, height ${dur}ms ease, transform ${dur}ms ease`;

            // show cover while animating
            cd.classList.add('active');
            // set cover visible for this element
            const frontEl = cd.querySelector('.cd-front');
            frontEl.style.display = 'block';

            // start animation to center
            requestAnimationFrame(() => {
                cd.style.left = targetLeft + 'px';
                cd.style.top = targetTop + 'px';
                cd.style.width = targetW + 'px';
                cd.style.height = targetH + 'px';
                cd.style.transform = 'rotateY(-12deg)';
                cd.classList.add('picked');
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
        cd.classList.remove('picked');
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
            // ensure front is visible for transition
            const front = cd.querySelector('.cd-front');
            front.style.display = 'block';

            cd.style.transition = `left ${dur}ms ease, top ${dur}ms ease, width ${dur}ms ease, height ${dur}ms ease, transform ${dur}ms ease`;
            // animate to original position/size
            requestAnimationFrame(() => {
                cd.style.left = origRect.left + 'px';
                cd.style.top = origRect.top + 'px';
                cd.style.width = origRect.width + 'px';
                cd.style.height = origRect.height + 'px';
                cd.style.transform = 'none';
                cd.classList.remove('picked');
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
                // hide front in-shelf
                front.style.display = '';
                cd.classList.remove('active');
                if (this.activeCD === cd) this.activeCD = null;
            }, dur + 30);
        } else {
            // fallback: just remove classes
            cd.classList.remove('picked');
            cd.classList.remove('active');
            cd.style.position = '';
            cd.style.left = '';
            cd.style.top = '';
            cd.style.width = '';
            cd.style.height = '';
            cd.style.zIndex = '';
            if (this.activeCD === cd) this.activeCD = null;
        }
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
        // spine width + gap: match CSS (.cd width + gap from .cd-container)
        const cdWidth = 28 + 8; // 28px spine + 8px gap
        const shelfWidth = Math.max(this.container.clientWidth, totalCDs * cdWidth);
        this.container.style.minWidth = shelfWidth + 'px';
    }
}

// Inicialitzar quan es carregui la pàgina
window.addEventListener('load', () => {
    new BibliotecaReferents();
});