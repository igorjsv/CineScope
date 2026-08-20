// --- 1. CONFIGURAÇÕES E CONSTANTES ---
const API_KEY = '69467d5f797d8a07b3afb209961e30f1';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

const GENEROS_MAP = {
  28: 'Ação', 12: 'Aventura', 16: 'Animação', 35: 'Comédia',
  80: 'Crime', 99: 'Documentário', 18: 'Drama', 10751: 'Família',
  14: 'Fantasia', 36: 'História', 27: 'Terror', 10402: 'Música',
  9648: 'Mistério', 10749: 'Romance', 878: 'Ficção Científica',
  10770: 'Cinema TV', 53: 'Suspense', 10752: 'Guerra', 37: 'Faroeste'
};

// Variáveis de controle de estado
let paginaAtual = 1;
let termoAtual = '';
let generoAtual = '';
let ordenacaoAtual = 'popularity.desc';
let heroMovieId = null;
let currentModalMovieId = null;

// --- 2. SELEÇÃO DE ELEMENTOS DO DOM ---
const movieGrid = document.querySelector('.movie-grid');
const heroImage = document.querySelector('.hero-media img');
const movieTitle = document.querySelector('.hero-content .titulo');
const movieOverview = document.querySelector('.hero-overview');
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const btnLoadMore = document.querySelector('#btn-load-more');
const genreButtons = document.querySelectorAll('.genre-btn');
const sortSelect = document.querySelector('#sort-select');
const btnHeroDetails = document.querySelector('.btn-primary');
const btnHeroFavorite = document.querySelector('.btn-secondary');

// Elementos do Modal
const modal = document.querySelector('#movie-modal');
const btnCloseModal = document.querySelector('#btn-close-modal');
const modalMediaContainer = document.querySelector('#modal-media-container');
const modalTitle = document.querySelector('#modal-title');
const modalRating = document.querySelector('#modal-rating');
const modalYear = document.querySelector('#modal-year');
const modalRuntime = document.querySelector('#modal-runtime');
const modalGenres = document.querySelector('#modal-genres');
const modalOverview = document.querySelector('#modal-overview');
const btnModalFavorite = document.querySelector('#btn-modal-favorite');

// --- 3. BIBLIOTECA LENIS (SMOOTH SCROLL) ---
const lenis = new Lenis({
  duration: 1.6,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 1.0,
});

function atualizarBlurCards() {
  const cards = document.querySelectorAll('.movie-card');
  const alturaTela = window.innerHeight;

  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const distanciaBase = alturaTela - rect.top;

    const blur = Math.max(0, 8 - (distanciaBase / 30));
    const opacidade = Math.min(1, distanciaBase / 220);

    card.style.filter = `blur(${blur}px)`;
    card.style.opacity = opacidade;
  });
}

lenis.on('scroll', (e) => {
  if (heroImage) {
    heroImage.style.transform = `translateY(${e.scroll * 0.3}px)`;
  }
  atualizarBlurCards();
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// --- 4. FUNÇÕES DE LOCALSTORAGE (FAVORITOS) ---
function getFavoritos() {
  const salvos = localStorage.getItem('cinescope_favoritos');
  return salvos ? JSON.parse(salvos) : [];
}

function alternarFavorito(filmeId) {
  let favoritos = getFavoritos();
  const idNumero = Number(filmeId);

  if (favoritos.includes(idNumero)) {
    favoritos = favoritos.filter(id => id !== idNumero);
  } else {
    favoritos.push(idNumero);
  }

  localStorage.setItem('cinescope_favoritos', JSON.stringify(favoritos));
  return favoritos.includes(idNumero);
}

function atualizarBotaoFavorito(btn, filmeId) {
  if (!btn) return;
  const favoritos = getFavoritos();
  const isFavorito = favoritos.includes(Number(filmeId));

  btn.classList.remove('fav-pop');
  void btn.offsetWidth;
  btn.classList.add('fav-pop');

  if (isFavorito) {
    btn.textContent = '✓ Na Minha Lista';
    btn.style.backgroundColor = '#107c41';
  } else {
    btn.textContent = '+ Adicionar à lista';
    btn.style.backgroundColor = '#3B0201';
  }
}

// --- 5. FUNÇÕES DE RENDERIZAÇÃO E SKELETON ---
function renderizarSkeletons(quantidade = 8) {
  movieGrid.innerHTML = '';
  btnLoadMore.style.display = 'none';

  for (let i = 0; i < quantidade; i++) {
    const skeleton = document.createElement('div');
    skeleton.classList.add('skeleton-card');
    skeleton.innerHTML = `
      <div class="skeleton-poster skeleton"></div>
      <div class="skeleton-info">
        <div class="skeleton-title skeleton"></div>
        <div class="skeleton-rating skeleton"></div>
      </div>
    `;
    movieGrid.appendChild(skeleton);
  }
}

function renderizarFilmes(listaFilmes, limpar = true) {
  if (limpar) {
    movieGrid.innerHTML = '';
  }

  if (listaFilmes.length === 0 && limpar) {
    movieGrid.innerHTML = '<p style="color: #fff; font-size: 18px; grid-column: 1 / -1; text-align: center;">Nenhum filme encontrado 😢</p>';
    btnLoadMore.style.display = 'none';
    return;
  }

  if (generoAtual === 'favoritos') {
    btnLoadMore.style.display = 'none';
  } else {
    btnLoadMore.style.display = 'block';
  }

  listaFilmes.forEach(filme => {
    if (!filme.poster_path) return;
    const card = document.createElement('div');
    card.classList.add('movie-card');
    card.dataset.id = filme.id;
    card.innerHTML = `
      <img src="${IMAGE_BASE_URL}${filme.poster_path}" alt="${filme.title}">
      <div class="movie-info">
        <h3>${filme.title}</h3>
        <span>⭐ ${filme.vote_average ? filme.vote_average.toFixed(1) : 'N/A'}</span>
      </div>
    `;
    movieGrid.appendChild(card);
  });

  atualizarBlurCards();
}

// --- 6. REQUISIÇÕES DA API TMDB ---
async function fetchHeroMovie() {
  const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=pt-BR&page=1`);
  const dados = await response.json();
  const filmeDestaque = dados.results[0];

  heroMovieId = filmeDestaque.id;
  heroImage.src = `${BACKDROP_BASE_URL}${filmeDestaque.backdrop_path}`;
  movieTitle.textContent = filmeDestaque.title;
  movieOverview.textContent = filmeDestaque.overview;

  const badgeGenero = document.querySelector('.genero');
  if (badgeGenero && filmeDestaque.genre_ids && filmeDestaque.genre_ids.length > 0) {
    badgeGenero.textContent = GENEROS_MAP[filmeDestaque.genre_ids[0]] || 'Filme';
  }

  document.querySelector('.avaliacao').textContent = `⭐ ${filmeDestaque.vote_average.toFixed(1)}`;
  document.querySelector('.ano').textContent = filmeDestaque.release_date.slice(0, 4);

  atualizarBotaoFavorito(btnHeroFavorite, heroMovieId);
}

async function aplicarFiltros(page = 1) {
  if (page === 1) renderizarSkeletons(8);

  let url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=pt-BR&sort_by=${ordenacaoAtual}&page=${page}`;

  if (generoAtual && generoAtual !== 'favoritos') {
    url += `&with_genres=${generoAtual}`;
  }

  if (ordenacaoAtual === 'vote_average.desc') {
    url += `&vote_count.gte=300`;
  }

  const response = await fetch(url);
  const dados = await response.json();

  if (page === 1) {
    renderizarFilmes(dados.results, true);
    lenis.scrollTo('.catalog-section', { offset: -50, duration: 1.2 });
  } else {
    renderizarFilmes(dados.results, false);
  }
}

async function searchMovies(query, page = 1) {
  if (page === 1) renderizarSkeletons(8);

  const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=${page}`);
  const dados = await response.json();

  if (page === 1) {
    renderizarFilmes(dados.results, true);
    lenis.scrollTo('.catalog-section', { offset: -50, duration: 1.2 });
  } else {
    renderizarFilmes(dados.results, false);
  }
}

async function carregarMinhaLista() {
  const favoritos = getFavoritos();
  btnLoadMore.style.display = 'none';

  if (favoritos.length === 0) {
    movieGrid.innerHTML = '<p style="color: #fff; font-size: 18px; grid-column: 1 / -1; text-align: center;">Sua lista está vazia! Adicione filmes clicando no botão da Hero ou no modal do filme. ⭐</p>';
    return;
  }

  renderizarSkeletons(favoritos.length);

  const promessas = favoritos.map(id =>
    fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=pt-BR`).then(res => res.json())
  );

  const filmesDetalhados = await Promise.all(promessas);
  renderizarFilmes(filmesDetalhados, true);
  lenis.scrollTo('.catalog-section', { offset: -50, duration: 1.2 });
}

// --- 7. MODAL COM TRAILER E DETALHES ---
async function abrirModalFilme(filmeId) {
  currentModalMovieId = filmeId;

  const resDetalhes = await fetch(`${BASE_URL}/movie/${filmeId}?api_key=${API_KEY}&language=pt-BR`);
  const filme = await resDetalhes.json();

  const resVideos = await fetch(`${BASE_URL}/movie/${filmeId}/videos?api_key=${API_KEY}&language=pt-BR`);
  let dadosVideos = await resVideos.json();

  if (!dadosVideos.results || dadosVideos.results.length === 0) {
    const resEn = await fetch(`${BASE_URL}/movie/${filmeId}/videos?api_key=${API_KEY}&language=en-US`);
    dadosVideos = await resEn.json();
  }

  const trailer = dadosVideos.results.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));

  if (trailer) {
    modalMediaContainer.innerHTML = `
      <iframe 
        src="https://www.youtube.com/embed/${trailer.key}?autoplay=1" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    `;
  } else if (filme.backdrop_path) {
    modalMediaContainer.innerHTML = `<img src="${BACKDROP_BASE_URL}${filme.backdrop_path}" alt="${filme.title}">`;
  } else {
    modalMediaContainer.innerHTML = `<img src="${IMAGE_BASE_URL}${filme.poster_path}" alt="${filme.title}">`;
  }

  modalTitle.textContent = filme.title;
  modalRating.textContent = `⭐ ${filme.vote_average ? filme.vote_average.toFixed(1) : 'N/A'}`;
  modalYear.textContent = filme.release_date ? filme.release_date.slice(0, 4) : 'N/A';
  modalRuntime.textContent = filme.runtime ? `${filme.runtime} min` : '';
  modalOverview.textContent = filme.overview || 'Sinopse não disponível.';

  modalGenres.innerHTML = '';
  if (filme.genres) {
    filme.genres.forEach(g => {
      const tag = document.createElement('span');
      tag.classList.add('genre-tag');
      tag.textContent = g.name;
      modalGenres.appendChild(tag);
    });
  }

  atualizarBotaoFavorito(btnModalFavorite, currentModalMovieId);
  modal.classList.remove('hidden');
}

function fecharModal() {
  modal.classList.add('hidden');
  modalMediaContainer.innerHTML = '';
  currentModalMovieId = null;
}

// --- 8. EVENT LISTENERS ---

// Busca
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const termo = searchInput.value.trim();
  paginaAtual = 1;
  genreButtons.forEach((b) => b.classList.remove('active'));

  if (termo) {
    termoAtual = termo;
    generoAtual = '';
    searchMovies(termoAtual, paginaAtual);
  } else {
    termoAtual = '';
    aplicarFiltros(paginaAtual);
  }
});

// Dropdown de Ordenação
sortSelect.addEventListener('change', (e) => {
  ordenacaoAtual = e.target.value;
  paginaAtual = 1;
  termoAtual = '';
  searchInput.value = '';
  if (generoAtual !== 'favoritos') {
    aplicarFiltros(paginaAtual);
  }
});

// Botão "Ver detalhes" da Hero
btnHeroDetails.addEventListener('click', () => {
  if (heroMovieId) {
    abrirModalFilme(heroMovieId);
  }
});

// Botão "Adicionar à lista" da Hero
btnHeroFavorite.addEventListener('click', () => {
  if (heroMovieId) {
    alternarFavorito(heroMovieId);
    atualizarBotaoFavorito(btnHeroFavorite, heroMovieId);

    if (generoAtual === 'favoritos') {
      carregarMinhaLista();
    }
  }
});

// Botão "Adicionar à lista" do Modal
if (btnModalFavorite) {
  btnModalFavorite.addEventListener('click', () => {
    if (currentModalMovieId) {
      alternarFavorito(currentModalMovieId);
      atualizarBotaoFavorito(btnModalFavorite, currentModalMovieId);

      if (heroMovieId === Number(currentModalMovieId)) {
        atualizarBotaoFavorito(btnHeroFavorite, heroMovieId);
      }

      if (generoAtual === 'favoritos') {
        carregarMinhaLista();
      }
    }
  });
}

// Filtro por Chips de Gênero / Minha Lista
genreButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    genreButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    generoAtual = btn.dataset.genre;
    termoAtual = '';
    searchInput.value = '';
    paginaAtual = 1;

    if (generoAtual === 'favoritos') {
      carregarMinhaLista();
    } else {
      aplicarFiltros(paginaAtual);
    }
  });
});

// Botão "Carregar Mais"
btnLoadMore.addEventListener('click', () => {
  paginaAtual++;
  if (termoAtual) {
    searchMovies(termoAtual, paginaAtual);
  } else if (generoAtual !== 'favoritos') {
    aplicarFiltros(paginaAtual);
  }
});

// Clique no card para abrir o modal
movieGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.movie-card');
  if (card && card.dataset.id) {
    abrirModalFilme(card.dataset.id);
  }
});

// Fechamento do Modal
btnCloseModal.addEventListener('click', fecharModal);

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    fecharModal();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    fecharModal();
  }
});

// --- 9. INICIALIZAÇÃO ---
fetchHeroMovie();
aplicarFiltros(paginaAtual);