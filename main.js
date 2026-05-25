import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@3.1.0/+esm";

console.log("Gather Extension: Script Loaded");

OBR.onReady(async () => {
    console.log("Gather Extension: OBR Ready");

    const button = document.getElementById("gather");

    button.addEventListener("click", async () => {
        try {
            const selection = await OBR.player.getSelection();
            if (!selection || selection.length === 0) return;

            const items = await OBR.scene.items.getItems(selection);
            const movableItems = items.filter(i => i.position);
            if (movableItems.length === 0) return;

            const targetX = movableItems[0].position.x;
            const targetY = movableItems[0].position.y;

            let currentOffset = 0;

            await OBR.scene.items.updateItems(selection, (drafts) => {
                for (const item of drafts) {
                    if (item.position) {
                        item.position.x = targetX;
                        item.position.y = targetY + currentOffset;
                        
                        // Вот здесь задается расстояние. 
                        // Если хочешь, чтобы они лежали почти друг на друге — ставь 4.
                        currentOffset += 4; 
                    }
                }
            });

            console.log("Success: Items gathered with 4px offset");
        } catch (error) {
            console.error("Gather Error:", error);
        }
    });
});
