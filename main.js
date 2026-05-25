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
    const button = document.getElementById("gather");

    button.addEventListener("click", async () => {
        try {
            const selection = await OBR.player.getSelection();
            if (!selection || selection.length === 0) return;

            const items = await OBR.scene.items.getItems(selection);
            const tokens = items.filter(i => i.position);
            if (tokens.length === 0) return;

            // 1. Фиксируем точку якоря (самый верхний левый угол выделения)
            const anchorX = Math.min(...tokens.map(t => t.position.x));
            const anchorY = Math.min(...tokens.map(t => t.position.y));

            // 2. Перемешиваем массив ID случайным образом
            const shuffledIds = shuffleArray([...selection]);

            // 3. Массовое обновление
            await OBR.scene.items.updateItems(shuffledIds, (drafts) => {
                // ВАЖНО: drafts здесь идут в том порядке, который мы задали в shuffledIds
                drafts.forEach((item, index) => {
                    if (item.position) {
                        // Устанавливаем координаты
                        item.position = {
                            x: anchorX,
                            y: anchorY + (index * 4) 
                        };

                        // ПЕРЕМЕШИВАЕМ Z-ORDER (Ось Z)
                        // Присваиваем zIndex на основе индекса в перемешанном массиве.
                        // Чем выше индекс, тем "выше" карта визуально.
                        item.zIndex = index; 
                    }
                });
            });

            console.log("Deck shuffled on Y and Z axis!");
        } catch (error) {
            console.error("Shuffle Error:", error);
        }
    });
});
