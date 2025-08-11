// Controle do carrossel
document.querySelectorAll('.carousel-container').forEach(carousel => {
  const btnPrev = carousel.querySelector('.prev');
  const btnNext = carousel.querySelector('.next');

  // Ajuste: selecionar qualquer um desses IDs dentro do carousel
  const container = carousel.querySelector('#movies, #series, #seriess');
  if (!container) return; // evita erro se não achar container

  // Usando o primeiro item para calcular o tamanho do scroll
  const card = container.querySelector('.movie, .serie');
  if (!card) return;
  const cardWidth = card.offsetWidth + 24; // gap

  btnNext.addEventListener('click', () => {
    container.scrollBy({ left: cardWidth, behavior: 'smooth' });
  });

  btnPrev.addEventListener('click', () => {
    container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  });
});

// Menu mobile
document.addEventListener('DOMContentLoaded', () => {
  const mobileBtn = document.getElementById('mobile_btn');
  const mobileMenu = document.getElementById('mobile_menu');
  const icon = mobileBtn.querySelector('i');

  mobileBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    if (icon.classList.contains('fa-bars')) {
      icon.classList.replace('fa-bars', 'fa-xmark');
    } else {
      icon.classList.replace('fa-xmark', 'fa-bars');
    }
  });
});

// ScrollReveal (se estiver usando a lib ScrollReveal)
ScrollReveal().reveal('#cta', {
  origin: 'left',
  duration: 2000,
  distance: '20%',
});

ScrollReveal().reveal('#movies, #seriess', {
  origin: 'left',
  duration: 1000,
  distance: '10%',
});

// Cadastro - envio do formulário
const form = document.getElementById('form-cadastro');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const titulo = document.getElementById('titulo').value.trim();
  const genero = document.getElementById('genero').value;
  const descricao = document.getElementById('descricao').value.trim();
  const tipo = document.getElementById('tipo').value;
  const imagemInput = document.getElementById('imagem');

  if (!titulo || !genero || !descricao || !tipo) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  const formData = new FormData();
  formData.append('titulo', titulo);
  formData.append('genero', genero);
  formData.append('descricao', descricao);
  formData.append('tipo', tipo);

  if (imagemInput && imagemInput.files.length > 0) {
    formData.append('imagem', imagemInput.files[0]);
  }

  try {
    const response = await fetch('/api/filmes-series', {
      method: 'POST',
      body: formData, // navegador define multipart/form-data
    });

    const data = await response.json();

    if (response.ok) {
      alert('Cadastro realizado com sucesso!');
      form.reset();
      carregarFilmesESeries(); // Atualiza lista
    } else {
      alert('Erro: ' + data.error);
    }
  } catch (error) {
    alert('Erro ao conectar com o servidor.');
    console.error(error);
  }
});

// Função para carregar filmes e séries do backend
async function carregarFilmesESeries() {
  try {
    const response = await fetch('http://localhost:3000/api/filmes-series');
    if (!response.ok) throw new Error('Erro na requisição');
    const lista = await response.json();

    const containerFilmes = document.getElementById('movies');
    const containerSeries = document.getElementById('seriess');

    // containerFilmes.innerHTML = '';
    // containerSeries.innerHTML = '';

    lista.forEach(item => {
      const div = document.createElement('div');
      const imageSrc = item.imagem ? item.imagem : (item.tipo === 'filme' ? '/images/filme01.jpg' : '/images/serie01.jpg');

      div.classList.add(item.tipo === 'filme' ? 'movie' : 'serie');

      div.innerHTML = `
        <div class="${item.tipo === 'filme' ? 'movie_title' : 'serie_title'}">${item.titulo}</div>
        <img src="${imageSrc}" alt="${item.titulo}" class="movie_img">
        <div class="${item.tipo === 'filme' ? 'movie_genero' : 'serie_genero'}">${item.genero}</div>
        <p class="${item.tipo === 'filme' ? 'movie_description' : 'serie_description'}">${item.descricao}</p>
        <div class="voting">
          <button class="btn-default btn-like"><i class="fa-solid fa-thumbs-up"></i> Gostei</button>
          <button class="btn-default btn-dislike"><i class="fa-solid fa-thumbs-down"></i> Não Gostei</button>
        </div>
        <div class="result">
          <span class="result_yas"> (${item.votos_positivos}) Gostei</span>
          <span class="result_no"> (${item.votos_negativos}) Não Gostei</span>
          <span class="result_no">(${item.votos_negativos + item.votos_positivos}) total de votos</span>
        </div>
      `;

      // Botões de voto
      const btnLike = div.querySelector('.btn-like');
      const btnDislike = div.querySelector('.btn-dislike');

      btnLike.addEventListener('click', async () => {
        try {
          const res = await fetch(`/api/filmes-series/${item.id}/voto/positivo`, { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            div.querySelector('.result_yas').textContent = ` (${data.votos_positivos}) Gostei`;
            div.querySelector('.result_no').textContent = ` (${data.votos_negativos}) Não Gostei`;
          } else {
            alert('Erro ao registrar voto.');
          }
        } catch (error) {
          console.error('Erro ao registrar voto positivo:', error);
          alert('Erro na comunicação com o servidor.');
        }
      });

      btnDislike.addEventListener('click', async () => {
        try {
          const res = await fetch(`/api/filmes-series/${item.id}/voto/negativo`, { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            div.querySelector('.result_yas').textContent = ` (${data.votos_positivos}) Gostei`;
            div.querySelector('.result_no').textContent = ` (${data.votos_negativos}) Não Gostei`;
          } else {
            alert('Erro ao registrar voto.');
          }
        } catch (error) {
          console.error('Erro ao registrar voto negativo:', error);
          alert('Erro na comunicação com o servidor.');
        }
      });

      if (item.tipo === 'filme') {
        containerFilmes.appendChild(div);
      } else if (item.tipo === 'serie') {
        containerSeries.appendChild(div);
      }
    });
  } catch (error) {
    console.error('Erro ao carregar filmes e séries:', error);
  }
}

// Carregar filmes e séries ao carregar a página
window.addEventListener('load', carregarFilmesESeries);
