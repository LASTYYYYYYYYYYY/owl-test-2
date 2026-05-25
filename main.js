import OBR from "https://unpkg.com/@owlbear-rodeo/sdk@latest/dist/index.mjs";

async function gatherTokens() {

  const items = await OBR.scene.items.getItems();

  const selectedIds = await OBR.player.getSelection();

  const selected = items.filter(item =>
    selectedIds.includes(item.id)
  );

  if (selected.length === 0) {
    return;
  }

  // вычисляем центр всех токенов
  let sumX = 0;
  let sumY = 0;

  for (const item of selected) {
    sumX += item.position.x;
    sumY += item.position.y;
  }

  const centerX = sumX / selected.length;
  const centerY = sumY / selected.length;

  // переносим все токены в центр
  await OBR.scene.items.updateItems(
    selected.map(i => i.id),
    items => {
      for (const item of items) {
        item.position.x = centerX;
        item.position.y = centerY;
      }
    }
  );
}

OBR.onReady(() => {

  const button = document.getElementById("gather");

  button.addEventListener("click", async () => {
    await gatherTokens();
  });

});
