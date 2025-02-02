const apiUrl = 'https://genshin.jmp.blue'; // Замените на реальный URL вашего API

// Функция для получения данных из API и создания карточек
let currentPage = 0; // Текущая страница
const pageSize = 9; // Количество карточек на одну страницу
let isLoading = false; // Флаг загрузки, чтобы избежать повторных вызовов

async function loadCards() {
    try {
        const response = await fetch(apiUrl + '/characters');
        const data = await response.json();

        const cardsContainer = document.getElementById('cards-container');
        cardsContainer.innerHTML = ''; // Очистим контейнер перед добавлением новых карточек
        isLoading = false;
        // Загружаем первую страницу
        await loadNextPage(data, cardsContainer);

        // Добавляем обработчик прокрутки
        window.addEventListener('scroll', () => handleScroll(data, cardsContainer));
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

async function loadNextPage(data, cardsContainer) {
    if (isLoading) return; // Если уже идет загрузка, выходим

    isLoading = true; // Устанавливаем флаг загрузки

    const fragment = document.createDocumentFragment();
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    const currentData = data.slice(startIndex, endIndex); // Берем данные для текущей страницы

    if (currentData.length === 0) {
        console.log('Все карточки загружены');
        window.removeEventListener('scroll', () => handleScroll(data, cardsContainer)); // Убираем обработчик прокрутки
        return;
    }

    const imagePromises = currentData.map(async (item) => {
        const url = apiUrl + "/characters/" + item.toString() + "/card"; // Предположим, что ID используется в пути
        const imgSrc = await fetch(url); // Получаем данные изображения
        const imgBlob = await imgSrc.blob(); // Преобразуем данные в Blob
        const imgUrl = URL.createObjectURL(imgBlob); // Создаем URL для Blob-данных

        // Создаем элемент карточки
        const card = document.createElement('div');
        card.classList.add('card');
        card.style.cursor = 'pointer';

        // Добавляем изображение
        const img = document.createElement('img');
        img.src = imgUrl; // Устанавливаем URL изображения
        img.alt = item.toString();
        card.appendChild(img);

        // Добавляем название
        const title = document.createElement('h3');
        title.textContent = item.toString(); // Название персонажа или объекта
        card.appendChild(title);
        const heartContainer = document.createElement('div');
        heartContainer.classList.add('heart-container');
        const heartButton = document.createElement('button');

        const token = localStorage.getItem('access_token');
        if (token) {
            const favoriteCharactersResponse = await fetch('https://localhost:7287/getCharacter', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`, // Используем правильный синтаксис
                },
            });
            const favorites = await favoriteCharactersResponse.json();

            heartButton.classList.add('heart-button');
            heartButton.innerHTML = '♡'; // Пустое сердечко
            heartButton.title = 'Добавить в избранное';

            if (favorites.includes(item.toString())) {
                heartButton.innerHTML = '❤️'; // Заполненное сердечко
                heartButton.title = 'Удалить из избранного';
            }

            // Обработчик клика по кнопке сердечка
            heartButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Предотвращаем открытие модального окна при клике на сердечко
                toggleFavorite(item.toString(), heartButton);
            });

            // Добавляем кнопку сердечка в контейнер
            heartContainer.appendChild(heartButton);
            card.appendChild(heartContainer);
        }
        
        
        // Добавляем событие клика
        card.addEventListener('click', () => {
            openCharacterModal(item.toString(), imgUrl);
        });

        // Добавляем карточку во фрагмент
        fragment.appendChild(card);
    });

    // Ждем загрузки всех изображений
    await Promise.all(imagePromises);

    // Добавляем фрагмент в контейнер
    cardsContainer.appendChild(fragment);

    // Увеличиваем текущую страницу и снимаем флаг загрузки
    currentPage++;
    isLoading = false;
}
async function toggleFavorite(character, heartButton) {
    const favoriteCharactersResponse = await fetch('https://localhost:7287/getCharacter', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`, // Используем правильный синтаксис
        },
    });
    const favorites = await favoriteCharactersResponse.json();
    if (favorites.includes(character)) {
        const response = await fetch('https://localhost:7287/dislike', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`, // Правильный синтаксис для Bearer
                'Content-Type': 'application/json' // Указываем правильный тип контента
            },
            body: JSON.stringify({ name: character })  // Передаем имя персонажа
        });
        heartButton.innerHTML = '♡'; // Пустое сердечко
        heartButton.title = 'Добавить в избранное';
        console.log(`${character} удален из избранного`);
    } else {
        const response = await fetch('https://localhost:7287/like', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`, // Правильный синтаксис для Bearer
                'Content-Type': 'application/json' // Указываем правильный тип контента
            },
            body: JSON.stringify({ name: character })  // Передаем имя персонажа
        });
        heartButton.innerHTML = '❤️'; // Заполненное сердечко
        heartButton.title = 'Удалить из избранного';
        console.log(`${character} добавлен в избранное`);
    }

    // Сохраняем обновленный список избранного в localStorage
    localStorage.setItem('favorites', JSON.stringify(favorites));
}
function handleScroll(data, cardsContainer) {
    const scrollPosition = window.scrollY + window.innerHeight; // Текущая позиция прокрутки
    const threshold = document.body.offsetHeight - 200; // Порог в 200px от низа страницы

    if (scrollPosition >= threshold) {
        loadNextPage(data, cardsContainer); // Загружаем следующую страницу
    }
}

// Загружаем карточки при загрузке страницы


document.getElementById('reset-filter').addEventListener('click', function () {
    // Очистим контейнер с карточками
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = '';

    // Сбрасываем все чекбоксы
    document.querySelectorAll('.filter-options input').forEach(function (checkbox) {
        checkbox.checked = false;
    });
     currentPage = 0; // Сбрасываем текущую страницу
    isLoading = false;

    // Перезагружаем карточки
    loadCards();
});


document.getElementById('close-modal-header').addEventListener('click', function () {
    $('#character-modal').modal('hide');
});

// Закрытие модального окна через кнопку внизу
document.getElementById('close-modal-footer').addEventListener('click', function () {
    $('#character-modal').modal('hide');
});

async function openCharacterModal(characterName, img) {
    try {
        const response = await fetch(apiUrl + `/characters/${characterName}?lang=en`);
        const data = await response.json();

        // Заполняем основную информацию
        document.getElementById('modal-title').textContent = data.name;
        document.getElementById('modal-image').src = img;
        document.getElementById('modal-image').alt = data.name;
        document.getElementById('character-title').textContent = data.title;
        document.getElementById('character-element').textContent = data.vision;
        document.getElementById('character-rarity').textContent = data.rarity;
        document.getElementById('character-weapon').textContent = data.weapon;
        document.getElementById('character-nation').textContent = data.nation;

        // Заполняем таланты
        const talentsContainer = document.getElementById('talents');
        talentsContainer.innerHTML = ''; // Очищаем контейнер перед добавлением данных
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

        // Заполняем пассивные таланты
        const passiveTalentsContainer = document.getElementById('passive-talents');
        passiveTalentsContainer.innerHTML = ''; // Очищаем контейнер перед добавлением данных
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

        // Заполняем материалы для прокачки
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

        // Показываем модальное окно
        $('#character-modal').modal('show');
    } catch (error) {
        console.error('Ошибка при загрузке данных персонажа:', error);
    }
}



document.getElementById('search-input').addEventListener('keydown', async function (event) {
    // Проверяем, была ли нажата клавиша Enter
    if (event.key === 'Enter') {
        const searchTerm = this.value.toLowerCase(); // Получаем введенный текст и приводим его к нижнему регистру
        const cardsContainer = document.getElementById('cards-container');
        const response = await fetch(apiUrl + '/characters');
        const characters = await response.json();

        console.log("Received characters:", characters); // Логируем полученные данные

        cardsContainer.innerHTML = ''; // Очищаем контейнер карточек
        currentPage = 0; // Сбрасываем текущую страницу
        isLoading = true;

        // Если строка поиска пустая, показываем все персонажи
        if (searchTerm === '') {
            console.log("Search term is empty, displaying all characters.");
            // Добавляем все карточки, если поле поиска пустое
            await loadCards();
        } else {
            // Фильтруем персонажей по введенному поисковому запросу
            const filteredCharacters = characters.filter(character => {
                const match = character.toString().toLowerCase().startsWith(searchTerm);
                console.log(`Character ${character.toString()} matches search: ${match}`);
                return match;
            });

            console.log("Filtered characters:", filteredCharacters); // Логируем отфильтрованные данные

            // Добавляем карточки для найденных персонажей
            for (const character of filteredCharacters) {
                console.log("Creating card for character:", character);
                const card = await createCharacterCard(character);
                if (card instanceof HTMLElement) {
                    cardsContainer.appendChild(card);
                } else {
                    console.error("Card creation failed for character:", character);
                }
            }
        }
    }
});

// Функция для создания карточки персонажа
async function createCharacterCard(character) {
    try {
        console.log("Creating card for:", character);

        const url = apiUrl + "/characters/" + character.toString() + "/card"; // Предположим, что у персонажа есть поле id
        const imgSrc = await fetch(url); // Получаем данные изображения
        const imgBlob = await imgSrc.blob(); // Преобразуем данные в Blob
        const imgUrl = URL.createObjectURL(imgBlob); // Создаем URL для Blob-данных

        console.log("Image URL created:", imgUrl);

        // Создаем элемент карточки
        const card = document.createElement('div');
        card.classList.add('card');
        card.style.cursor = 'pointer';

        // Добавляем изображение
        const img = document.createElement('img');
        img.src = imgUrl;
        img.alt = character.name;
        card.appendChild(img);

        // Добавляем название
        const title = document.createElement('h3');
        title.textContent = character.toString();
        card.appendChild(title);
        const heartContainer = document.createElement('div');
        heartContainer.classList.add('heart-container');

        const heartButton = document.createElement('button');
        heartButton.classList.add('heart-button');
        heartButton.innerHTML = '♡'; // Пустое сердечко
        heartButton.title = 'Добавить в избранное';

        // Проверяем, находится ли карточка в избранном
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        if (favorites.includes(character.toString())) {
            heartButton.innerHTML = '❤️'; // Заполненное сердечко
            heartButton.title = 'Удалить из избранного';
        }

        // Обработчик клика по кнопке сердечка
        heartButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Предотвращаем открытие модального окна при клике на сердечко
            toggleFavorite(character.toString(), heartButton);
        });

        // Добавляем кнопку сердечка в контейнер
        heartContainer.appendChild(heartButton);
        card.appendChild(heartContainer);
        // Добавляем событие клика
        card.addEventListener('click', () => {
            openCharacterModal(character.toString(), imgUrl);
        });

        console.log("Card created successfully for:", character);
        return card;
    } catch (error) {
        console.error("Error while creating character card:", error);
        return null; // Возвращаем null в случае ошибки
    }
}

document.getElementById('apply-filter').addEventListener('click', async function () {
    console.log('Filter apply button clicked');

    // Получаем выбранные фильтры
    const selectedWeapons = Array.from(document.querySelectorAll('input[name="weapon"]:checked')).map(input => input.value);
    const selectedRarity = Array.from(document.querySelectorAll('input[name="rarity"]:checked')).map(input => input.value);
    const selectedElements = Array.from(document.querySelectorAll('input[name="element"]:checked')).map(input => input.value);

    console.log('Selected filters:', {
        weapons: selectedWeapons,
        rarity: selectedRarity,
        elements: selectedElements
    });

    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = ''; // Очищаем контейнер карточек
    currentPage = 0; // Сбрасываем текущую страницу
    isLoading = true;
    console.log('Cards container cleared');
    window.removeEventListener('scroll', handleScroll);
    try {
        const response = await fetch(apiUrl + '/characters');
        const characters = await response.json();
        console.log('Fetched character list:', characters);

        // Загружаем карточки персонажей, которые соответствуют фильтрам
        for (const characterName of characters) {
            console.log(`Processing character: ${characterName}`);

            const characterResponse = await fetch(apiUrl + `/characters/${characterName}?lang=en`);
            const characterData = await characterResponse.json();
            console.log(`Fetched data for ${characterName}:`, characterData);

            // Проверяем, соответствует ли персонаж фильтрам
            const matchesWeapon = selectedWeapons.length === 0 || selectedWeapons.includes(characterData.weapon);
            const matchesRarity = selectedRarity.length === 0 || selectedRarity.includes(String(characterData.rarity));
            const matchesElement = selectedElements.length === 0 || selectedElements.includes(characterData.vision);

            console.log(`Character ${characterName} filter check:`, {
                matchesWeapon,
                matchesRarity,
                matchesElement
            });

            if (matchesWeapon && matchesRarity && matchesElement) {
                console.log(`Character ${characterName} matches filters. Creating card...`);
                const card = await createCharacterCard(characterName);
                if (card instanceof HTMLElement) {
                    cardsContainer.appendChild(card);
                    console.log(`Card for ${characterName} added to the container.`);
                }
            } else {
                console.log(`Character ${characterName} does not match filters. Skipping...`);
            }
        }
    } catch (error) {
        console.error('Error fetching character list:', error);
    }
});


document.addEventListener('DOMContentLoaded', loadCards);


