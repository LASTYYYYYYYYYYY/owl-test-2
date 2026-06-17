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
            const selection = await OBR.player.getSelection();
            if (!selection || selection.length === 0) {
                alert("Пожалуйста, выберите карты для перемешивания.");
                return;
            }

            const items = await OBR.scene.items.getItems(selection);
            const tokens = items.filter(i => i.position);
            if (tokens.length === 0) return;

            const cardOffset = parseInt(offsetSlider.value, 10);

            // Определяем точку якоря
            let targetX, targetY;
            const metadata = await OBR.room.getMetadata();
            let savedDeckLocation = metadata[METADATA_DECK_LOCATION_KEY];

            if (rememberDeckLocationCheckbox.checked) {
                // Если чекбокс активен, запоминаем текущее верхнее левое положение выделения
                targetX = Math.min(...tokens.map(t => t.position.x));
                targetY = Math.min(...tokens.map(t => t.position.y));
                await OBR.room.setMetadata({
                    [METADATA_DECK_LOCATION_KEY]: { x: targetX, y: targetY }
                });
                savedDeckLocation = { x: targetX, y: targetY }; // Обновляем локальную переменную
                console.log(`Deck location remembered: X:${targetX.toFixed(0)}, Y:${targetY.toFixed(0)}`);
            } else if (savedDeckLocation) {
                // Если чекбокс неактивен, но место колоды уже есть, используем его
                targetX = savedDeckLocation.x;
                targetY = savedDeckLocation.y;
                console.log(`Using remembered deck location: X:${targetX.toFixed(0)}, Y:${targetY.toFixed(0)}`);
            } else {
                // Если чекбокс неактивен и место колоды не задано, используем текущее верхнее левое положение выделения
                targetX = Math.min(...tokens.map(t => t.position.x));
                targetY = Math.min(...tokens.map(t => t.position.y));
                console.log("No deck location remembered, shuffling within current selection.");
            }

            // Перемешиваем массив ID случайным образом
            const shuffledIds = shuffleArray([...selection]);

            // Массовое обновление
            await OBR.scene.items.updateItems(shuffledIds, (drafts) => {
                const uniqueZIndexes = new Set(); 
                
                drafts.forEach((item, index) => {
                    if (item.position) {
                        item.position = {
                            x: targetX,
                            y: targetY + (index * cardOffset) 
                        };

                        let newZIndex = index;
                        while(uniqueZIndexes.has(newZIndex)) {
                            newZIndex += 0.0001; 
                        }
                        item.zIndex = newZIndex;
                        uniqueZIndexes.add(newZIndex);
                    }
                });
            });

            console.log(`Deck shuffled and positioned with offset: ${cardOffset}!`);
            await updateDeckLocationDisplay(); // Обновляем отображение после возможного сохранения
        } catch (error) {
            console.error("Shuffle Error:", error);
        }
    });
});
