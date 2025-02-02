const apiUrl = 'https://genshin.jmp.blue'; 

let currentPageNew = 0;
const pageSizeNew = 9;
let isLoadingNew = false;

async function loadCardsNew() {
    try {
        // Лог до выполнения запроса
        console.log('Загружаем избранные персонажи...');

        // Получаем список избранных персонажей из вашего API
        const favoriteCharactersResponse = await fetch('https://localhost:7287/getCharacter', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`, // Используем правильный синтаксис
            },
        });

        // Логируем статус ответа
        console.log('Статус ответа от API:', favoriteCharactersResponse.status);

        if (!favoriteCharactersResponse.ok) {
            throw new Error('Ошибка получения избранных персонажей');
        }

        const favoriteCharacters = await favoriteCharactersResponse.json();
        console.log('Полученные персонажи:', favoriteCharacters); // Логируем полученные данные
        const cardsContainer = document.getElementById('cards-container-client');
        cardsContainer.innerHTML = ''; // Очищаем контейнер перед добавлением новых карточек
        isLoadingNew = false;

        await loadNextPageNew(favoriteCharacters, cardsContainer);

        window.addEventListener('scroll', () => handleScrollNew(favoriteCharacters, cardsContainer));
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

async function loadNextPageNew(favoriteCharacters, cardsContainer) {
    if (isLoadingNew) return;

    isLoadingNew = true;

    const fragment = document.createDocumentFragment();
    const startIndex = currentPageNew * pageSizeNew;
    const endIndex = startIndex + pageSizeNew;
    const currentData = favoriteCharacters.slice(startIndex, endIndex);

    console.log('Загружаем следующую страницу: с', startIndex, 'по', endIndex); // Логируем, какую часть данных загружаем

    if (currentData.length === 0) {
        console.log('Все карточки загружены');
        window.removeEventListener('scroll', () => handleScrollNew(favoriteCharacters, cardsContainer));
        return;
    }

    const imagePromises = currentData.map(async (item) => {
        console.log('Загружаем изображение для персонажа:', item); // Логируем персонажа

        const url = apiUrl + "/characters/" + item.toString() + "/card"; // Предположим, что ID используется в пути
        const imgSrc = await fetch(url);
        const imgBlob = await imgSrc.blob();
        const imgUrl = URL.createObjectURL(imgBlob);

        const card = document.createElement('div');
        card.classList.add('card');
        card.style.cursor = 'pointer';

        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = item;
        card.appendChild(img);

        const title = document.createElement('h3');
        title.textContent = item;
        card.appendChild(title);

        const heartContainer = document.createElement('div');
        heartContainer.classList.add('heart-container');
        const heartButton = document.createElement('button');
        heartButton.classList.add('heart-button')
        heartButton.innerHTML = '❤️'; // Заполненное сердечко
        heartButton.title = 'Удалить из избранного';

        heartButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Предотвращаем открытие модального окна при клике на сердечко
            removeFromFavorites(item, heartButton, card);
        });

        heartContainer.appendChild(heartButton);
        card.appendChild(heartContainer);
        card.addEventListener('click', () => openCharacterModalNew(item, imgUrl));

        fragment.appendChild(card);
    });

    await Promise.all(imagePromises);

    cardsContainer.appendChild(fragment);

    currentPageNew++;
    isLoadingNew = false;
    console.log('Карточки добавлены на страницу');
}
async function removeFromFavorites(characterName, heartButton, card) {
    const response = await fetch('https://localhost:7287/dislike', {
        method: 'POST',
        headers: {
            'Authorization':`Bearer ${ localStorage.getItem('access_token') }`, // Правильный синтаксис для Bearer
        'Content-Type': 'application/json' // Указываем правильный тип контента
        },
        body: JSON.stringify({ name: characterName })  // Передаем имя персонажа
    });

    if (response.ok) {
        console.log(`Персонаж ${ characterName } удалён из избранного`);
        card.remove();  // Удаляем карточку с экрана
    } else {
        console.error('Не удалось удалить персонажа из избранного');
    }
}
function handleScrollNew(favoriteCharacters, cardsContainer) {
    // Логируем, когда происходит прокрутка
    console.log('Прокручиваем страницу...');

    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && !isLoadingNew) {
        loadNextPageNew(favoriteCharacters, cardsContainer);
    }
}


async function openCharacterModalNew(characterName, img) {
    try {
        console.log('Открытие модального окна для персонажа:', characterName); // Логируем открытие модального окна

        const response = await fetch(apiUrl + `/characters/${characterName}?lang=en`);
        const data = await response.json();

        console.log('Данные для модального окна:', data); // Логируем данные для модального окна

        document.getElementById('modal-title').textContent = data.name;
        document.getElementById('modal-image').src = img;
        document.getElementById('modal-image').alt = data.name;
        document.getElementById('character-title').textContent = data.title;
        document.getElementById('character-element').textContent = data.vision;
        document.getElementById('character-rarity').textContent = data.rarity;
        document.getElementById('character-weapon').textContent = data.weapon;
        document.getElementById('character-nation').textContent = data.nation;

        const talentsContainer = document.getElementById('talents');
        talentsContainer.innerHTML = '';
        data.skillTalents.forEach(talent => {
            talentsContainer.innerHTML += `
                <div class="talent">
                    <p><strong>Name:</strong> ${talent.name}</p>
                    <p><strong>Unlock:</strong> ${talent.unlock}</p>
                    <p>${talent.description}</p>
                </div>
                <hr />
            `;
        });

        const passiveTalentsContainer = document.getElementById('passive-talents');
        passiveTalentsContainer.innerHTML = '';
        data.passiveTalents.forEach(talent => {
            passiveTalentsContainer.innerHTML += `
                <div class="passive-talent">
                    <p><strong>Name:</strong> ${talent.name}</p>
                    <p><strong>Unlock:</strong> ${talent.unlock}</p>
                    <p>${talent.description}</p>
                </div>
                <hr />
            `;
        });
        const materialsContainer = document.getElementById('ascension-materials');
        materialsContainer.innerHTML = ''; // Очищаем контейнер перед добавлением данных
        for (const [level, materials] of Object.entries(data.ascension_materials)) {
            materialsContainer.innerHTML += `
                <div class="ascension-level">
                    <p><strong>${level}:</strong></p>
                    <ul>
                        ${materials
                    .map(material => `<li>${material.name}: ${material.value}</li>`)
                    .join('')}
                    </ul>
                </div>
            `;
        }

        $('#character-modal').modal('show');
    } catch (error) {
        console.error('Ошибка при загрузке данных персонажа:', error);
    }
}
document.getElementById('logout-button').addEventListener('click', function () {
    // Очистим контейнер с карточками
    const cardsContainer = document.getElementById('cards-container-client');
    cardsContainer.innerHTML = '';

    currentPageNew = 0; // Сбрасываем текущую страницу
    isLoadingNew = false;
    localStorage.removeItem("access_token");
    window.location.href = "/Home/Auth";
});
document.addEventListener('DOMContentLoaded', loadCardsNew);
