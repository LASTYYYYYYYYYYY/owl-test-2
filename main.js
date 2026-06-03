import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@3.1.0/+esm";

console.log("Deck Shuffler: Loaded");

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

OBR.onReady(async () => {
    const shuffleButton = document.getElementById("shuffle");
    const offsetSlider = document.getElementById("offsetSlider");
    const offsetValueSpan = document.getElementById("offsetValue");

    offsetValueSpan.textContent = offsetSlider.value;

    offsetSlider.addEventListener("input", () => {
        offsetValueSpan.textContent = offsetSlider.value;
    });

    shuffleButton.addEventListener("click", async () => {
        try {
            const selection = await OBR.player.getSelection();
            if (!selection || selection.length === 0) return;

            const items = await OBR.scene.items.getItems(selection);
            // Фильтруем только те элементы, у которых есть позиция
            const tokens = items.filter(i => i.position);
            if (tokens.length === 0) return;

            const cardOffset = parseInt(offsetSlider.value, 10);

            // 1. Фиксируем точку якоря
            const anchorX = Math.min(...tokens.map(t => t.position.x));
            const anchorY = Math.min(...tokens.map(t => t.position.y));

            // 2. Перемешиваем копию массива ID
            const shuffledIds = shuffleArray([...tokens.map(t => t.id)]);

            // 3. Создаем "карту соответствия": ID элемента -> его новое место в стопке
            const orderMap = {};
            shuffledIds.forEach((id, index) => {
                orderMap[id] = index;
            });

            // 4. Массовое обновление
            await OBR.scene.items.updateItems(selection, (drafts) => {
                drafts.forEach((item) => {
                    if (item.position && orderMap[item.id] !== undefined) {
                        const newIndex = orderMap[item.id];
                        
                        // Устанавливаем координаты
                        item.position = {
                            x: anchorX,
                            y: anchorY + (newIndex * cardOffset) 
                        };

                        // ПЕРЕМЕШИВАЕМ Z-ORDER
                        // Теперь мы берем индекс именно из перемешанного словаря
                        item.zIndex = newIndex; 
                    }
                });
            });

            console.log(`Deck shuffled! Offset: ${cardOffset}`);
        } catch (error) {
            console.error("Shuffle Error:", error);
        }
    });
});
