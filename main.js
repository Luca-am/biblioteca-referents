class BibliotecaReferents {
    constructor() {
        this.bookshelf = document.getElementById('bookshelf');
        this.detail = document.getElementById('book-detail');
        this.detailClose = this.detail ? this.detail.querySelector('.detail-close') : null;
        this.detailCover = document.getElementById('book-cover');
        this.detailTitle = document.getElementById('book-title');
        this.detailExtra = document.getElementById('book-extra');
        this.activeBook = null;

        this.colorTones = ['sunrise', 'forest', 'berry', 'ocean', 'rose', 'sand'];
        this.heightPool = [210, 220, 190, 200, 180, 230];

        this.buildShelves(3);
        this.renderBooks();
        this.registerGlobalEvents();
    }

    buildShelves(totalShelves) {
        this.shelfRows = [];
        const shelves = Math.max(totalShelves, 1);

        for (let i = 0; i < shelves; i += 1) {
            const row = document.createElement('div');
            row.className = 'shelf-row';

            const booksRow = document.createElement('div');
            booksRow.className = 'books-row';
            booksRow.setAttribute('role', 'list');

            const plank = document.createElement('div');
            plank.className = 'shelf-plank';

            row.appendChild(booksRow);
            row.appendChild(plank);
            this.bookshelf.appendChild(row);

            this.shelfRows.push(booksRow);
        }
    }

    renderBooks() {
        if (!Array.isArray(referents) || referents.length === 0) {
            this.populateDecorativeBooks();
            return;
        }

        const perShelf = Math.max(Math.ceil(referents.length / this.shelfRows.length), 1);

        referents.forEach((referent, index) => {
            const shelfIndex = Math.min(this.shelfRows.length - 1, Math.floor(index / perShelf));
            const shelf = this.shelfRows[shelfIndex];
            if (!shelf) return;
            const book = this.createBook(referent, index);
            shelf.appendChild(book);
        });

        this.populateDecorativeBooks(perShelf);
    }

    createBook(referent, index) {
        const book = document.createElement('button');
        book.type = 'button';
        book.className = 'book';
        book.dataset.index = index.toString();
        book.dataset.tone = this.colorTones[index % this.colorTones.length];
        book.setAttribute('role', 'listitem');
        book.setAttribute('aria-label', referent.nom);
        book.textContent = referent.nom;

        const height = this.heightPool[index % this.heightPool.length];
        const tilt = (Math.random() * 8 - 4).toFixed(2);
        book.style.setProperty('--book-height', `${height}px`);
        book.style.setProperty('--tilt', `${tilt}deg`);

        book.addEventListener('click', () => this.handleBookSelection(referent, book));

        return book;
    }

    createDecorBook() {
        const decor = document.createElement('div');
        decor.className = 'book book--decor';
        decor.setAttribute('aria-hidden', 'true');
        const tone = this.colorTones[Math.floor(Math.random() * this.colorTones.length)];
        const height = this.heightPool[Math.floor(Math.random() * this.heightPool.length)];
        const tilt = (Math.random() * 6 - 3).toFixed(2);

        decor.dataset.tone = tone;
        decor.style.setProperty('--book-height', `${height}px`);
        decor.style.setProperty('--tilt', `${tilt}deg`);

        return decor;
    }

    populateDecorativeBooks(targetPerShelf = 4) {
        const minimum = Math.max(targetPerShelf, 5);
        this.shelfRows.forEach((row) => {
            const currentBooks = row.querySelectorAll('.book');
            const needed = Math.max(minimum - currentBooks.length, 0);
            for (let i = 0; i < needed; i += 1) {
                row.appendChild(this.createDecorBook());
            }
        });
    }

    handleBookSelection(referent, bookElement) {
        if (this.activeBook === bookElement && this.detail.classList.contains('open')) {
            this.closeDetail();
            return;
        }

        if (this.activeBook) {
            this.activeBook.classList.remove('book--active');
        }

        this.activeBook = bookElement;
        this.activeBook.classList.add('book--active');

        this.renderDetail(referent);
        this.detail.classList.add('open');
    }

    renderDetail(referent) {
        this.detailTitle.textContent = referent.nom || '';
        this.renderExtraInfo(referent);
        this.updateCoverImage(referent);
    }

    renderExtraInfo(referent) {
        const fragments = [];

        if (referent.frase) {
            fragments.push(`<p><em>"${referent.frase}"</em></p>`);
        }

        if (referent.resum) {
            fragments.push(`<p>${referent.resum}</p>`);
        }

        if (referent.categoria) {
            fragments.push(`<p><strong>Categoria:</strong> ${referent.categoria}</p>`);
        }

        if (referent.link) {
            fragments.push(`<p><a href="${referent.link}" target="_blank" rel="noopener noreferrer">Mes informacio</a></p>`);
        }

        this.detailExtra.innerHTML = fragments.join('') || '<p>Selecciona un llibre de la prestatgeria per veure els detalls.</p>';
    }

    updateCoverImage(referent) {
        const src = referent.imatge ? `images/${referent.imatge}` : '';

        if (!src) {
            this.detailCover.removeAttribute('src');
            this.detailCover.alt = '';
            this.detailCover.classList.add('is-placeholder');
            return;
        }

        this.detailCover.classList.remove('is-placeholder');
        this.detailCover.src = src;
        this.detailCover.alt = referent.nom || '';
        this.detailCover.onerror = () => {
            this.detailCover.classList.add('is-placeholder');
            this.detailCover.removeAttribute('src');
        };
    }

    registerGlobalEvents() {
        if (this.detailClose) {
            this.detailClose.addEventListener('click', () => this.closeDetail());
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeDetail();
            }
        });
    }

    closeDetail() {
        if (this.activeBook) {
            this.activeBook.classList.remove('book--active');
            this.activeBook = null;
        }
        this.detail.classList.remove('open');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new BibliotecaReferents();
});

