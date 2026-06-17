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
    const setDeckLocationButton = document.getElementById("setDeckLocation");
    const deckLocationDisplay = document.getElementById("deckLocationDisplay");
    const collectCardsButton = document.getElementById("collectCards");

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
            collectCardsButton.disabled = false; // Активируем кнопку сбора карт
        } else {
            deckLocationDisplay.textContent = "Место колоды не задано";
            collectCardsButton.disabled = true; // Деактивируем кнопку сбора карт
        }
    };

    // Обновляем при загрузке
    await updateDeckLocationDisplay();

    // Слушатель для изменений метаданных комнаты (если место колоды изменится другим способом)
    OBR.room.onMetadataChange(updateDeckLocationDisplay);

    shuffleButton.addEventListener("click", async () => {
        try {
            const selection = await OBR.player.getSelection();
            if (!selection || selection.length === 0) return;

            const items = await OBR.scene.items.getItems(selection);
            const tokens = items.filter(i => i.position);
            if (tokens.length === 0) return;

            const cardOffset = parseInt(offsetSlider.value, 10);

            // 1. Фиксируем точку якоря (самый верхний левый угол выделения)
            const anchorX = Math.min(...tokens.map(t => t.position.x));
            const anchorY = Math.min(...tokens.map(t => t.position.y));

            // 2. Перемешиваем массив ID случайным образом
            const shuffledIds = shuffleArray([...selection]);

            // 3. Массовое обновление
            await OBR.scene.items.updateItems(shuffledIds, (drafts) => {
                const uniqueZIndexes = new Set(); 
                
                drafts.forEach((item, index) => {
                    if (item.position) {
                        item.position = {
                            x: anchorX,
                            y: anchorY + (index * cardOffset) 
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

            console.log(`Deck shuffled on Y and Z axis with offset: ${cardOffset}!`);
        } catch (error) {
            console.error("Shuffle Error:", error);
        }
    });

    setDeckLocationButton.addEventListener("click", async () => {
        await OBR.tool.selectAndClick(async (pointer) => {
            const { x, y } = pointer.position;
            await OBR.room.setMetadata({
                [METADATA_DECK_LOCATION_KEY]: { x, y }
            });
            console.log(`Deck location set to X:${x.toFixed(0)}, Y:${y.toFixed(0)}`);
            await updateDeckLocationDisplay(); // Обновляем отображение сразу
        });
    });

    collectCardsButton.addEventListener("click", async () => {
        try {
            const metadata = await OBR.room.getMetadata();
            const deckLocation = metadata[METADATA_DECK_LOCATION_KEY];

            if (!deckLocation) {
                alert("Пожалуйста, сначала установите место для колоды!");
                return;
            }

            const selection = await OBR.player.getSelection();
            if (!selection || selection.length === 0) {
                alert("Пожалуйста, выберите карты для сбора.");
                return;
            }

            const items = await OBR.scene.items.getItems(selection);
            const tokens = items.filter(i => i.position);
            if (tokens.length === 0) return;

            const cardOffset = parseInt(offsetSlider.value, 10);

            // 2. Перемешиваем массив ID случайным образом
            const shuffledIds = shuffleArray([...selection]);

            // 3. Массовое обновление
            await OBR.scene.items.updateItems(shuffledIds, (drafts) => {
                const uniqueZIndexes = new Set(); 
                
                drafts.forEach((item, index) => {
                    if (item.position) {
                        // Устанавливаем координаты на заданное место колоды
                        // Смещение по Y для создания стопки
                        item.position = {
                            x: deckLocation.x,
                            y: deckLocation.y + (index * cardOffset) 
                        };

                        // ПЕРЕМЕШИВАЕМ Z-ORDER (Ось Z)
                        let newZIndex = index;
                        while(uniqueZIndexes.has(newZIndex)) {
                            newZIndex += 0.0001; 
                        }
                        item.zIndex = newZIndex;
                        uniqueZIndexes.add(newZIndex);
                    }
                });
            });

            console.log(`Selected cards collected and stacked at deck location with offset: ${cardOffset}!`);
        } catch (error) {
            console.error("Collect Cards Error:", error);
        }
    });
});
