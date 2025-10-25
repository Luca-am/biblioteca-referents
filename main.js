class BibliotecaReferents {
    constructor() {
        this.container = document.getElementById('cd-container');
        this.detailPanel = document.getElementById('cd-detail');
        this.cdTitle = document.getElementById('cd-title');
        this.cdDescription = document.getElementById('cd-description');
        this.cdCoverImage = document.getElementById('cd-cover-image');
        this.setupCloseButton();
        this.init();
    }

    init() {
        this.renderCDs();
        this.adjustShelfSize();
        window.addEventListener('resize', () => this.adjustShelfSize());
    }

    renderCDs() {
        referents.forEach(referent => {
            const cd = this.createCD(referent);
            this.container.appendChild(cd);
        });
    }

    createCD(referent) {
        const cd = document.createElement('div');
        cd.className = 'cd';
        cd.innerHTML = `
            <div class="cd-spine">${referent.nom}</div>
            <div class="cd-front" style="background-image: url('images/${referent.imatge}')"></div>
        `;
        
        let activeCD = null;
        cd.addEventListener('click', (e) => {
            if (activeCD && activeCD !== cd) {
                activeCD.classList.remove('active');
            }
            if (cd.classList.contains('active')) {
                this.showDetail(referent);
            } else {
                cd.classList.add('active');
                activeCD = cd;
            }
        });
        return cd;
    }

    showDetail(referent) {
        this.cdTitle.textContent = referent.nom;
        this.cdDescription.innerHTML = `
            <p><em>"${referent.frase}"</em></p>
            <p>${referent.resum}</p>
            <p>Categoria: ${referent.categoria}</p>
            <p><a href="${referent.link}" target="_blank">Més informació</a></p>
        `;
        this.cdCoverImage.src = `images/${referent.imatge}`;
        this.cdCoverImage.alt = referent.nom;
        this.detailPanel.classList.add('active');
    }

    setupCloseButton() {
        const closeButton = this.detailPanel.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            this.detailPanel.classList.remove('active');
        });
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