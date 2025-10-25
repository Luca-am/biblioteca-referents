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

        // When clicking a CD, expand it and "pick it up" with a 3D animation.
        cd.addEventListener('click', (e) => {
            // If this CD is already picked, open the detail immediately
            if (this.activeCD === cd && this.detailPanel.classList.contains('active')) return;

            // Collapse previous active CD
            if (this.activeCD && this.activeCD !== cd) {
                this.collapseCD(this.activeCD);
            }

            // If clicking same CD that's expanded but detail closed, open detail
            if (this.activeCD === cd && !this.detailPanel.classList.contains('active')) {
                this.showDetail(referent);
                return;
            }

            // Expand and pick this CD
            this.activeCD = cd;
            cd.classList.add('active');
            // Add picked class after a tiny delay so the CSS transition runs
            requestAnimationFrame(() => cd.classList.add('picked'));

            // After the pickup animation finishes, show the detail
            const onTransitionEnd = (ev) => {
                // only trigger after transform transition on the cd
                if (ev.propertyName && ev.propertyName.includes('transform')) {
                    cd.removeEventListener('transitionend', onTransitionEnd);
                    this.showDetail(referent);
                }
            };
            cd.addEventListener('transitionend', onTransitionEnd);
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
            // collapse active CD if any
            if (this.activeCD) this.collapseCD(this.activeCD);
        });
    }

    collapseCD(cd) {
        if (!cd) return;
        cd.classList.remove('picked');
        // wait for picked->active transform animation then remove active
        setTimeout(() => cd.classList.remove('active'), 200);
        if (this.activeCD === cd) this.activeCD = null;
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
        const cdWidth = 140; // Ample del CD més el gap
        const shelfWidth = totalCDs * cdWidth;
        this.container.style.width = shelfWidth + 'px';
    }
}

// Inicialitzar quan es carregui la pàgina
window.addEventListener('load', () => {
    new BibliotecaReferents();
});