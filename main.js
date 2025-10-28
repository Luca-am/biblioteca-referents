class BibliotecaReferents {
    constructor() {
        this.bookshelf = document.getElementById('bookshelf');
        this.detail = document.getElementById('book-detail');
        this.detailClose = this.detail ? this.detail.querySelector('.detail-close') : null;
        this.detailCoverWrapper = this.detail ? this.detail.querySelector('.detail-cover') : null;
        this.detailCover = document.getElementById('book-cover');
        this.detailTitle = document.getElementById('book-title');
        this.detailExtra = document.getElementById('book-extra');
        this.activeBook = null;

        this.toneNames = ['sunrise', 'forest', 'berry', 'ocean', 'rose', 'sand'];
        this.toneFallbacks = {
            sunrise: '#f0eeea',
            forest: '#ebe6dd',
            berry: '#f3f0e8',
            ocean: '#e1ded6',
            rose: '#f5f2eb',
            sand: '#e9e4dc'
        };
        this.heightPool = [210, 220, 200, 195, 185, 230];

        this.buildShelves(2);
        this.renderBooks();
        this.registerGlobalEvents();
    }

    buildShelves(totalShelves) {
        if (!this.bookshelf) return;
        this.bookshelf.innerHTML = '';
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
        if (!this.shelfRows || this.shelfRows.length === 0) return;

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
        const tone = this.toneNames[index % this.toneNames.length];
        const height = this.heightPool[index % this.heightPool.length];
        const lean = (Math.random() * 6 - 3).toFixed(2);
        const initials = this.getInitials(referent.nom);

        const book = document.createElement('button');
        book.type = 'button';
        book.className = 'book';
        book.dataset.index = index.toString();
        book.dataset.tone = tone;
        book.setAttribute('role', 'listitem');
        book.setAttribute('aria-label', referent.nom);
        book.setAttribute('aria-expanded', 'false');
        book.title = referent.nom;

        book.style.setProperty('--book-height', `${height}px`);
        book.style.setProperty('--lean', `${lean}deg`);

        const inner = document.createElement('span');
        inner.className = 'book-inner';

        const spine = document.createElement('span');
        spine.className = 'book-spine';

        const spineTitle = document.createElement('span');
        spineTitle.className = 'book-title';
        spineTitle.textContent = referent.nom;
        spine.appendChild(spineTitle);

        const cover = document.createElement('span');
        cover.className = 'book-cover';

        const fallback = document.createElement('span');
        fallback.className = 'book-cover-fallback';
        fallback.textContent = initials;
        cover.appendChild(fallback);

        inner.appendChild(spine);
        inner.appendChild(cover);
        book.appendChild(inner);

        const fallbackColor = this.toneFallbacks[tone] || '#e9e4dc';
        cover.style.backgroundColor = fallbackColor;

        if (referent.imatge) {
            const imgUrl = `images/${referent.imatge}`;
            const img = new Image();
            img.onload = () => {
                cover.style.backgroundImage = `url('${imgUrl}')`;
                cover.classList.add('has-image');
            };
            img.onerror = () => {
                cover.style.backgroundImage = '';
                cover.classList.remove('has-image');
            };
            img.src = imgUrl;
        }

        book.addEventListener('click', () => this.handleBookSelection(referent, book));

        return book;
    }

    createDecorBook() {
        const tone = this.toneNames[Math.floor(Math.random() * this.toneNames.length)];
        const height = this.heightPool[Math.floor(Math.random() * this.heightPool.length)];
        const lean = (Math.random() * 5 - 2.5).toFixed(2);

        const decor = document.createElement('div');
        decor.className = 'book book--decor';
        decor.dataset.tone = tone;
        decor.setAttribute('aria-hidden', 'true');
        decor.style.setProperty('--book-height', `${height}px`);
        decor.style.setProperty('--lean', `${lean}deg`);

        const inner = document.createElement('span');
        inner.className = 'book-inner';

        const spine = document.createElement('span');
        spine.className = 'book-spine';

        const title = document.createElement('span');
        title.className = 'book-title';
        spine.appendChild(title);

        inner.appendChild(spine);
        decor.appendChild(inner);

        return decor;
    }

    populateDecorativeBooks(targetPerShelf = 4) {
        if (!this.shelfRows) return;
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
        if (!bookElement) return;

        if (this.activeBook === bookElement) {
            this.closeDetail();
            return;
        }

        if (this.activeBook) {
            this.activeBook.classList.remove('book--active', 'book--open');
            this.activeBook.setAttribute('aria-expanded', 'false');
        }

        this.activeBook = bookElement;
        this.activeBook.classList.add('book--active', 'book--open');
        this.activeBook.setAttribute('aria-expanded', 'true');
        if (typeof this.activeBook.focus === 'function') {
            try {
                this.activeBook.focus({ preventScroll: true });
            } catch (error) {
                this.activeBook.focus();
            }
        }

        this.renderDetail(referent, bookElement);
        if (this.detail) {
            this.detail.classList.add('open');
        }
    }

    renderDetail(referent, bookElement) {
        const tone = bookElement ? bookElement.dataset.tone : '';

        if (this.detail) {
            if (tone) {
                this.detail.dataset.tone = tone;
            } else {
                delete this.detail.dataset.tone;
            }
        }

        if (this.detailTitle) {
            this.detailTitle.textContent = referent.nom || '';
        }

        this.renderExtraInfo(referent);
        this.updateCoverImage(referent, tone);
    }

    renderExtraInfo(referent) {
        if (!this.detailExtra) return;

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

    updateCoverImage(referent, tone) {
        if (!this.detailCover) return;
        const fallback = this.toneFallbacks[tone] || '#d0c5b2';

        if (this.detailCoverWrapper) {
            if (fallback) {
                this.detailCoverWrapper.style.background = `repeating-linear-gradient(45deg, ${fallback} 0, ${fallback} 14px, #f9f6ef 14px, #f9f6ef 20px)`;
            } else {
                this.detailCoverWrapper.style.background = '';
            }
        }

        if (!referent.imatge) {
            this.detailCover.removeAttribute('src');
            this.detailCover.alt = '';
            this.detailCover.classList.add('is-placeholder');
            return;
        }

        const src = `images/${referent.imatge}`;
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
            this.activeBook.classList.remove('book--active', 'book--open');
            this.activeBook.setAttribute('aria-expanded', 'false');
            this.activeBook = null;
        }

        if (this.detail) {
            this.detail.classList.remove('open');
            delete this.detail.dataset.tone;
        }

        if (this.detailTitle) {
            this.detailTitle.textContent = '';
        }

        if (this.detailExtra) {
            this.detailExtra.innerHTML = '<p>Selecciona un llibre de la prestatgeria per veure els detalls.</p>';
        }

        if (this.detailCoverWrapper) {
            this.detailCoverWrapper.style.background = '';
        }

        if (this.detailCover) {
            this.detailCover.classList.add('is-placeholder');
            this.detailCover.removeAttribute('src');
            this.detailCover.alt = '';
        }
    }

    getInitials(name = '') {
        if (!name) return '';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        const first = parts[0][0];
        const last = parts[parts.length - 1][0];
        return `${first}${last}`.toUpperCase();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new BibliotecaReferents();
});
