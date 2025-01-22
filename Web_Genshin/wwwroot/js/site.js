const apiUrl = 'https://genshin.jmp.blue'; // Замените на реальный URL вашего API

// Функция для получения данных из API и создания карточек
async function loadCards() {
    try {
        const response = await fetch(apiUrl + '/characters');
        const data = await response.json();

        const cardsContainer = document.getElementById('cards-container');
        cardsContainer.innerHTML = ''; // Очистим контейнер перед добавлением новых карточек

        // Перебор полученных данных и создание карточек
        for (const item of data) {
            // Создаем элемент карточки
            const card = document.createElement('div');
            card.classList.add('card');
            card.style.cursor = 'pointer';
            // Добавляем изображение
            const img = document.createElement('img');
            const url = apiUrl + "/characters/" + item.toString() + "/card";  // Предположим, что ID используется в пути
            const imgSrc = await fetch(url); // Получаем данные изображения
            const imgBlob = await imgSrc.blob(); // Преобразуем данные в Blob
            const imgUrl = URL.createObjectURL(imgBlob);  // Создаем URL для Blob-данных
            img.src = imgUrl;  // Устанавливаем URL изображения
            img.alt = item.name;
            card.appendChild(img);

            // Добавляем название
            const title = document.createElement('h3');
            title.textContent = item.toString(); // Название персонажа или объекта
            card.appendChild(title);
            card.addEventListener('click', () => {
                openCharacterModal(item.toString(), imgSrc);
            });
            // Добавляем карточку в контейнер
            cardsContainer.appendChild(card);
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
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

    // Перезагружаем карточки
    loadCards();
});

async function openCharacterModal(characterName, img) {
    try {
        const response = await fetch(apiUrl + `/characters/${characterName}?lang=ru`);
        const data = await response.json();

        // Заполняем модальное окно данными
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        modalTitle.textContent = data.name; // Пример: имя персонажа
        modalBody.innerHTML = `
            <p class="just-text">${data.title}</p>
            <p><strong>Элемент:</strong> ${data.vision}</p>
            <p><strong>Редкость:</strong> ${data.rarity}</p>
        `;

        // Показываем модальное окно
        $('#character-modal').modal('show');
    } catch (error) {
        console.error('Ошибка при загрузке данных персонажа:', error);
    }
}
document.addEventListener('DOMContentLoaded', loadCards);