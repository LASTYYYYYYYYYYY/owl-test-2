import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@3.1.0/+esm";

console.log("Deck Shuffler: Loaded");

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const METADATA_DECK_LOCATION_KEY = "com.chatgpt.deckshuffler/deckLocation";
const METADATA_IS_DECK_CARD_KEY = "com.chatgpt.deckshuffler/isDeckCard";

OBR.onReady(async () => {
    const shuffleButton = document.getElementById("shuffle");
    const offsetSlider = document.getElementById("offsetSlider");
    const offsetValueSpan = document.getElementById("offsetValue");
    const rememberDeckLocationCheckbox = document.getElementById("rememberDeckLocation");
    const deckLocationDisplay = document.getElementById("deckLocationDisplay");

    // Инициализация значения ползунка и отображение
    offsetValueSpan.textContent = offsetSlider.value;

    offsetSlider.addEventListener("input", () => {
        offsetValueSpan.textContent = offsetSlider.value;
    });

    // Функция для обновления отображения места колоды
    const updateDeckLocationDisplay = async () => {
        const metadata = await OBR.room.getMetadata();
        const deckLocation = metadata[METADATA_DECK_LOCATION_KEY];
        if (deckLocation) {
            deckLocationDisplay.textContent = `Место колоды: X:${deckLocation.x.toFixed(0)}, Y:${deckLocation.y.toFixed(0)}`;
        } else {
            deckLocationDisplay.textContent = "Место колоды не задано";
        }
    };

    // Обновляем при загрузке
    await updateDeckLocationDisplay();

    // Слушатель для изменений метаданных комнаты
    OBR.room.onMetadataChange(updateDeckLocationDisplay);

    shuffleButton.addEventListener("click", async () => {
        try {
            const cardOffset = parseInt(offsetSlider.value, 10);
            const metadata = await OBR.room.getMetadata();
            let savedDeckLocation = metadata[METADATA_DECK_LOCATION_KEY];

            let targetX, targetY;
            let cardsToProcess = [];
            let currentSelection = await OBR.player.getSelection();

            if (rememberDeckLocationCheckbox.checked || !savedDeckLocation) {
                // Сценарий 1: Запоминаем новое место колоды ИЛИ место еще не задано
                if (!currentSelection || currentSelection.length === 0) {
                    alert("Пожалуйста, выберите карты, чтобы запомнить новое место колоды.");
                    rememberDeckLocationCheckbox.checked = false; // Сбрасываем чекбокс
                    return;
                }

                const selectedItems = await OBR.scene.items.getItems(currentSelection);
                cardsToProcess = selectedItems.filter(i => i.position);
                if (cardsToProcess.length === 0) {
                    alert("Пожалуйста, выберите карты, чтобы запомнить новое место колоды.");
                    rememberDeckLocationCheckbox.checked = false; // Сбрасываем чекбокс
                    return;
                }

                // Определяем якорь из текущего выделения
                targetX = Math.min(...cardsToProcess.map(t => t.position.x));
                targetY = Math.min(...cardsToProcess.map(t => t.position.y));
                await OBR.room.setMetadata({
                    [METADATA_DECK_LOCATION_KEY]: { x: targetX, y: targetY }
                });
                savedDeckLocation = { x: targetX, y: targetY }; // Обновляем локальную переменную
                console.log(`Deck location remembered: X:${targetX.toFixed(0)}, Y:${targetY.toFixed(0)}`);
                rememberDeckLocationCheckbox.checked = false; // Сбрасываем чекбокс после запоминания
            } else {
                // Сценарий 2: Используем уже запомненное место колоды, ищем помеченные карты
                targetX = savedDeckLocation.x;
                targetY = savedDeckLocation.y;
                console.log(`Using remembered deck location: X:${targetX.toFixed(0)}, Y:${targetY.toFixed(0)}`);
                
                // Ищем все карты на сцене с меткой нашей колоды
                const allItems = await OBR.scene.items.getAllItems();
                cardsToProcess = allItems.filter(item => item.metadata[METADATA_IS_DECK_CARD_KEY] && item.position);

                if (cardsToProcess.length === 0) {
                    // Если помеченных карт нет, но место колоды есть, то просим выделить
                    if (!currentSelection || currentSelection.length === 0) {
                        alert("Место колоды задано, но нет помеченных карт. Пожалуйста, выберите карты для первоначального добавления в колоду.");
                        return;
                    }
                    const selectedItems = await OBR.scene.items.getItems(currentSelection);
                    cardsToProcess = selectedItems.filter(i => i.position);
                    if (cardsToProcess.length === 0) {
                         alert("Место колоды задано, но нет помеченных карт. Пожалуйста, выберите карты для первоначального добавления в колоду.");
                         return;
                    }
                    console.log("No marked deck cards found, using current selection to start new deck.");
                }
            }

            if (cardsToProcess.length === 0) {
                alert("Нет карт для обработки. Пожалуйста, выберите карты или сначала задайте место колоды.");
                return;
            }

            // Перемешиваем массив ID обрабатываемых карт
            const cardIdsToUpdate = shuffleArray(cardsToProcess.map(card => card.id));

            // Массовое обновление
            await OBR.scene.items.updateItems(cardIdsToUpdate, (drafts) => {
                const uniqueZIndexes = new Set(); 
                
                drafts.forEach((item, index) => {
                    if (item.position) {
                        // Устанавливаем координаты на целевое место
                        item.position = {
                            x: targetX,
                            y: targetY + (index * cardOffset) 
                        };

                        // Помечаем карту как часть колоды, если она еще не помечена
                        if (item.metadata[METADATA_IS_DECK_CARD_KEY] !== true) {
                            item.metadata[METADATA_IS_DECK_CARD_KEY] = true;
                        }

                        let newZIndex = index;
                        while(uniqueZIndexes.has(newZIndex)) {
                            newZIndex += 0.0001; 
                        }
                        item.zIndex = newZIndex;
                        uniqueZIndexes.add(newZIndex);
                    }
                });
            });

            console.log(`Deck shuffled and positioned with offset: ${cardOffset}! Total cards processed: ${cardsToProcess.length}`);
            await updateDeckLocationDisplay(); // Обновляем отображение
        } catch (error) {
            console.error("Shuffle Error:", error);
        }
    });
});
