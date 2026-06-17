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
        const metadata = await OBR.room.getMetadata();
        const deckLocation = metadata[METADATA_DECK_LOCATION_KEY];
        if (deckLocation) {
            deckLocationDisplay.textContent = `Место колоды: X:${deckLocation.x.toFixed(0)}, Y:${deckLocation.y.toFixed(0)}`;
        } else {
            deckLocationDisplay.textContent = "Место колоды не задано";
        }
    };

    await updateDeckLocationDisplay();
    OBR.room.onMetadataChange(updateDeckLocationDisplay);

    shuffleButton.addEventListener("click", async () => {
        try {
            const cardOffset = parseInt(offsetSlider.value, 10);
            const roomMetadata = await OBR.room.getMetadata();
            let savedDeckLocation = roomMetadata[METADATA_DECK_LOCATION_KEY];

            let targetX, targetY;
            let cardsToProcess = [];
            const currentSelectionIds = await OBR.player.getSelection();

            if (rememberDeckLocationCheckbox.checked || !savedDeckLocation) {
                // Сценарий 1: Запоминаем новое место колоды ИЛИ место еще не задано
                if (!currentSelectionIds || currentSelectionIds.length === 0) {
                    alert("Пожалуйста, выберите карты, чтобы запомнить новое место колоды.");
                    rememberDeckLocationCheckbox.checked = false;
                    return;
                }

                const selectedItems = await OBR.scene.items.getItems(currentSelectionIds);
                cardsToProcess = selectedItems.filter(i => i.position);
                if (cardsToProcess.length === 0) {
                    alert("Пожалуйста, выберите карты, чтобы запомнить новое место колоды.");
                    rememberDeckLocationCheckbox.checked = false;
                    return;
                }

                // Определяем якорь из текущего выделения
                targetX = Math.min(...cardsToProcess.map(t => t.position.x));
                targetY = Math.min(...cardsToProcess.map(t => t.position.y));
                await OBR.room.setMetadata({
                    [METADATA_DECK_LOCATION_KEY]: { x: targetX, y: targetY }
                });
                savedDeckLocation = { x: targetX, y: targetY };
                console.log(`Deck location remembered: X:${targetX.toFixed(0)}, Y:${targetY.toFixed(0)}`);
                rememberDeckLocationCheckbox.checked = false; // Сбрасываем чекбокс
            } else {
                // Сценарий 2: Используем уже запомненное место колоды
                targetX = savedDeckLocation.x;
                targetY = savedDeckLocation.y;
                console.log(`Using remembered deck location: X:${targetX.toFixed(0)}, Y:${targetY.toFixed(0)}`);
                
                // Получаем ВСЕ элементы на сцене, чтобы найти помеченные карты
                const allItemIds = await OBR.scene.items.getAllItemIds();
                const allItems = await OBR.scene.items.getItems(allItemIds);
                
                // Отфильтровываем карты, которые помечены как часть колоды
                const markedDeckCards = allItems.filter(item => 
                    item.metadata[METADATA_IS_DECK_CARD_KEY] === true && item.position
                );

                // Если есть текущее выделение, добавляем его к обрабатываемым картам (если их еще нет)
                let selectedItems = [];
                if (currentSelectionIds && currentSelectionIds.length > 0) {
                    selectedItems = await OBR.scene.items.getItems(currentSelectionIds);
                    selectedItems = selectedItems.filter(i => i.position);
                }

                // Объединяем помеченные карты и текущее выделение (без дубликатов)
                const combinedCardsMap = new Map();
                markedDeckCards.forEach(card => combinedCardsMap.set(card.id, card));
                selectedItems.forEach(card => combinedCardsMap.set(card.id, card));
                
                cardsToProcess = Array.from(combinedCardsMap.values());

                if (cardsToProcess.length === 0) {
                    alert("Место колоды задано, но нет помеченных или выделенных карт для обработки.");
                    return;
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

            console.log(`Deck shuffled and positioned with offset: ${cardOffset}! Total cards processed: ${cardsToProcess.length}`);
            await updateDeckLocationDisplay();
        } catch (error) {
            console.error("Shuffle Error:", error);
        }
    });
});
