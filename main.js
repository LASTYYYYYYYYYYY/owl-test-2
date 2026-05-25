import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@3.1.0/+esm";

console.log("Gather & Shuffle: Loaded");

// Функция случайного перемешивания
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

            // 1. Находим самую верхнюю и левую точку среди всех выделенных токенов.
            // Это будет наш неподвижный "якорь".
            const anchorX = Math.min(...tokens.map(t => t.position.x));
            const anchorY = Math.min(...tokens.map(t => t.position.y));

            // 2. Перемешиваем массив ID
            const shuffledIds = shuffleArray([...selection]);

            // 3. Обновляем позиции
            // Используем индекс (i), чтобы задать смещение от фиксированного якоря
            await OBR.scene.items.updateItems(shuffledIds, (drafts) => {
                // ВАЖНО: updateItems возвращает drafts в том же порядке, в котором переданы ID.
                // Поэтому мы просто проходим по ним циклом с индексом.
                drafts.forEach((item, index) => {
                    if (item.position) {
                        item.position = {
                            x: anchorX,
                            y: anchorY + (index * 4) // Смещение 4px от фиксированного верха
                        };
                    }
                });
            });

            console.log("Shuffle complete. Anchor stayed at:", anchorX, anchorY);
        } catch (error) {
            console.error("Error:", error);
        }
    });
});
