// URL para o seu arquivo JSON.
// SE VOCÊ ESTIVER USANDO GITHUB PAGES PARA O SEU PROJETO INTEIRO,
// a URL deve ser APENAS 'videos.json' ou './videos.json' se estiver na mesma pasta.
// SE VOCÊ ESTÁ TENTANDO BUSCAR DE 'raw.githubusercontent.com' de um DOMÍNIO DIFERENTE,
// CUIDADO: ISSO GERALMENTE É BLOQUEADO POR POLÍTICAS CORS DO NAVEGADOR.
// A URL abaixo assume que 'videos.json' está na mesma origem (Ex: GitHub Pages do seu repo).
const VIDEOS_DATA_URL = 'https://raw.githubusercontent.com/Diegocostasp/dddd/refs/heads/main/videos.json'; // Caminho relativo se tudo estiver no GitHub Pages

let videosData = []; // Inicializa como array vazio, será preenchido via fetch

// Confirmação de que o script está sendo carregado e em execução
console.log("script.js carregado e em execução!");

const videoFeedContainer = document.getElementById('videoFeedContainer');
const searchInput = document.getElementById('searchInput');
const bottomNav = document.getElementById('bottomNav');
const categoryOverlay = document.getElementById('categoryOverlay');
const categoryList = document.getElementById('categoryList');
const closeCategoryOverlayBtn = document.getElementById('closeCategoryOverlay');

let currentCategory = 'Todos'; // Categoria padrão
let currentSearchTerm = ''; // Termo de busca padrão
let currentView = 'home'; // 'home', 'categories', 'saved'

// Intersection Observer para gerenciar a reprodução de vídeo automaticamente
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const videoElement = entry.target.querySelector('video');
        if (videoElement) {
            if (entry.isIntersecting) {
                videoElement.play().catch(e => console.error("Erro ao tocar vídeo:", e));
                // Atualiza o ícone do botão de mudo/desmudo
                const muteUnmuteBtn = entry.target.querySelector('.mute-unmute-btn');
                const volumeUpIcon = muteUnmuteBtn.querySelector('.volume-up-icon');
                const volumeOffIcon = muteUnmuteBtn.querySelector('.volume-off-icon');
                if (videoElement.muted) {
                    volumeUpIcon.classList.add('hidden');
                    volumeOffIcon.classList.remove('hidden');
                } else {
                    volumeUpIcon.classList.remove('hidden');
                    volumeOffIcon.classList.add('hidden');
                }
            } else {
                videoElement.pause();
                videoElement.currentTime = 0; // Reinicia o vídeo para o início
            }
        }
    });
}, {
    threshold: 0.7 // Dispara quando 70% do vídeo está visível
});

/**
 * Função para carregar os dados dos vídeos do arquivo JSON.
 */
async function loadVideosData() {
    try {
        const response = await fetch(VIDEOS_DATA_URL); // Tenta carregar o JSON
        if (!response.ok) {
            // Se a resposta não for OK (por exemplo, 404, ou erro de CORS sem resposta válida)
            throw new Error(`Erro HTTP! status: ${response.status} ao carregar ${VIDEOS_DATA_URL}. Verifique as permissões CORS se estiver buscando de uma origem diferente.`);
        }
        videosData = await response.json();
        console.log("Dados de vídeos carregados com sucesso:", videosData);

        // Após carregar os dados, renderiza os vídeos e as categorias
        filterAndRenderVideos();
        generateCategoryButtonsForOverlay();

        // Rola para o primeiro vídeo após a renderização para ativar o IntersectionObserver
        if (videoFeedContainer.firstElementChild) {
            videoFeedContainer.firstElementChild.scrollIntoView({ behavior: 'auto' });
        }
    } catch (error) {
        console.error("Não foi possível carregar os dados dos vídeos:", error);
        videoFeedContainer.innerHTML = `
            <div class="video-section text-center text-red-400 flex items-center justify-center p-4">
                <p class="text-xl">Erro ao carregar vídeos: <br>${error.message}.<br> Por favor, verifique o console do navegador e as configurações de CORS.</p>
            </div>
        `;
    }
}

/**
 * Renderiza as seções de vídeo com base nos vídeos filtrados.
 * @param {Array} videos - O array de objetos de vídeo a serem renderizados.
 */
function renderVideos(videos) {
    // Pausa e desobserva todos os vídeos atualmente renderizados antes de recarregar
    videoFeedContainer.querySelectorAll('.video-section').forEach(section => {
        const videoElement = section.querySelector('video');
        if (videoElement) {
            observer.unobserve(section); // Para de observar seções antigas
            videoElement.pause();
            videoElement.currentTime = 0;
        }
    });

    videoFeedContainer.innerHTML = ''; // Limpa os vídeos anteriores
    if (videos.length === 0) {
        videoFeedContainer.innerHTML = `
            <div class="video-section text-center text-gray-400 flex items-center justify-center p-4">
                <p class="text-xl">Nenhum vídeo encontrado para a sua pesquisa ou categoria.</p>
            </div>
        `;
        return;
    }

    videos.forEach(video => {
        const videoSection = document.createElement('div');
        videoSection.className = 'video-section';
        videoSection.innerHTML = `
            <video id="video-${video.id}" src="${video.url}" loop preload="auto" muted></video>
            <div class="video-overlay">
                <div class="video-info">
                    <h2 class="text-2xl font-bold mb-2 text-white">${video.title}</h2>
                    <p class="text-lg text-gray-200 mb-2 truncate">${video.description}</p>
                    <span class="inline-block bg-red-600 text-white text-sm px-3 py-1 rounded-full font-medium shadow-md">${video.category}</span>
                </div>
            </div>
            <div class="video-controls-overlay">
                <button class="play-pause-btn control-button p-3 rounded-full flex items-center justify-center shadow-lg">
                    <svg class="play-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    <svg class="pause-icon hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
                <button class="mute-unmute-btn control-button p-3 rounded-full flex items-center justify-center shadow-lg">
                    <svg class="volume-up-icon ${video.muted ? 'hidden' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                    <svg class="volume-off-icon ${video.muted ? '' : 'hidden'}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .93-.2 1.8-.52 2.6L20 17.1V6.9l-1.52 1.52c.32.8.52 1.67.52 2.6zm-13.67-2.53L1.5 7.08 3 5.5l.59.59 1.94 1.94L3 9v6h4l5 5v-6.92L16.51 21l1.49-1.49-16.17-16.2zM12 4L7 9H3v6h4l5 5V4z"/></svg>
                </button>
                <button class="like-button control-button p-3 rounded-full flex items-center justify-center shadow-lg" data-video-id="${video.id}">
                    <svg class="w-8 h-8 ${video.liked ? 'liked-icon' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${video.liked ? 'currentColor' : 'none'}" stroke="${video.liked ? 'none' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </button>
                <button class="control-button p-3 rounded-full flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/></svg>
                </button>
                <button class="control-button p-3 rounded-full flex items-center justify-center shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.52.48 1.2.77 1.96.77 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L7.94 11.02c-.52-.48-1.2-.77-1.96-.77-1.66 0-3 1.34-3 3s1.34 3 3 3c.76 0 1.44-.3 1.96-.77l7.05 4.11c-.05.23-.09.46-.09.7 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/></svg>
                </button>
            </div>
        `;
        videoFeedContainer.appendChild(videoSection);
        observer.observe(videoSection); // Começa a observar a nova seção

        // Adiciona listeners de evento para reproduzir/pausar, silenciar/ativar som e curtir
        const videoElement = videoSection.querySelector('video');
        const playPauseBtn = videoSection.querySelector('.play-pause-btn');
        const muteUnmuteBtn = videoSection.querySelector('.mute-unmute-btn');
        const likeButton = videoSection.querySelector('.like-button');

        playPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePlayPause(videoElement, playPauseBtn.querySelector('.play-icon'), playPauseBtn.querySelector('.pause-icon'));
        });

        muteUnmuteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMuteUnmute(videoElement, muteUnmuteBtn.querySelector('.volume-up-icon'), muteUnmuteBtn.querySelector('.volume-off-icon'));
        });

        likeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLike(video.id, likeButton.querySelector('svg'));
        });
    });
}

/**
 * Alterna o estado de reprodução/pausa de um vídeo.
 */
function togglePlayPause(videoElement, playIcon, pauseIcon) {
    if (videoElement.paused) {
        videoElement.play().catch(e => console.error("Erro ao tocar vídeo:", e));
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    } else {
        videoElement.pause();
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    }
}

/**
 * Alterna o estado de mudo/desmudo de um vídeo.
 */
function toggleMuteUnmute(videoElement, volumeUpIcon, volumeOffIcon) {
    videoElement.muted = !videoElement.muted;
    if (videoElement.muted) {
        volumeUpIcon.classList.add('hidden');
        volumeOffIcon.classList.remove('hidden');
    } else {
        volumeUpIcon.classList.remove('hidden');
        volumeOffIcon.classList.add('hidden');
    }
}

/**
 * Alterna o estado de curtida de um vídeo.
 */
function toggleLike(videoId, likeIconSvg) {
    const video = videosData.find(v => v.id === videoId);
    if (video) {
        video.liked = !video.liked;
        if (video.liked) {
            likeIconSvg.classList.add('liked-icon');
            likeIconSvg.setAttribute('fill', 'currentColor');
            likeIconSvg.setAttribute('stroke', 'none');
        } else {
            likeIconSvg.classList.remove('liked-icon');
            likeIconSvg.setAttribute('fill', 'none');
            likeIconSvg.setAttribute('stroke', 'currentColor');
        }
    }
    // Se estiver na view 'Salvos', talvez precise renderizar novamente
    if (currentView === 'saved') {
        filterAndRenderVideos();
    }
}

/**
 * Filtra os vídeos com base na categoria atual e no termo de busca,
 * ou mostra apenas os salvos, e então re-renderiza o feed.
 */
function filterAndRenderVideos() {
    let filteredVideos = videosData;

    if (currentView === 'home') {
        // Filtra por categoria, se não for 'Todos'
        if (currentCategory !== 'Todos') {
            filteredVideos = filteredVideos.filter(video => video.category === currentCategory);
        }
        // Aplica filtro de busca
        if (currentSearchTerm) {
            const lowerCaseSearchTerm = currentSearchTerm.toLowerCase();
            filteredVideos = filteredVideos.filter(video =>
                video.title.toLowerCase().includes(lowerCaseSearchTerm) ||
                video.description.toLowerCase().includes(lowerCaseSearchTerm) ||
                video.category.toLowerCase().includes(lowerCaseSearchTerm)
            );
        }
    } else if (currentView === 'saved') {
        filteredVideos = videosData.filter(video => video.liked);
    }
    // Se for a view de categorias, não filtra o feed principal, apenas mostra o modal.

    renderVideos(filteredVideos);
}

/**
 * Gera os botões de categoria dinamicamente para o overlay.
 */
function generateCategoryButtonsForOverlay() {
    categoryList.innerHTML = ''; // Limpa categorias existentes
    // Adiciona a categoria 'Todos' explicitamente no overlay
    const allCategoryButton = document.createElement('button');
    allCategoryButton.className = `category-button w-full px-5 py-2 rounded-full font-medium shadow-sm ${'Todos' === currentCategory ? 'active' : ''}`;
    allCategoryButton.setAttribute('data-category', 'Todos');
    allCategoryButton.textContent = 'Para Você (Todos)';
    categoryList.appendChild(allCategoryButton);


    const categories = new Set(videosData.map(video => video.category));
    categories.forEach(category => {
        // Evita duplicar a categoria 'Todos'
        if (category === 'Todos') return;

        const button = document.createElement('button');
        button.className = `category-button w-full px-5 py-2 rounded-full font-medium shadow-sm ${category === currentCategory ? 'active' : ''}`;
        button.setAttribute('data-category', category);
        button.textContent = category;
        categoryList.appendChild(button);
    });

    // Adiciona listener de evento aos botões de categoria no overlay
    categoryList.addEventListener('click', (event) => {
        const targetButton = event.target.closest('button');
        if (targetButton) {
            currentCategory = targetButton.getAttribute('data-category');
            currentView = 'home'; // Volta para a home ao selecionar categoria
            filterAndRenderVideos();
            hideCategoryOverlay(); // Esconde o overlay após selecionar
            updateBottomNavActiveButton('home'); // Ativa o botão Home
        }
    });
}

/**
 * Mostra o overlay de categorias.
 */
function showCategoryOverlay() {
    categoryOverlay.style.display = 'flex'; // Exibe com flexbox
    setTimeout(() => {
        categoryOverlay.classList.add('show');
    }, 10); // Pequeno delay para a transição funcionar
    generateCategoryButtonsForOverlay(); // Gera os botões cada vez que abre
}

/**
 * Esconde o overlay de categorias.
 */
function hideCategoryOverlay() {
    categoryOverlay.classList.remove('show');
    setTimeout(() => {
        categoryOverlay.style.display = 'none';
    }, 300); // Tempo da transição
}

/**
 * Atualiza o botão ativo na barra de navegação inferior.
 */
function updateBottomNavActiveButton(action) {
    document.querySelectorAll('#bottomNav .nav-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`#bottomNav .nav-button[data-action="${action}"]`).classList.add('active');
}

// --- Event Listeners Globais ---

// Listener para a barra de navegação inferior
bottomNav.addEventListener('click', (event) => {
    const targetButton = event.target.closest('.nav-button');
    if (targetButton) {
        const action = targetButton.getAttribute('data-action');
        updateBottomNavActiveButton(action);

        if (action === 'home') {
            currentView = 'home';
            currentCategory = 'Todos'; // Reseta categoria ao ir para Home
            currentSearchTerm = ''; // Reseta busca ao ir para Home
            searchInput.value = ''; // Limpa o input de busca
            filterAndRenderVideos();
        } else if (action === 'categories') {
            showCategoryOverlay();
        } else if (action === 'saved') {
            currentView = 'saved';
            filterAndRenderVideos();
        }
    }
});

// Listener para o input de busca
searchInput.addEventListener('input', (event) => {
    currentSearchTerm = event.target.value.trim();
    currentView = 'home'; // Ao buscar, volta para a view Home
    updateBottomNavActiveButton('home');
    filterAndRenderVideos();
});

// Listener para fechar o overlay de categorias
closeCategoryOverlayBtn.addEventListener('click', hideCategoryOverlay);

// Renderização inicial quando a página carrega
// Usamos DOMContentLoaded para garantir que o HTML esteja completamente carregado antes de manipular o DOM
document.addEventListener('DOMContentLoaded', function() {
    loadVideosData(); // Carrega os dados dos vídeos ao iniciar
});
