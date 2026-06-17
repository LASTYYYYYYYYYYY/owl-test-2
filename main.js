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

    offsetValueSpan.textContent = offsetSlider.value;
    offsetSlider.addEventListener("input", () => {
        offsetValueSpan.textContent = offsetSlider.value;
    });

    const updateDeckLocationDisplay = async () => {
        const roomMetadata = await OBR.room.getMetadata();
        const deckLocation = roomMetadata[METADATA_DECK_LOCATION_KEY];
        if (deckLocation) {
            deckLocationDisplay.textContent = `Место колоды: X:${deckLocation.x.toFixed(0)}, Y:${deckLocation.y.toFixed(0)}`;
        } else {
            deckLocationDisplay.textContent = "Место колоды не задано";
        }
    };

    await updateDeckLocationDisplay();
    OBR.room.onMetadataChange(updateDeckLocationDisplay); // Обновляем отображение, если место меняется

    shuffleButton.addEventListener("click", async () => {
        try {
            const cardOffset = parseInt(offsetSlider.value, 10);
            const roomMetadata = await OBR.room.getMetadata();
            let savedDeckLocation = roomMetadata[METADATA_DECK_LOCATION_KEY];

            let targetX, targetY;
            let cardsToProcessIds = [];

            // Получаем текущее выделение пользователя
            const currentManualSelectionIds = await OBR.player.getSelection();

            if (rememberDeckLocationCheckbox.checked || !savedDeckLocation) {
                // Сценарий 1: Запоминаем новое место колоды ИЛИ место еще не задано
                if (!currentManualSelectionIds || currentManualSelectionIds.length === 0) {
                    alert("Пожалуйста, выберите карты, чтобы запомнить новое место колоды.");
                    rememberDeckLocationCheckbox.checked = false;
                    return;
                }
                cardsToProcessIds = currentManualSelectionIds; // Обрабатываем текущее выделение
                
                // Определяем якорь из текущего выделения
                const selectedItemsForAnchor = await OBR.scene.items.getItems(cardsToProcessIds);
                const actualCardsForAnchor = selectedItemsForAnchor.filter(i => i.position);
                if (actualCardsForAnchor.length === 0) {
                     alert("Выделенные элементы не являются перемещаемыми картами.");
                     rememberDeckLocationCheckbox.checked = false;
                     return;
                }

                targetX = Math.min(...actualCardsForAnchor.map(t => t.position.x));
                targetY = Math.min(...actualCardsForAnchor.map(t => t.position.y));
                await OBR.room.setMetadata({
                    [METADATA_DECK_LOCATION_KEY]: { x: targetX, y: targetY }
                });
                savedDeckLocation = { x: targetX, y: targetY };
                console.log(`Deck location remembered: X:${targetX.toFixed(0)}, Y:${targetY.toFixed(0)}`);
                rememberDeckLocationCheckbox.checked = false; // Сбрасываем чекбокс после запоминания
            } else {
                // Сценарий 2: Используем уже запомненное место колоды, автоматически выделяем помеченные карты
                targetX = savedDeckLocation.x;
                targetY = savedDeckLocation.y;
                console.log(`Using remembered deck location: X:${targetX.toFixed(0)}, Y:${targetY.toFixed(0)}`);
                
                // Получаем ВСЕ элементы на сцене, чтобы найти помеченные карты
                const allItemIds = await OBR.scene.items.getAllItemIds();
                const allItems = await OBR.scene.items.getItems(allItemIds);
                
                const markedDeckCardIds = allItems
                    .filter(item => item.metadata[METADATA_IS_DECK_CARD_KEY] === true && item.position)
                    .map(item => item.id);

                // Объединяем автоматически найденные карты и текущее ручное выделение (без дубликатов)
                const combinedIdsSet = new Set([...markedDeckCardIds, ...(currentManualSelectionIds || [])]);
                cardsToProcessIds = Array.from(combinedIdsSet);

                if (cardsToProcessIds.length === 0) {
                    alert("Место колоды задано, но нет помеченных или выделенных карт для обработки. Пожалуйста, выберите карты, чтобы начать колоду.");
                    return;
                }
                
                // Автоматически выделяем все эти карты для игрока
                await OBR.player.setSelection(cardsToProcessIds);
                console.log(`Automatically selected ${cardsToProcessIds.length} cards for processing.`);
            }

            // Получаем данные по всем ID, которые будут обрабатываться
            const actualCardsToProcess = (await OBR.scene.items.getItems(cardsToProcessIds)).filter(i => i.position);
            if (actualCardsToProcess.length === 0) {
                alert("Нет перемещаемых карт для обработки.");
                return;
            }

            // Перемешиваем массив ID обрабатываемых карт
            const shuffledIdsForUpdate = shuffleArray(actualCardsToProcess.map(card => card.id));

            // Массовое обновление
            await OBR.scene.items.updateItems(shuffledIdsForUpdate, (drafts) => {
                const uniqueZIndexes = new Set(); 
                
                drafts.forEach((item, index) => {
                    if (item.position) {
                        item.position = {
                            x: targetX,
                            y: targetY + (index * cardOffset) 
                        };

                        // Помечаем карту как часть колоды
                        item.metadata[METADATA_IS_DECK_CARD_KEY] = true;

                        let newZIndex = index;
                        while(uniqueZIndexes.has(newZIndex)) {
                            newZIndex += 0.0001; 
                        }
                        item.zIndex = newZIndex;
                        uniqueZIndexes.add(newZIndex);
                    }
                });
            });

            console.log(`Deck shuffled and positioned with offset: ${cardOffset}! Total cards processed: ${actualCardsToProcess.length}`);
            await updateDeckLocationDisplay();
        } catch (error) {
            console.error("Shuffle Error:", error);
        }
    });
});
